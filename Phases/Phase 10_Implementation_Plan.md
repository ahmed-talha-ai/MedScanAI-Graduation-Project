# MediScan AI Web — Phase 10 Implementation Plan
## Streaming · Full Arabic i18n · Backend Persistence · Universal Response Formatting

<aside>
📌

**Appends to:** Phases 7–9 Implementation README
**Affects:** `mediscan-web` (Next.js) + `MedScanAI-master` (.NET 8) + all 6 Python AI microservices + `MedScanAIFrontEnd-main` (React)
**Reference behavior:** The Reports page (`/dashboard/reports`) is the gold standard for how AI output must look and be handled. Every other AI screen must match it — do not change the Reports page itself.
**Constraint:** `MedScanAIFrontEnd-main` must receive every update that `mediscan-web` receives for streaming, formatting, and persistence — no divergence between the two frontends.

</aside>

## Scope summary

| Sub-phase | Title | Layers touched |
| --- | --- | --- |
| **10.1** | Python microservice streaming + sanitization | 6 Python files |
| **10.2** | .NET streaming proxy | `AIController.cs` + new controllers |
| **10.3** | Next.js streaming frontend | `aiService.ts`, `reportService.ts`, tool page, chatbot, report page |
| **10.4** | React frontend streaming parity (`MedScanAIFrontEnd-main`) | Mirror of 10.3 |
| **10.5** | Backend persistence (.NET entities + endpoints) | 4 new entities, 3 new controllers, EF migration |
| **10.6** | Frontend persistence wiring (auto-save after stream) | Both frontends |
| **10.7** | Full Arabic i18n — `mediscan-web` | All 26 routes, `messages/ar.json` |
| **10.8** | Full Arabic i18n — `MedScanAIFrontEnd-main` | All React components |

---

# Phase 10.1 — Python Microservice: Streaming + Sanitization

## Goal

Every Python FastAPI endpoint that produces text must:
1. Stream tokens to the client as they are generated (Server-Sent Events)
2. Strip `<think>` blocks and all HTML before any text reaches the wire
3. Return pure, clean Markdown — no raw HTML, no `<br>`, no escaped tags

> **Import note:** `from fastapi.responses import StreamingResponse` is already available via FastAPI — no extra pip install (e.g. `sse-starlette`) is needed.

## Critical Architecture Decision: New `/predict/stream` Endpoint

Each of the 4 image microservices **must keep the existing `/predict` endpoint unchanged** for backward compatibility. The `.NET AIService.cs` currently calls `/predict` and deserializes the JSON response via `JsonSerializer.Deserialize<ModelResponse>`. Switching `/predict` to return SSE would break the existing pipeline.

**Solution:** Add a **new** `/predict/stream` endpoint alongside `/predict`:
- `/predict` — unchanged, returns `PredictionResponse` JSON (backward compat)
- `/predict/stream` — new, returns `text/event-stream` SSE (used by the .NET streaming proxy in Phase 10.2)

Both endpoints share the same classification logic. Only the advice text generation differs: `/predict` collects the full text, `/predict/stream` yields it token-by-token.

## Streaming Pattern for the 4 Image Microservices

All 4 image microservices (Brain Tumor, Breast Cancer, X-ray, DermNet) use `huggingface_hub.InferenceClient.chat_completion()` which currently returns a complete `ChatCompletionOutput` object. The `InferenceClient` **does** support `stream=True` which returns an iterable of `ChatCompletionStreamOutput` chunks.

### Exact code change pattern (same for all 4):

```python
# In the AdviceService class — add a NEW streaming method alongside existing generate_advice():

def generate_advice_stream(self, disease_en: str, disease_ar: str, confidence: float, user_role: UserRole = UserRole.patient):
    """Generator that yields advice tokens one at a time. Blocks (not async)."""
    confidence_pct = f"{confidence * 100:.1f}%"

    # --- Hardcoded fast-path cases (No Tumor / Normal / Benign) ---
    # These skip the LLM entirely. Use simulated streaming for consistent UX.
    hardcoded = self._get_hardcoded_response(disease_en, confidence, confidence_pct, user_role)
    if hardcoded is not None:
        # Yield the hardcoded text word-by-word (simulated streaming)
        for word in hardcoded.split(' '):
            yield word + ' '
        return

    # --- LLM streaming path ---
    messages = self._build_messages(disease_en, disease_ar, confidence_pct, user_role)

    try:
        # KEY CHANGE: stream=True returns an iterable of ChatCompletionStreamOutput
        stream = self.client.chat_completion(
            model=self.model_id,
            messages=messages,
            max_tokens=800,
            temperature=0.4,
            stream=True   # <-- THIS IS THE CRITICAL CHANGE
        )

        # Accumulate tokens, suppress <think> block at the start
        in_think_block = False
        think_seen = False
        for chunk in stream:
            token = chunk.choices[0].delta.content or ""
            if not token:
                continue

            # Handle <think> blocks: accumulate silently until </think> is found
            if not think_seen:
                if "<think>" in token:
                    in_think_block = True
                    continue
                if in_think_block:
                    if "</think>" in token:
                        in_think_block = False
                        think_seen = True
                        # Extract any text AFTER </think> in this token
                        after = token.split("</think>", 1)[1]
                        if after.strip():
                            yield after
                    continue

            # Normal token — yield it directly
            yield token

    except Exception as e:
        logger.error(f"DeepSeek Streaming Error: {e}")
        fallback = self._get_error_fallback(disease_en, disease_ar, user_role)
        for word in fallback.split(' '):
            yield word + ' '
```

### The new `/predict/stream` endpoint:

```python
from fastapi.responses import StreamingResponse
from stream_utils import make_metadata_event, make_text_event, make_done_event, sanitize_chunk

@app.post("/predict/stream")
async def predict_stream(
    file: UploadFile = File(...),
    user_role: UserRole = Query(default=UserRole.patient)
):
    """SSE streaming endpoint — returns text/event-stream."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, detail="Invalid file type.")

    contents = await file.read()
    img_array = model_service.preprocessor.preprocess(contents)
    label_en, confidence = model_service.predict(img_array)
    label_ar = ARABIC_DISEASE_NAMES.get(label_en, label_en)

    def event_generator():
        # 1. Emit metadata (classification result) immediately
        yield make_metadata_event(
            label=label_en,
            confidence=round(confidence, 4),
            model="brain-tumor"  # or "breast-cancer", "xray", "dermnet"
        )

        # 2. Stream advice tokens
        for token in advice_service.generate_advice_stream(label_en, label_ar, confidence, user_role):
            clean = sanitize_chunk(token)
            if clean:
                yield make_text_event(clean)

        # 3. Signal completion
        yield make_done_event()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        }
    )
```

> **Important:** The generator in `event_generator()` is a **synchronous** generator (not `async def`) because `InferenceClient.chat_completion(stream=True)` returns a blocking iterable. `StreamingResponse` accepts both sync and async iterables.

### Hardcoded fallback streaming

The "No Tumor", "Normal", and "Benign" (high confidence) cases return hardcoded strings without calling the LLM. These **must still be streamed** via the simulated word-by-word path (shown above as `for word in hardcoded.split(' '): yield word + ' '`) so the frontend always receives the same SSE protocol. The `stream_text_chunks()` utility in `stream_utils.py` provides this for async contexts.

## `<think>` Block Handling Strategy

DeepSeek-R1 generates `<think>...</think>` blocks at the **start** of the response. The correct strategy is:

1. **Accumulate silently** — when `<think>` is detected in the first tokens, suppress all output.
2. **Resume on `</think>`** — after the closing tag, start yielding tokens to the client.
3. **Timeout fallback** — if no `</think>` is seen after 50 tokens, assume the model didn't use a think block and start yielding.

This is simpler and more reliable than maintaining a regex `think_buffer` across SSE chunks. The regex-based `sanitize_chunk()` in `stream_utils.py` serves as a **second safety net** for any `<think>` fragments that slip through.

## Files

### `Brain Tumer/main.py`

- **Keep** the existing `/predict` endpoint unchanged (returns `PredictionResponse` JSON)
- **Add** `/predict/stream` endpoint using the pattern above with `model="brain-tumor"`
- **Add** `generate_advice_stream()` method to `AdviceService`
- **Refactor** `_get_hardcoded_response()` and `_build_messages()` as private helper methods extracted from the current `generate_advice()` — both the sync and streaming paths share them
- `UserRole` enum already accepts both casings — verified present (lines 31-35)

### `Breast cancer/main.py`

