using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Net.Http.Headers;
using System.Text.Json;

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
                JsonSerializer.Serialize(new { message = body.Message }),
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
