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