Same pattern as Brain Tumor — add `/predict/stream` + `generate_advice_stream()`. Model tag: `"breast-cancer"`.

### `X-ray/main.py`

Same pattern. Model tag: `"xray"`. `UserRole` enum already has both casings (lines 26-30).

### `DermNet/main.py`

Same pattern. Model tag: `"dermnet"`. DermNet may produce longer per-class explanations — the streaming yield from `InferenceClient` is already token-level, which is fine.

### `Agentic-Medical-RAG-Chatbot-main/api/medical_report.py`

- The `/doctor-report` GET endpoint must stream the LLM output using `StreamingResponse`
- The `FallbackAwareLLM` in `src/fallback_llm.py` **already implements `_stream()`** (lines 172-228), which means LangChain's `BaseChatModel.astream()` default implementation will work. **No changes needed to `FallbackAwareLLM`** — just call `LLM.astream(prompt)` instead of `LLM.invoke(prompt)`.
- The `force_refresh` logic must be preserved:
  - If cached report exists and `force_refresh=false` → stream the cached text using `stream_text_chunks()` (simulate streaming in 5-word chunks with `asyncio.sleep(0)`)
  - If `force_refresh=true` or no cache → stream live from `LLM.astream(prompt)`, accumulate full text in parallel, then save to DB via `BackgroundTasks` after stream ends
- Stream format: same SSE structure as image models (metadata event with `model="medical-report"`, then text events, then done)
- Sanitization: same `sanitize_chunk` applied to every yielded chunk

### `Agentic-Medical-RAG-Chatbot-main/api/chat.py`

- The current `/chat` endpoint collects the full response by iterating `async for chunk in agent["stream"](...)` and concatenating into `full_response` — it does NOT stream to the client
- **Change:** Wrap the existing agent streaming in SSE format and return `StreamingResponse` instead of collecting into `full_response`
- The `<think>` block handling uses the same accumulate-until-`</think>` pattern (not a regex buffer between chunks)
- Apply `sanitize_chunk` to each chunk before yielding
- Cache is only populated after the full response is assembled (use `BackgroundTasks`)

### `Agentic-Medical-RAG-Chatbot-main/api/image_analysis.py`

- The `/analyze` Lab OCR endpoint: after OCR extraction, stream the AI interpretation text
- Same SSE format, same sanitization

## Shared utility — `stream_utils.py`

### Deployment: One copy per microservice folder

The 4 image microservices (`Brain Tumer/`, `Breast cancer/`, `X-ray/`, `DermNet/`) are **separate independent projects** — each runs as its own `uvicorn` process with no shared import path to the RAG system or each other. They **cannot** import from `Agentic-Medical-RAG-Chatbot-main/src/`.

**Solution:** Place an identical copy of `stream_utils.py` in each folder that needs it:

| Copy # | Location |
| --- | --- |
| 1 | `Brain Tumer/stream_utils.py` |
| 2 | `Breast cancer/stream_utils.py` |
| 3 | `X-ray/stream_utils.py` |
| 4 | `DermNet/stream_utils.py` |
| 5 | `Agentic-Medical-RAG-Chatbot-main/src/stream_utils.py` |

All 5 copies are **identical**. Each microservice does `from stream_utils import ...` (local import).

### `stream_utils.py` content:

```python
import re
import json
import asyncio
from typing import AsyncGenerator

def sanitize_chunk(text: str) -> str:
    """Strip <think> blocks, <br> tags, and any remaining HTML."""
    text = re.sub(r'<think>[\s\S]*?(?:</think>|$)', '', text)
    text = re.sub(r'<br\s*/?>', '\n', text)
    text = re.sub(r'<[^>]+>', '', text)
    return text

def make_metadata_event(label: str, confidence: float, model: str) -> str:
    """Create SSE event for classification metadata."""
    payload = json.dumps({"label": label, "confidence": confidence, "model": model, "type": "metadata"})
    return f"data: {payload}\n\n"

def make_text_event(chunk: str) -> str:
    """Create SSE event for a text chunk (auto-sanitized)."""
    payload = json.dumps({"text": sanitize_chunk(chunk), "type": "text"})
    return f"data: {payload}\n\n"

def make_done_event() -> str:
    """Create SSE termination event."""
    return 'data: {"type":"done"}\n\n'

async def stream_text_chunks(text: str, chunk_size_words: int = 5) -> AsyncGenerator[str, None]:
    """Split pre-generated text into word chunks and yield as SSE events.
    Used for cached reports and hardcoded fallback responses."""
    words = text.split(' ')
    chunk = []
    for word in words:
        chunk.append(word)
        if len(chunk) >= chunk_size_words:
            yield make_text_event(' '.join(chunk) + ' ')
            chunk = []
            await asyncio.sleep(0)
    if chunk:
        yield make_text_event(' '.join(chunk))
    yield make_done_event()
```

# Phase 10.2 — .NET Streaming Proxy

## Goal

The .NET API layer must forward Python SSE responses to the frontend **without buffering**. The existing MediatR/CQRS pipeline materializes full `ReturnBase<T>` response objects, making it fundamentally incompatible with streaming. A new streaming-specific controller must bypass MediatR entirely.

## Current State Analysis

### `AIController.cs` — Current action method signatures:
```csharp
[HttpPost] public async Task<IActionResult> GetBrainTumorDiagnose([FromForm] BrainTumorModelQuery query)
[HttpPost] public async Task<IActionResult> GetBreastCancerDiagnose([FromForm] BreastCancerModelQuery query)
[HttpPost] public async Task<IActionResult> GetXRayDiagnose([FromForm] XRayModelQuery query)
[HttpPost] public async Task<IActionResult> GetDermatologyDiagnose([FromForm] DermatologyModelQuery query)
[HttpPost] public async Task<IActionResult> GetLabResults([FromForm] LabResultsModelQuery query)
[HttpPost] public async Task<IActionResult> GetChatbotResponse([FromBody] ChatbotQuery query)
[HttpPost] public async Task<IActionResult> GenerateMedicalReport([FromBody] AddMedicalReportCommand command)
```

Every method calls `Mediator.Send(query)` → returns `ReturnResult(result)`. The `ReturnResult()` method in `AppControllerBase` wraps the response in an `ObjectResult` (fully buffered JSON).

### `AIQueryHandler.cs` — How MediatR buffers:
Each handler awaits `_aIService.GetXxxAsync()` which returns `ReturnBase<ModelResponse>`. This is a **complete materialized object** — the entire Python response is deserialized into C# before returning to the controller. Streaming is impossible through this pipeline.

### `AIService.cs` — HttpClient usage:
```csharp
// Line 14 — STATIC singleton HttpClient (NOT using IHttpClientFactory)
private static readonly HttpClient _httpClient = new();

// Line 251-297 — GetModelResponseAsync (used by all 4 image endpoints):
var response = await _httpClient.PostAsync(url, formData);    // Full buffering
var responseJson = await response.Content.ReadAsStringAsync(); // Full buffering
var modelResponse = JsonSerializer.Deserialize<ModelResponse>(responseJson);
```

### `Program.cs` — DI registration:
```csharp
builder.Services.AddHttpClient(); // Line 64 — registers IHttpClientFactory
```

`IHttpClientFactory` is registered but **never used** by `AIService`. The static `HttpClient` cannot be configured per-request. For streaming, we need `IHttpClientFactory` to create properly configured clients.

## Architecture Decision: Keep Existing + Add Streaming Controller

**Do NOT modify `AIController.cs`, `AIQueryHandler.cs`, or `AIService.cs`.**

The existing buffered pipeline remains for:
- Backward compatibility with the `MedScanAIFrontEnd-main` React app (until Phase 10.4 migrates it)
- Any non-streaming clients that consume the JSON API
- The MediatR validation pipeline (if any validators exist)

**Instead:** Add a **new** `AIStreamController.cs` that:
- Bypasses MediatR entirely
- Injects `IHttpClientFactory` for streaming-capable `HttpClient` instances
- Calls the new Python `/predict/stream` endpoints (from Phase 10.1)
- Writes SSE directly to `Response.Body`

## [NEW] `MedScanAI.API/Controllers/AIStreamController.cs`

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Net.Http.Headers;

namespace MedScanAI.API.Controllers
{
    [Route("api/ai-stream/[action]")]
    [ApiController]
    [EnableRateLimiting("SlidingWindowPolicy")]
    [Authorize(Roles = "Patient,Doctor")]
    public class AIStreamController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;

        public AIStreamController(IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
        }

        // ── Shared streaming proxy method ──────────────────────────────────
        private async Task StreamFromPython(
            string pythonUrl,
            IFormFile image,
            string userRole,
            CancellationToken cancellationToken)
        {
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromMinutes(3); // LLM may take time

            // Build multipart form data
            using var formData = new MultipartFormDataContent();
            await using var imageStream = image.OpenReadStream();
            var imageBytes = new byte[image.Length];
            await imageStream.ReadAsync(imageBytes, cancellationToken);
            var imageContent = new ByteArrayContent(imageBytes);
            imageContent.Headers.ContentType = new MediaTypeHeaderValue(
                image.ContentType ?? "image/jpeg"
            );
            formData.Add(imageContent, "file", image.FileName);

            // Build request with user_role query param
            var url = $"{pythonUrl}?user_role={userRole}";
            using var request = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Content = formData
            };

            // KEY: ResponseHeadersRead prevents buffering the entire response
            using var response = await client.SendAsync(
                request,
                HttpCompletionOption.ResponseHeadersRead,
                cancellationToken
            );

            if (!response.IsSuccessStatusCode)
            {
                Response.StatusCode = (int)response.StatusCode;
                var error = await response.Content.ReadAsStringAsync(cancellationToken);
                await Response.WriteAsync(error, cancellationToken);
                return;
            }

            // Forward SSE headers
            Response.StatusCode = 200;
            Response.ContentType = "text/event-stream";
            Response.Headers.Append("Cache-Control", "no-cache");
            Response.Headers.Append("X-Accel-Buffering", "no");
            Response.Headers.Append("Connection", "keep-alive");

            // Stream bytes directly — no buffering
            await response.Content.CopyToAsync(Response.Body, cancellationToken);
        }

        // ── Image model endpoints ──────────────────────────────────────────

        [HttpPost]
        public async Task GetBrainTumorDiagnose(
            IFormFile image,
            [FromQuery] string userRole = "Patient",
            CancellationToken cancellationToken = default)
        {
            await StreamFromPython(
                "http://localhost:8001/predict/stream",
                image, userRole, cancellationToken);
        }

        [HttpPost]
        public async Task GetBreastCancerDiagnose(
            IFormFile image,
            [FromQuery] string userRole = "Patient",
            CancellationToken cancellationToken = default)
        {
            await StreamFromPython(
                "http://localhost:8006/predict/stream",
                image, userRole, cancellationToken);
        }

        [HttpPost]
        public async Task GetXRayDiagnose(
            IFormFile image,
            [FromQuery] string userRole = "Patient",
            CancellationToken cancellationToken = default)
        {
            await StreamFromPython(
                "http://localhost:8002/predict/stream",
                image, userRole, cancellationToken);
        }

        [HttpPost]
        public async Task GetDermatologyDiagnose(
            IFormFile image,
            [FromQuery] string userRole = "Patient",
            CancellationToken cancellationToken = default)
        {
            await StreamFromPython(
                "http://localhost:8000/predict/stream",
                image, userRole, cancellationToken);
        }

        [HttpPost]
        public async Task GetLabResults(
            IFormFile image,
            [FromQuery] string userRole = "Patient",
            CancellationToken cancellationToken = default)
        {
            await StreamFromPython(
                "http://localhost:8005/images/analyze/stream",
                image, userRole, cancellationToken);
        }

        // ── Chatbot streaming ──────────────────────────────────────────────

        [HttpPost]
        public async Task GetChatbotResponse(
            [FromBody] ChatStreamRequest body,
            CancellationToken cancellationToken = default)
        {
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromMinutes(3);

            var jsonContent = new StringContent(
                System.Text.Json.JsonSerializer.Serialize(new { message = body.Message }),
                System.Text.Encoding.UTF8,
                "application/json"
            );

            var url = $"http://localhost:8005/chat/stream?user_role={body.UserRole}";
            using var request = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Content = jsonContent
            };

            using var response = await client.SendAsync(
                request,
                HttpCompletionOption.ResponseHeadersRead,
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                Response.StatusCode = (int)response.StatusCode;
                var error = await response.Content.ReadAsStringAsync(cancellationToken);
                await Response.WriteAsync(error, cancellationToken);
                return;
            }

            Response.StatusCode = 200;
            Response.ContentType = "text/event-stream";
            Response.Headers.Append("Cache-Control", "no-cache");
            Response.Headers.Append("X-Accel-Buffering", "no");

            await response.Content.CopyToAsync(Response.Body, cancellationToken);
        }
    }

    // ── Request DTOs for the streaming controller ──────────────────────────
    public record ChatStreamRequest(string Message, string UserRole = "Patient");
}
```

## Key Design Decisions

### 1. MediatR is bypassed entirely
The streaming controller inherits from `ControllerBase` (NOT `AppControllerBase`). It has no `Mediator` property. Each action method directly constructs `HttpClient` requests and streams the response. This is the only correct approach — MediatR's `IRequestHandler<TRequest, TResponse>` pattern requires a materialized `TResponse` return value.

### 2. `IHttpClientFactory` instead of static `HttpClient`
The existing `AIService.cs` uses `private static readonly HttpClient _httpClient = new()` which:
- Cannot have per-request timeout configuration
- May have stale DNS issues in long-running processes
- Cannot be configured via DI

The streaming controller injects `IHttpClientFactory` (already registered in `Program.cs` line 64) and creates a client per request with `client.Timeout = TimeSpan.FromMinutes(3)` to handle slow LLM responses.

### 3. Action methods return `Task` (not `Task<IActionResult>`)
Streaming endpoints write directly to `Response.Body` via `CopyToAsync`. There is no `IActionResult` to return — the response is already flushed. Returning `Task` (void) is the correct signature for this pattern.

### 4. Route prefix: `/api/ai-stream/[action]`
The existing `/api/ai/[action]` stays untouched. The new streaming endpoints are at `/api/ai-stream/[action]`:
- `/api/ai/GetBrainTumorDiagnose` — existing, returns JSON (backward compat)
- `/api/ai-stream/GetBrainTumorDiagnose` — new, returns SSE stream

The frontend (Phase 10.3) switches to calling `/api/ai-stream/...` for streaming support.

### 5. Error handling for non-2xx Python responses
If the Python microservice returns an error (e.g. 400, 500), the streaming controller forwards the status code and error body as-is to the frontend. The frontend must handle non-`text/event-stream` responses gracefully.

### 6. `Response.Headers.Append()` instead of `.Add()`
ASP.NET Core 8 uses `Append()` to safely add headers. Using `.Add()` on headers like `Cache-Control` that may already exist throws an `InvalidOperationException`.

## [KEEP UNCHANGED] `MedScanAI.API/Controllers/AIController.cs`

The existing `AIController` with its MediatR pipeline stays exactly as-is. It serves:
- The React frontend (`MedScanAIFrontEnd-main`) until Phase 10.4 migrates it to streaming
- Any API consumers that expect JSON responses
- The `GenerateMedicalReport` command (report persistence — not a streaming use case)

## [KEEP UNCHANGED] `AIQueryHandler.cs` and `AIService.cs`

No changes. These continue to serve the buffered JSON pipeline via `AIController`.

## Port Map Reference

| Python Service | Port | Old Endpoint (JSON) | New Endpoint (SSE) |
| --- | --- | --- | --- |
| DermNet | 8000 | `/predict` | `/predict/stream` |
| Brain Tumor | 8001 | `/predict` | `/predict/stream` |
| X-ray | 8002 | `/predict` | `/predict/stream` |
| Breast Cancer | 8006 | `/predict` | `/predict/stream` |
| RAG Chatbot | 8005 | `/chat` | `/chat/stream` |
| RAG Lab OCR | 8005 | `/images/analyze` | `/images/analyze/stream` |
| RAG Report | 8005 | `/report/{id}/doctor-report` | `/report/{id}/doctor-report/stream` |

## New controllers (Phase 10.5 — listed here for completeness)

- `ReportController.cs` — persistence (non-streaming), standard CQRS
- `DiagnosisController.cs` — persistence (non-streaming), standard CQRS
- `ChatController.cs` — persistence (non-streaming), standard CQRS

These are **separate from** `AIStreamController.cs` and handle saving results after streaming ends.

---

# Phase 10.3 — Next.js Streaming Frontend (`mediscan-web`)

## Current State Analysis

### What exists today — key findings from code analysis:

1. **No SSE streaming anywhere.** The Reports page uses `reportService.fetchReportText()` → standard `ragClient.get()` → full JSON response. All AI calls use `apiClient.post()` (axios) → full JSON.

2. **No shared `MarkdownLite` component.** The markdown rendering logic (`parseBold`, table parsing, `## heading`, `- bullet`, etc.) is **duplicated** in:
   - `dashboard/reports/page.tsx` → local `ReportText` component (RTL Arabic, `dir="rtl"`)
   - `components/doctor/ReportDrawer.tsx` → local `ReportText` component (LTR English, `dir="ltr"`)
   Neither is importable as a shared component.

3. **Base URL:** `apiClient` uses `NEXT_PUBLIC_API_BASE_URL || 'https://localhost:7196/api'`. Service calls use relative paths like `/ai/GetBrainTumorDiagnose`.

4. **Current endpoint URL patterns in `aiService.ts`:**
   - `apiClient.post('/ai/GetBrainTumorDiagnose', formData)` — axios, full buffering
   - `apiClient.post('/ai/GetXRayDiagnose', formData)` — same
   - `apiClient.post('/ai/GetBreastCancerDiagnose', formData)` — same
   - `apiClient.post('/ai/GetDermatologyDiagnose', formData)` — same
   - `apiClient.post('/ai/GetLabResults', formData)` — same
   - `apiClient.post('/ai/GetChatbotResponse', { message, userRole })` — same

5. **`reportService.ts` calls Python RAG directly** at `http://localhost:8005` via a separate `ragClient` axios instance — does NOT go through .NET for report text fetching.

---

## Part 1 — [NEW] `src/components/ui/MarkdownRenderer.tsx`

Extract the duplicated `ReportText` local component into a shared, reusable component.

**Source:** The `ReportText` function in `dashboard/reports/page.tsx` (lines 12-141) — this is the more complete version with stagger animations.

### Props:

```typescript
interface MarkdownRendererProps {
  text: string;
  dir?: 'rtl' | 'ltr';    // default 'rtl'
  lang?: string;           // default 'ar'
  animated?: boolean;      // default true — stagger fade-in per element
  streaming?: boolean;     // default false — shows blinking cursor at end
}
```

### Markdown constructs handled (same as existing `ReportText`):

| Construct | Rendering |
| --- | --- |
| `**bold**` | `<strong className="text-on-surface font-semibold">` |
| `## heading` | `<h2 className="text-xl font-bold text-primary">` |
| `### heading` | `<h3 className="text-base font-bold text-on-surface">` |
| `- bullet` or `• bullet` | `<li>` with primary-colored `•` |
| `1. numbered` | `<li>` with bold primary number |
| `> blockquote` | `<blockquote>` with `border-s-4 border-primary/50` |
| `---` or `***` | `<hr>` separator |
| `\| table \|` | Full `<table>` with headers, borders, hover rows |
| `\n\n` (empty line) | `<div className="h-2" />` spacer |
| plain text | `<p className="text-on-surface-variant">` |

### Streaming cursor:

When `streaming === true`, append after the last element:
```tsx
<span className="inline-block w-0.5 h-4 bg-primary animate-pulse ms-0.5 align-text-bottom" />
```

### `<think>` sanitization:

The component strips `<think>...</think>` blocks on input (same regex as existing):
```typescript
const cleanText = text.replace(/<think>[\s\S]*?(<\/think>|$)/g, '').trim();
```

### After creation — remove duplication:

| File | Change |
| --- | --- |
| `dashboard/reports/page.tsx` | Delete local `ReportText` (lines 12-141). Import `MarkdownRenderer` from `@/components/ui/MarkdownRenderer`. Replace `<ReportText text={report.report} />` with `<MarkdownRenderer text={report.report} dir="rtl" lang="ar" />` |
| `components/doctor/ReportDrawer.tsx` | Delete local `ReportText` (lines 8-126). Import `MarkdownRenderer`. Replace usage with `<MarkdownRenderer text={text} dir="ltr" lang="en" animated={false} />` |

---

## Part 2 — [MODIFY] `src/services/aiService.ts`

### Keep all existing axios functions unchanged

The existing `diagnoseBrainTumor()`, `diagnoseXRay()`, `diagnoseBreastCancer()`, `diagnoseDermatology()`, `analyzeLabResults()`, and `chatbotMessage()` stay as-is. They serve the non-streaming fallback path and are used until the streaming UI is fully tested.

### Add new streaming types and generator

```typescript
// ─── Streaming types ──────────────────────────────────────────────────────────

export interface AiStreamChunk {
  type: 'metadata' | 'text' | 'done';
  label?: string;
  confidence?: number;
  model?: string;
  text?: string;
}

// ─── Base URL for streaming (same .NET backend, different route prefix) ──────
const STREAM_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://localhost:7196/api')
  .replace(/\/api\/?$/, '/api/ai-stream');

/** Read JWT from cookie — same logic as axios interceptor in lib/axios.ts */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  const cookie = document.cookie.split(';').find(c => c.trim().startsWith('mediscan_token='));
  return cookie?.split('=')[1]?.trim() ?? null;
}

// ─── SSE streaming generator ─────────────────────────────────────────────────

export async function* streamAiEndpoint(
  action: string,
  body: FormData | Record<string, unknown>,
  signal?: AbortSignal
): AsyncGenerator<AiStreamChunk> {
  const url = `${STREAM_BASE}/${action}`;
  const isFormData = body instanceof FormData;
  const token = getAuthToken();

  const headers: Record<string, string> = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `bearer ${token}`;

  const res = await fetch(url, {
    method: 'POST',
    body: isFormData ? body : JSON.stringify(body),
    headers,
    signal,
  });

  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        yield JSON.parse(line.slice(6)) as AiStreamChunk;
      } catch { /* malformed chunk — skip */ }
    }
  }
}
```

### Streaming URL mapping (action parameter → .NET route)

| Frontend call | `action` param | Full URL |
| --- | --- | --- |
| Brain Tumor | `'GetBrainTumorDiagnose'` | `/api/ai-stream/GetBrainTumorDiagnose` |
| X-Ray | `'GetXRayDiagnose'` | `/api/ai-stream/GetXRayDiagnose` |
| Breast Cancer | `'GetBreastCancerDiagnose'` | `/api/ai-stream/GetBreastCancerDiagnose` |
| Skin Disease | `'GetDermatologyDiagnose'` | `/api/ai-stream/GetDermatologyDiagnose` |
| Lab OCR | `'GetLabResults'` | `/api/ai-stream/GetLabResults` |
| Chatbot | `'GetChatbotResponse'` | `/api/ai-stream/GetChatbotResponse` |

### Key design notes:

1. **Auth token must be passed manually.** The existing `apiClient` axios instance attaches JWT via an interceptor. `fetch()` doesn't go through axios, so `streamAiEndpoint` reads the token from the cookie directly (same logic as `lib/axios.ts` lines 18-27).

2. **`FormData` for image uploads.** The streaming call uses `FormData` with field `image` (lowercase) matching `AIStreamController.cs`'s `IFormFile image` parameter. The existing axios calls use `Image` (uppercase) matching MediatR `[FromForm]`. The field names differ between the two controllers.

3. **Base URL transformation.** `STREAM_BASE` replaces `/api` suffix with `/api/ai-stream` so that `action` names like `GetBrainTumorDiagnose` map directly to the `[action]` route template in `AIStreamController`.

### [MODIFY] `src/services/reportService.ts`

Add `streamMedicalReport` function. The report endpoint is on the **Python RAG** service directly (port 8005), not via .NET, so it uses its own URL:

```typescript
import { streamAiEndpoint, type AiStreamChunk } from '@/services/aiService';

const RAG_BASE = process.env.NEXT_PUBLIC_RAG_URL ?? 'http://localhost:8005';

export async function* streamMedicalReport(
  patientId: string,
  userRole: 'patient' | 'doctor' = 'patient',
  forceRefresh: boolean = true,
  signal?: AbortSignal
): AsyncGenerator<AiStreamChunk> {
  const url = `${RAG_BASE}/report/${patientId}/doctor-report/stream?user_role=${userRole}&force_refresh=${forceRefresh}`;

  const res = await fetch(url, { method: 'GET', signal });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        yield JSON.parse(line.slice(6)) as AiStreamChunk;
      } catch { /* skip */ }
    }
  }
}
```

> **Note:** `streamMedicalReport` calls the Python RAG `/report/{id}/doctor-report/stream` endpoint directly (GET, no auth needed) — same as the existing `fetchReportText` which also calls Python directly. It does NOT go through the .NET streaming proxy.

---

## Part 3 — [MODIFY] `src/app/[locale]/(app)/dashboard/ai-tools/[tool]/page.tsx`

### Current state (lines 277-283):

```typescript
const SERVICE_MAP: Record<string, (file: File, role: string) => Promise<ReturnBase<...>>> = {
  'brain-tumor': (f, r) => aiService.diagnoseBrainTumor(f, r),
  'xray': (f, r) => aiService.diagnoseXRay(f, r),
  'skin': (f, r) => aiService.diagnoseDermatology(f, r),
  'breast-cancer': (f, r) => aiService.diagnoseBreastCancer(f, r),
  'lab-ocr': (f, r) => aiService.analyzeLabResults(f, r),
};
```

The `handleAnalyse` function (lines 333-351) calls `SERVICE_MAP[slug](file, userRole)` → awaits full JSON → sets `imageResult` or `labResult` state → shows result card.

### Changes:

#### 1. Add streaming action map alongside existing `SERVICE_MAP`:

```typescript
/** Maps tool slug → AIStreamController action name */
const STREAM_ACTION_MAP: Record<string, string> = {
  'brain-tumor': 'GetBrainTumorDiagnose',
  'xray': 'GetXRayDiagnose',
  'skin': 'GetDermatologyDiagnose',
  'breast-cancer': 'GetBreastCancerDiagnose',
  'lab-ocr': 'GetLabResults',
};
```

#### 2. Add streaming state variables:

```typescript
const abortRef = useRef<AbortController | null>(null);
const [streaming, setStreaming] = useState(false);
const [streamedText, setStreamedText] = useState('');
const [streamMeta, setStreamMeta] = useState<{
  label: string;
  confidence: number;
  model: string;
} | null>(null);
```

#### 3. Replace `handleAnalyse` with streaming version:

```typescript
const handleAnalyse = async () => {
  if (!file || !user?.role) return;
  const action = STREAM_ACTION_MAP[slug];
  if (!action) return;

  // Reset state
  setStep('processing');
  setError(null);
  setStreamedText('');
  setStreamMeta(null);

  // Build FormData with lowercase 'image' field (matches AIStreamController)
  const form = new FormData();
  form.append('image', file);

  abortRef.current = new AbortController();
  setStreaming(true);

  try {
    for await (const chunk of streamAiEndpoint(
      `${action}?userRole=${user.role}`,
      form,
      abortRef.current.signal
    )) {
      if (chunk.type === 'metadata') {
        setStreamMeta({
          label: chunk.label!,
          confidence: chunk.confidence!,
          model: chunk.model ?? slug,
        });
        setStep('result'); // Show result card as soon as metadata arrives
      } else if (chunk.type === 'text') {
        setStreamedText(prev => prev + (chunk.text ?? ''));
      } else if (chunk.type === 'done') {
        setStreaming(false);
        // Phase 10.6: auto-save fires here
      }
    }
  } catch (e) {
    if ((e as Error).name !== 'AbortError') {
      setError(e instanceof Error ? e.message : 'Unexpected error');
      setStep('upload');
    }
  } finally {
    setStreaming(false);
  }
};
```

#### 4. Update `DiagnosisResult` component to use `MarkdownRenderer`:

```tsx
// BEFORE (line 83):
<p className="text-sm text-on-surface-variant leading-relaxed">{result.generatedAdvice}</p>

// AFTER:
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

<MarkdownRenderer
  text={streamedText}
  dir="ltr"
  lang="en"
  streaming={streaming}
  animated={false}
/>
```

#### 5. Add Stop button while streaming:

```tsx
{streaming && (
  <button
    onClick={() => abortRef.current?.abort()}
    className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-error/50 text-error font-semibold text-sm hover:bg-error/5 transition-colors"
  >
    <span className="material-symbols-outlined text-lg">stop_circle</span>
    Stop
  </button>
)}
```

#### 6. Disable submit during streaming:

```tsx
<button
  onClick={handleAnalyse}
  disabled={streaming}
  className="... disabled:opacity-50 disabled:cursor-not-allowed"
>
```

---

## Part 4a — [MODIFY] `src/app/[locale]/(app)/dashboard/reports/page.tsx`

### Changes (minimal — this page is the reference):

1. **Delete** the local `ReportText` component (lines 12-141).

2. **Add import:**
   ```typescript
   import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
   ```

3. **Replace usage** (line 413):
   ```tsx
   // BEFORE:
   <ReportText text={report.report} />

   // AFTER:
   <MarkdownRenderer text={reportText} dir="rtl" lang="ar" streaming={streaming} />
   ```

4. **Add streaming to `handleGenerate`:**

   ```typescript
   import { streamMedicalReport } from '@/services/reportService';

   const [streaming, setStreaming] = useState(false);
   const [reportText, setReportText] = useState('');
   const abortRef = useRef<AbortController | null>(null);

   const handleGenerate = async () => {
     if (!user?.userId) return;
     setState('loading');
     setError(null);
     setLoadingStep(1);
     setReportText('');

     try {
       // Step 1 — .NET backend sync (unchanged)
       const trigger = await reportService.triggerReportGeneration(user.userId);
       if (!trigger.succeeded) throw new Error(trigger.message || 'Failed to sync data');

       // Step 2 — Stream report from Python RAG
       setLoadingStep(2);
       abortRef.current = new AbortController();
       setStreaming(true);
       setState('result');

       for await (const chunk of streamMedicalReport(
         user.userId, 'patient', true, abortRef.current.signal
       )) {
         if (chunk.type === 'text') {
           setReportText(prev => prev + (chunk.text ?? ''));
         } else if (chunk.type === 'done') {
           setStreaming(false);
         }
       }
     } catch (err) {
       if ((err as Error).name !== 'AbortError') {
         setError(err instanceof Error ? err.message : 'An unexpected error occurred');
         setState('error');
       }
     } finally {
       setStreaming(false);
     }
   };
   ```

5. **Keep all other parts unchanged:** PDF download, existing report check on mount, error state, disclaimer.

---

## Part 4b — Chatbot page (`/dashboard/ai-tools/chatbot` — `ChatbotPanel` component)

### Current state (lines 155-271 in `[tool]/page.tsx`):

The `ChatbotPanel` component uses `aiService.chatbotMessage()` → awaits full JSON → appends complete response as a new message. Shows bouncing dots while waiting.

### Changes:

1. **Replace `sendMessage` with streaming version:**

   ```typescript
   const [streaming, setStreaming] = useState(false);
   const abortRef = useRef<AbortController | null>(null);

   const sendMessage = async () => {
     if (!input.trim() || streaming) return;
     const text = input.trim();
     setInput('');
     setError(null);
     setMessages(prev => [...prev, { role: 'user', content: text, timestamp: new Date() }]);

     // Add empty assistant message that will be filled by streaming
     const assistantIdx = messages.length + 1; // index of the new assistant msg
     setMessages(prev => [...prev, { role: 'ai', content: '', timestamp: new Date() }]);

     abortRef.current = new AbortController();
     setStreaming(true);

     try {
       for await (const chunk of streamAiEndpoint(
         'GetChatbotResponse',
         { message: text, userRole: user?.role ?? 'Patient' },
         abortRef.current.signal
       )) {
         if (chunk.type === 'text') {
           setMessages(prev => {
             const updated = [...prev];
             const last = updated[updated.length - 1];
             if (last.role === 'ai') {
               updated[updated.length - 1] = { ...last, content: last.content + (chunk.text ?? '') };
             }
             return updated;
           });
         } else if (chunk.type === 'done') {
           setStreaming(false);
           // Phase 10.6: save chat message here
         }
       }
     } catch (e) {
       if ((e as Error).name !== 'AbortError') {
         setError('Network error. Please try again.');
       }
     } finally {
       setStreaming(false);
     }
   };
   ```

2. **Show blinking cursor inside the assistant bubble while streaming:**

   ```tsx
   {msg.role === 'ai' && streaming && i === messages.length - 1 && (
     <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ms-0.5 align-text-bottom" />
   )}
   ```

3. **Replace bouncing dots indicator** (lines 231-242) with the streaming cursor above — the bouncing dots are no longer needed since the assistant bubble fills progressively.

4. **Disable send button while streaming:**
   ```tsx
   disabled={!input.trim() || streaming}
   ```

---

## `src/app/[locale]/(app)/dashboard/ai-tools/page.tsx` (Hub page)

**No changes.** The AI Tools hub page is a navigation grid with no AI calls. It will be modified in Phase 10.6 to show "Recent Diagnoses" after persistence is wired.

---

# Phase 10.4 — React Frontend Parity (`MedScanAIFrontEnd-main`)

## Current State Analysis

The React frontend (`MedScanAIFrontEnd-main/medscanai/`) is a **legacy Vite + React (JSX)** app — significantly less developed than `mediscan-web`:

- **Framework:** Vite + React 18, plain JavaScript (`.jsx`, NOT TypeScript)
- **AI integration:** Only chatbot — `src/services/aiService.js` has a single `sendMessageToChatbot()` function
- **No image model screens** — Brain Tumor, X-Ray, etc. are NOT implemented in this frontend
- **No Reports page** — report generation is only in `mediscan-web`
- **No i18n library** — no Arabic support
- **No markdown renderer** — chatbot responses rendered as plain text
- **Hardcoded base URL:** `https://localhost:7196/api/ai/GetChatbotResponse/` in `aiService.js`

### Implication for Phase 10.4 scope:

The original plan assumed full feature parity. In reality, only the **chatbot** needs streaming migration. Image models, reports, and persistence wiring are NOT applicable to this frontend.

## Descoped — What to implement:

| Feature | Status |
| --- | --- |
| Streaming chatbot | ✅ Implement |
| `streamAi.js` utility | ✅ Create (port from `mediscan-web`) |
| `MarkdownRenderer.jsx` | ✅ Create (port from `mediscan-web`) |
| Streaming image models | ❌ N/A — no image model screens exist |
| Streaming reports | ❌ N/A — no reports page exists |
| Persistence wiring | ❌ N/A — handled by `mediscan-web` only |
| Arabic i18n | ❌ Deferred to Phase 10.8 (if needed) |

## [NEW] `src/utils/streamAi.js`

Port the `streamAiEndpoint` generator from `mediscan-web` to plain JavaScript:

```javascript
const STREAM_BASE = 'https://localhost:7196/api/ai-stream';

function getAuthToken() {
  const token = localStorage.getItem('token');
  return token || null;
}

export async function* streamAiEndpoint(action, body, signal) {
  const url = `${STREAM_BASE}/${action}`;
  const isFormData = body instanceof FormData;
  const token = getAuthToken();

  const headers = {};
  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, {
    method: 'POST',
    body: isFormData ? body : JSON.stringify(body),
    headers,
    signal,
  });

  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try { yield JSON.parse(line.slice(6)); } catch { /* skip */ }
    }
  }
}
```

> **Note:** The React app uses `localStorage.getItem('token')` for auth (confirmed from `src/utils/auth.js`), NOT cookies like `mediscan-web`. The `getAuthToken` function reflects this.

## [NEW] `src/components/common/MarkdownRenderer.jsx`

Simplified JSX port of `mediscan-web`'s `MarkdownRenderer.tsx`. Handles the same markdown constructs but with plain CSS classes (no Tailwind — the React app uses vanilla CSS).

The component must handle: `**bold**`, `## heading`, `- bullet`, `1. numbered`, `> blockquote`, `---`, `| table |`, empty lines, and `<think>` block stripping.

Props: `text` (string), `streaming` (boolean, default false).

## [MODIFY] `src/components/AIAssistant/` — Chatbot streaming

The chatbot component currently calls `sendMessageToChatbot()` → awaits full JSON → displays complete response.

**Change:**
1. Import `streamAiEndpoint` from `../../utils/streamAi.js`
2. Replace the `sendMessageToChatbot()` call with:
   ```javascript
   const abortRef = useRef(null);
   const [streaming, setStreaming] = useState(false);

   const handleSend = async () => {
     abortRef.current = new AbortController();
     setStreaming(true);
     // Add empty AI message
     setMessages(prev => [...prev, { role: 'ai', content: '' }]);

     try {
       for await (const chunk of streamAiEndpoint(
         'GetChatbotResponse',
         { message: input, userRole: role },
         abortRef.current.signal
       )) {
         if (chunk.type === 'text') {
           setMessages(prev => {
             const updated = [...prev];
             const last = updated[updated.length - 1];
             if (last.role === 'ai') {
               updated[updated.length - 1] = { ...last, content: last.content + (chunk.text ?? '') };
             }
             return updated;
           });
         } else if (chunk.type === 'done') {
           setStreaming(false);
         }
       }
     } catch (e) {
       if (e.name !== 'AbortError') setError(e.message);
     } finally {
       setStreaming(false);
     }
   };
   ```
3. Render AI messages through `<MarkdownRenderer text={msg.content} streaming={streaming && isLast} />`
4. Show blinking cursor (CSS `animation: pulse 1s infinite`) inside the last AI bubble while streaming

## [KEEP UNCHANGED] `src/services/aiService.js`

Keep the existing `sendMessageToChatbot()` as a non-streaming fallback. The streaming version in the component uses `streamAiEndpoint` directly.

---

# Phase 10.5 — Backend Persistence (.NET)

## Goal

Every AI result that is currently displayed then discarded must be saved to the database automatically when the stream ends. No user action required.

## Current State Analysis — Existing Entities

> **Critical finding:** The original plan proposed creating `MedicalReport`, `ChatSession`, and `ChatMessage` entities. These **already exist** in `MedScanAI.Domain/Entities/`:

| Entity | Status | File | Key Fields |
| --- | --- | --- | --- |
| `AIReport` | ✅ Already exists | `AIReport.cs` | `Id (int)`, `PatientId`, `AppointmentId?`, `Report (string)`, `CreatedAt` |
| `AIChatSession` | ✅ Already exists | `AIChatSession.cs` | `Id (int)`, `PatientId`, `StartedAt`, `EndedAt?`, `LanguageUsed`, `Messages` |
| `AIChatMessage` | ✅ Already exists | `AIChatMessage.cs` | `Id (int)`, `SessionId`, `SenderType ("Patient"\|"AI")`, `MessageText`, `AttachmentUrl?`, `CreatedAt` |
| `DiagnosisResult` | ❌ Does NOT exist | — | Must be created |

**DbContext** (`AppDbContext.cs`) already has:
- `DbSet<AIChatSession> AIChatSessions` (line 23)
- `DbSet<AIChatMessage> AIChatMessages` (line 24)
- `DbSet<AIReport> AIReports` (line 25)
- All relationships configured (Patient → Sessions, Session → Messages, Report → Appointment)

**Repositories:** `IAIReportRepository` + `AIReportRepository` already exist.

## What's Actually Needed

### 1. [NEW] `MedScanAI.Domain/Entities/DiagnosisResult.cs`

This is the only truly new entity:

```csharp
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MedScanAI.Domain.Entities
{
    [Table("DiagnosisResults")]
    public class DiagnosisResult
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [ForeignKey("Patient")]
        public string PatientId { get; set; }

        [Required]
        [MaxLength(30)]
        public string ModelType { get; set; }  // "BrainTumor", "ChestXRay", "BreastCancer", "SkinDisease", "LabOCR"

        public DateTime DiagnosedAt { get; set; } = DateTime.UtcNow;

        [MaxLength(500)]
        public string? InputImagePath { get; set; }

        [Required]
        [MaxLength(200)]
        public string ResultLabel { get; set; }

        public decimal? ConfidenceScore { get; set; }

        [Required]
        public string ResultText { get; set; }  // nvarchar(max) — full streamed advice text

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public Patient Patient { get; set; }
    }
}
```

### 2. [MODIFY] `AppDbContext.cs` — Add DiagnosisResult DbSet only

```csharp
// Add ONE new DbSet (line 26):
public DbSet<DiagnosisResult> DiagnosisResults { get; set; }
```

Add relationship in `OnModelCreating`:
```csharp
// Patient 1-to-Many with DiagnosisResults
modelBuilder.Entity<DiagnosisResult>()
    .HasOne(d => d.Patient)
    .WithMany()
    .HasForeignKey(d => d.PatientId)
    .OnDelete(DeleteBehavior.Cascade);

// Indexes
modelBuilder.Entity<DiagnosisResult>()
    .HasIndex(d => d.PatientId);
modelBuilder.Entity<DiagnosisResult>()
    .HasIndex(d => d.ModelType);
modelBuilder.Entity<DiagnosisResult>()
    .HasIndex(d => d.DiagnosedAt);
```

### 3. [NEW] API Controllers for Persistence

#### `MedScanAI.API/Controllers/DiagnosisController.cs` [NEW]

```
POST /api/diagnosis/save    { patientId, modelType, resultLabel, confidenceScore, resultText, inputImagePath? }
GET  /api/diagnosis/history/{patientId}
GET  /api/diagnosis/history/{patientId}/{modelType}
```

Follows standard CQRS pattern: controller → MediatR command → handler → DbContext.

#### `MedScanAI.API/Controllers/ChatPersistenceController.cs` [NEW]

Uses the **existing** `AIChatSession` and `AIChatMessage` entities:

```
POST /api/chat/session/start   { patientId, languageUsed? }  → returns { sessionId }
POST /api/chat/message/save    { sessionId, senderType, messageText }
GET  /api/chat/history/{patientId}  → returns sessions with messages
```

> **Note:** Named `ChatPersistenceController` (not `ChatController`) to avoid confusion with the streaming `AIStreamController` which handles live chatbot requests.

#### `MedScanAI.API/Controllers/ReportPersistenceController.cs` [NEW]

Uses the **existing** `AIReport` entity and `AIReportRepository`:

```
POST /api/report/save           { patientId, reportText, appointmentId? }
GET  /api/report/history/{patientId}
GET  /api/report/{reportId}
```

### 4. EF Core Migration

Run after `DiagnosisResult` entity and DbContext changes are saved:

```bash
dotnet ef migrations add AddDiagnosisResults ^
  --project "MedScanAI.Infrastructure" ^
  --startup-project "MedScanAI.API"

dotnet ef database update ^
  --project "MedScanAI.Infrastructure" ^
  --startup-project "MedScanAI.API"
```

> **Note:** Uses `^` (Windows line continuation) not `\` (Unix). Only `DiagnosisResults` table is created — `AIChatSessions`, `AIChatMessages`, and `AIReports` tables already exist from previous migrations.

---

# Phase 10.6 — Frontend Persistence Wiring (`mediscan-web` only)

## Rule

Auto-save fires exactly once per session: when the `done` SSE event is received, the full assembled text is POSTed to the appropriate .NET persistence endpoint. The user does nothing. Fire-and-forget — do not await, do not block UI.

> **Scope:** Only `mediscan-web`. The React frontend (`MedScanAIFrontEnd-main`) has minimal AI integration (chatbot only) and will not be wired for persistence.

## [NEW] `src/services/persistenceService.ts` (`mediscan-web`)

```typescript
import apiClient from '@/lib/axios';

// ─── Diagnosis persistence ─────────────────────────────────────────────────
export async function saveDiagnosisResult(payload: {
  patientId: string;
  modelType: string;        // "BrainTumor" | "ChestXRay" | "BreastCancer" | "SkinDisease" | "LabOCR"
  resultLabel: string;
  confidenceScore: number;
  resultText: string;
  inputImagePath?: string;
}) {
  await apiClient.post('/diagnosis/save', payload);
}

export async function getDiagnosisHistory(patientId: string) {
  const { data } = await apiClient.get(`/diagnosis/history/${patientId}`);
  return data;
}

// ─── Report persistence (uses existing AIReport entity) ────────────────────
export async function saveReport(payload: {
  patientId: string;
  report: string;            // matches AIReport.Report field name
  appointmentId?: number;
}) {
  await apiClient.post('/report/save', payload);
}

export async function getReportHistory(patientId: string) {
  const { data } = await apiClient.get(`/report/history/${patientId}`);
  return data;
}

// ─── Chat persistence (uses existing AIChatSession/AIChatMessage entities) ─
export async function startChatSession(patientId: string, languageUsed: string = 'ar'): Promise<number> {
  const { data } = await apiClient.post('/chat/session/start', { patientId, languageUsed });
  return data.data;  // returns int sessionId (AIChatSession.Id is int, not Guid)
}

export async function saveChatMessage(payload: {
  sessionId: number;          // int, not Guid
  senderType: 'Patient' | 'AI';  // matches AIChatMessage.SenderType field
  messageText: string;        // matches AIChatMessage.MessageText field
}) {
  await apiClient.post('/chat/message/save', payload);
}

export async function getChatHistory(patientId: string) {
  const { data } = await apiClient.get(`/chat/history/${patientId}`);
  return data;
}
```

> **Field name corrections vs original plan:**
> - `role` → `senderType` (matches `AIChatMessage.SenderType`)
> - `content` → `messageText` (matches `AIChatMessage.MessageText`)
> - `sessionId` type is `number` not `string` (matches `AIChatSession.Id` which is `int`)
> - `reportText` → `report` (matches `AIReport.Report`)
> - `reportType` removed (no such field on `AIReport`)

## [MODIFY] AI tools page — after stream `done`

```typescript
import { saveDiagnosisResult } from '@/services/persistenceService';

// Inside the streaming loop, when chunk.type === 'done':
if (chunk.type === 'done') {
  setStreaming(false);
  // Fire-and-forget — do not await, do not block UI
  saveDiagnosisResult({
    patientId: user.userId,
    modelType: SLUG_TO_MODEL_TYPE[slug],  // 'brain-tumor' → 'BrainTumor'
    resultLabel: streamMeta?.label ?? '',
    confidenceScore: streamMeta?.confidence ?? 0,
    resultText: streamedText,
  }).catch(console.error);
}

// Slug-to-ModelType mapping:
const SLUG_TO_MODEL_TYPE: Record<string, string> = {
  'brain-tumor': 'BrainTumor',
  'xray': 'ChestXRay',
  'breast-cancer': 'BreastCancer',
  'skin': 'SkinDisease',
  'lab-ocr': 'LabOCR',
};
```

## [MODIFY] Reports page — after stream `done`

The Reports page already saves via `medical_report.py` Python backend (the RAG service stores reports in its own DB). The `.NET` `POST /report/save` is an **additional** save to the relational DB for history browsing. Fire-and-forget:

```typescript
import { saveReport } from '@/services/persistenceService';

// After report stream done:
saveReport({
  patientId: user.userId,
  report: reportText,  // full assembled markdown
}).catch(console.error);
```

## [MODIFY] Chatbot page

- **On mount:** call `startChatSession(user.userId)` → store `sessionId: number` in component state
- **On user send:** call `saveChatMessage({ sessionId, senderType: 'Patient', messageText: text })`
- **After assistant stream `done`:** call `saveChatMessage({ sessionId, senderType: 'AI', messageText: assembledText })`

## New UI sections (`mediscan-web` only)

### Reports page — "Report History" section

Below the current report viewer, add a collapsible "Past Reports" section:
- Fetches `getReportHistory(patientId)` on mount
- Shows each past report as a row: date, "View" button
- "View" opens the saved report text in `MarkdownRenderer` (same component, different data source)
- No new routes needed — the viewer is inline

### AI Tools hub page — "Recent Diagnoses" section

Below each model card, show the most recent diagnosis for that model:
- Calls `getDiagnosisHistory(patientId)` once on mount, groups by `modelType`
- Shows: result label + confidence + date
- "View Full Result" link expands the saved `resultText` via `MarkdownRenderer`

### Chatbot page — "Past Sessions" sidebar

Left sidebar (collapsible on mobile):
- Fetches `getChatHistory(patientId)` on mount
- Lists sessions by date, most recent first
- Clicking a session loads its messages into the chat window (read-only mode)

---

# Phase 10.7 — Full Arabic i18n (`mediscan-web`)

## Goal

When the locale is `ar`, every visible string must be in Arabic. No English string must remain anywhere in the UI.

## Approach

View each page file, grep for hardcoded strings, move every string to `messages/en.json` and `messages/ar.json`, replace with `useTranslations()` hook call.

## Required `messages/ar.json` additions

### AI model names

```json
"aiModels": {
  "brainTumor": "كشف أورام المخ",
  "chestXray": "تحليل أشعة الصدر",
  "breastCancer": "تحليل سرطان الثدي",
  "skinDisease": "تصنيف أمراض الجلد",
  "labOcr": "استخراج نتائج التحاليل",
  "chatbot": "المساعد الصحي الذكي",
  "medicalReport": "التقرير الطبي الشامل"
}
```

### Status labels

```json
"status": {
  "pending": "معلق",
  "confirmed": "مؤكد",
  "completed": "مكتمل",
  "cancelled": "ملغي",
  "active": "نشط",
  "inactive": "غير نشط"
}
```

### Severity labels (NAM Report / Forbidden Medicines)

```json
"severity": {
  "forbidden": "ممنوع",
  "warning": "تحذير",
  "interaction": "تفاعل دوائي"
}
```

### Streaming UI labels

```json
"streaming": {
  "thinking": "الذكاء الاصطناعي يكتب...",
  "analyzing": "الذكاء الاصطناعي يحلل...",
  "stop": "إيقاف",
  "generating": "جاري إنشاء التقرير..."
}
```

### Date and number formatting

When locale is `ar`, wrap all dates and numbers:

```typescript
// Dates
new Intl.DateTimeFormat('ar-EG', { dateStyle: 'long' }).format(new Date(date))

// Numbers
count.toLocaleString('ar-EG')

// Percentages
(confidence * 100).toLocaleString('ar-EG', { maximumFractionDigits: 1 }) + '%'
```

## Pages requiring the most attention

These pages had the most hardcoded English strings found during the session:

| Page | Hardcoded strings to move |
| --- | --- |
| `dashboard/ai-tools/[tool]/page.tsx` | Model title, upload instructions, quality requirements, result labels, error messages |
| `admin/doctors/page.tsx` | Column headers, status badges, action button labels |
| `admin/add-doctor/page.tsx` | All form labels, placeholder text, day-of-week chips |
| `dashboard/forbidden-medicines/page.tsx` | Severity labels, card headings, empty state |
| `doctor/page.tsx` | Stat card labels, section headings |
| `dashboard/reports/page.tsx` | Replace local `ReportText` with shared `MarkdownRenderer` import + add streaming (Phase 10.3 Part 4a) |

---

# Phase 10.8 — Full Arabic i18n (`MedScanAIFrontEnd-main`) — DESCOPED

## Status: ❌ Not implementing

The React legacy frontend (`MedScanAIFrontEnd-main`) has:
- No i18n library installed
- No Arabic text anywhere
- No locale routing
- Plain JSX with hardcoded English strings

Adding full Arabic i18n to a legacy Vite+JSX app with minimal AI integration is **not worth the effort** for a graduation project. The `mediscan-web` Next.js frontend is the primary user-facing application and already has full i18n via `next-intl` with `messages/ar.json` (25KB) and `messages/en.json` (19KB).

If React i18n is needed in the future, install `react-i18next` and mirror the key structure from `mediscan-web`.

---

# Phase 10 — File Summary (Corrected)

## Python (6 microservices + shared utility)

| Action | File |
| --- | --- |
| MODIFY | `Brain Tumer/main.py` — add `/predict/stream` endpoint + `generate_advice_stream()` |
| MODIFY | `Breast cancer/main.py` — same pattern |
| MODIFY | `X-ray/main.py` — same pattern |
| MODIFY | `DermNet/main.py` — same pattern |
| MODIFY | `Agentic-Medical-RAG-Chatbot-main/api/medical_report.py` — streaming + cached stream via `LLM.astream()` |
| MODIFY | `Agentic-Medical-RAG-Chatbot-main/api/chat.py` — wrap agent streaming in SSE format |
| MODIFY | `Agentic-Medical-RAG-Chatbot-main/api/image_analysis.py` — streaming + sanitization |
| NEW | `Brain Tumer/stream_utils.py` — copy 1 of shared utility |
| NEW | `Breast cancer/stream_utils.py` — copy 2 |
| NEW | `X-ray/stream_utils.py` — copy 3 |
| NEW | `DermNet/stream_utils.py` — copy 4 |
| NEW | `Agentic-Medical-RAG-Chatbot-main/src/stream_utils.py` — copy 5 |

## .NET (`MedScanAI-master`)

| Action | File |
| --- | --- |
| KEEP | `MedScanAI.API/Controllers/AIController.cs` — unchanged (backward compat) |
| KEEP | `MedScanAI.Service/Implementation/AIService.cs` — unchanged |
| KEEP | `MedScanAI.Core/Features/AIFeature/Query/Handler/AIQueryHandler.cs` — unchanged |
| NEW | `MedScanAI.API/Controllers/AIStreamController.cs` — streaming proxy, bypasses MediatR |
| NEW | `MedScanAI.Domain/Entities/DiagnosisResult.cs` — only truly new entity |
| MODIFY | `MedScanAI.Infrastructure/Context/AppDbContext.cs` — add 1 new DbSet (`DiagnosisResults`) |
| NEW | `MedScanAI.API/Controllers/DiagnosisController.cs` — persistence CRUD |
| NEW | `MedScanAI.API/Controllers/ChatPersistenceController.cs` — uses existing `AIChatSession`/`AIChatMessage` |
| NEW | `MedScanAI.API/Controllers/ReportPersistenceController.cs` — uses existing `AIReport` |
| NEW | EF Core migration: `AddDiagnosisResults` |

## `mediscan-web` (Next.js)

| Action | File |
| --- | --- |
| MODIFY | `src/services/aiService.ts` — keep existing axios + add `streamAiEndpoint` generator |
| MODIFY | `src/services/reportService.ts` — add `streamMedicalReport` function |
| NEW | `src/services/persistenceService.ts` — all save/fetch persistence functions |
| NEW | `src/components/ui/MarkdownRenderer.tsx` — shared markdown component (extracted from Reports) |
| MODIFY | `src/app/[locale]/(app)/dashboard/ai-tools/[tool]/page.tsx` — streaming UI + auto-save |
| MODIFY | `src/app/[locale]/(app)/dashboard/ai-tools/page.tsx` — diagnosis history section |
| MODIFY | `src/app/[locale]/(app)/dashboard/reports/page.tsx` — import MarkdownRenderer + streaming |
| MODIFY | `src/components/doctor/ReportDrawer.tsx` — import shared MarkdownRenderer |
| MODIFY | `messages/en.json` — add streaming UI keys |
| MODIFY | `messages/ar.json` — add Arabic translations for streaming UI |

## `MedScanAIFrontEnd-main` (React — minimal scope)

| Action | File |
| --- | --- |
| NEW | `medscanai/src/utils/streamAi.js` — port of streaming generator (plain JS) |
| NEW | `medscanai/src/components/common/MarkdownRenderer.jsx` — simplified markdown renderer |
| MODIFY | `medscanai/src/components/AIAssistant/` — streaming chatbot |
| KEEP | `medscanai/src/services/aiService.js` — unchanged fallback |

**Total new files: ~15 | Total modified files: ~18**

---

# Phase 10 — Verification

```bash
# mediscan-web
npm run lint    # 0 errors, 0 warnings
npm run build   # Exit 0, all routes compile

# MedScanAI-master
dotnet build    # 0 errors

# Python (each microservice)
uvicorn main:app --port XXXX  # starts without error
# Verify /predict (JSON) still works — backward compat
# Verify /predict/stream (SSE) returns text/event-stream
```

## Manual checks

- [ ] Brain Tumor: upload image → metadata (label+confidence) appears instantly, explanation streams token-by-token with blinking cursor
- [ ] X-Ray: same
- [ ] Breast Cancer: same
- [ ] Skin Disease: same
- [ ] Lab OCR: upload report image → extracted text streams in
- [ ] Chatbot: send message → response streams word-by-word, cursor blinks inside assistant bubble
- [ ] Medical Report: click "Generate" → report streams in, PDF button appears after done
- [ ] Stop button: clicking "Stop" during streaming aborts the stream cleanly (no error toast)
- [ ] No `<think>` block visible anywhere in any response
- [ ] No `<br>` visible anywhere
- [ ] No raw `**` or `---` visible — all markdown renders correctly via `MarkdownRenderer`
- [ ] Switch to Arabic: every string on every page is in Arabic — no English fragments
- [ ] Dates in Arabic locale show Arabic-Indic numerals
- [ ] "AI is writing..." label shows "الذكاء الاصطناعي يكتب..." in AR mode
- [ ] After stream ends: diagnosis auto-saved (check DB or "Recent Diagnoses" section)
- [ ] After report stream ends: report appears in "Past Reports" history section
- [ ] Chatbot: refresh page → past session restored from DB
- [ ] Old `/api/ai/GetBrainTumorDiagnose` (JSON) still works — backward compat for React frontend

---

# Cross-phase integration notes

## Relationship to Phase 7 (Animations)

The streaming blinking cursor is an extension of the Phase 7 animation system:
- The cursor uses `animate-pulse` (Tailwind utility, not custom CSS)
- The `Typewriter` component from Phase 7 must **not** be used for streaming output — it pre-renders full text character-by-character, which conflicts with live token appending
- For streaming: append chunks to state → React re-renders incrementally → cursor animates separately

## Relationship to Phase 8 (Exam Wizard)

No intersection — the Exam Wizard does not call AI streaming endpoints.

## Relationship to Phase 9 (Patient Detail)

The Patient Detail page's drug interaction warning card fetches from the Python RAG endpoint. This endpoint must also stream its response (Phase 10.1 covers `image_analysis.py` and the RAG chatbot API). The drug warning text is short, so streaming is optional but must be consistent with all other AI outputs.

---

*Phase 10 appended to Phases 7–9 Implementation README. Reference document: `Resolving_Next_js_Routing_Errors.md` (Antigravity session) and previous implementation chats.*
