"""
FallbackAwareLLM - Smart LLM with Rate Limiting & Automatic Failover

Features:
- Automatic retry with exponential backoff
- Rate limit handling (429 errors)
- Smart provider rotation
- Quota monitoring
"""

import logging
import time
from typing import Any, List, Optional, Iterator
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import BaseMessage
from langchain_core.outputs import ChatResult, ChatGenerationChunk

logger = logging.getLogger(__name__)

# Import rate limiter
try:
    from rate_limiter import quota_tracker, throttle_request, is_rate_limit_error, RateLimitError
except ImportError:
    from src.rate_limiter import quota_tracker, throttle_request, is_rate_limit_error, RateLimitError


class FallbackAwareLLM(BaseChatModel):
    """
    Smart LLM wrapper with:
    - Automatic failover between providers
    - Rate limit handling with exponential backoff
    - Quota tracking and monitoring
    """
    models: List[BaseChatModel]
    model_providers: List[str] = []  # Track which provider each model uses
    max_retries: int = 2
    base_delay: float = 1.0
    max_delay: float = 30.0
    
    def __init__(self, models: List[BaseChatModel], **kwargs):
        # Detect provider for each model
        providers = []
        for model in models:
            class_name = model.__class__.__name__.lower()
            if "google" in class_name or "gemini" in class_name:
                providers.append("gemini")
            elif "groq" in class_name:
                providers.append("groq")
            elif "openai" in class_name:
                providers.append("openrouter")
            else:
                providers.append("huggingface")
        
        super().__init__(models=models, model_providers=providers, **kwargs)
        
        if not models:
            raise ValueError("At least one model must be provided")
        
        logger.info(f"🤖 FallbackAwareLLM initialized with {len(models)} models: {providers}")

    @property
    def _llm_type(self) -> str:
        return "fallback_aware_llm"

    def _get_provider(self, model_index: int) -> str:
        """Get provider name for model index."""
        if model_index < len(self.model_providers):
            return self.model_providers[model_index]
        return "unknown"

    def _try_with_retry(
        self,
        model: BaseChatModel,
        provider: str,
        messages: List[BaseMessage],
        stop: Optional[List[str]],
        run_manager: Optional[Any],
        **kwargs
    ) -> Optional[ChatResult]:
        """Try a single model with retry logic."""
        
        for attempt in range(self.max_retries + 1):
            try:
                # Check if provider is rate limited
                if not quota_tracker.can_make_request(provider):
                    logger.warning(f"⏳ {provider} is rate limited, skipping...")
                    return None
                
                # Throttle request
                throttle_request(provider)
                
                # Make the request
                result = model._generate(
                    messages,
                    stop=stop,
                    run_manager=run_manager,
                    **kwargs
                )
                
                # Success - record it
                quota_tracker.record_request(provider)
                return result
                
            except Exception as e:
                error_str = str(e).lower()
                
                # Handle rate limit errors
                if is_rate_limit_error(e):
                    quota_tracker.record_error_429(provider)
                    logger.warning(f"⛔ {provider} rate limited (Fail Fast). Switching to next provider...")
                    return None  # Fail immediately to trigger next provider
                
                # Handle timeout
                elif "timeout" in error_str:
                    if attempt < self.max_retries:
                        delay = min(self.base_delay * (2 ** attempt), self.max_delay)
                        logger.warning(f"⏳ {provider} timeout, retry {attempt+1} in {delay:.1f}s")
                        time.sleep(delay)
                        continue
                    return None
                
                # Handle API key errors - don't retry
                elif "api" in error_str and ("key" in error_str or "auth" in error_str):
                    logger.error(f"🔑 {provider} API key error: {e}")
                    return None
                
                # Other errors - log and return None to try next provider
                else:
                    logger.warning(f"❌ {provider} error: {e}")
                    return None
        
        return None

    def _generate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Optional[Any] = None,
        **kwargs: Any,
    ) -> ChatResult:
        """
        Generate with automatic failover and rate limit handling.
        """
        last_exception = None
        
        for i, model in enumerate(self.models):
            provider = self._get_provider(i)
            
            try:
                logger.debug(f"🔄 Trying {provider} (model {i+1}/{len(self.models)})")
                
                result = self._try_with_retry(
                    model, provider, messages, stop, run_manager, **kwargs
                )
                
                if result is not None:
                    logger.info(f"✅ Success with {provider}")
                    return result
                    
            except Exception as e:
                last_exception = e
                logger.warning(f"❌ {provider} failed: {e}")
                continue
        
        # Log quota status on failure
        quota_tracker.log_status()
        
        # All models failed
        logger.error("⛔ All LLM providers failed!")
        raise last_exception or Exception("All LLM providers exhausted")

    def _stream(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Optional[Any] = None,
        **kwargs: Any,
    ) -> Iterator[ChatGenerationChunk]:
        """
        Stream with automatic failover.
        """
        last_exception = None
        
        for i, model in enumerate(self.models):
            provider = self._get_provider(i)
            
            try:
                # Check rate limit
                if not quota_tracker.can_make_request(provider):
                    logger.warning(f"⏳ {provider} rate limited, trying next...")
                    continue
                
                # Throttle
                throttle_request(provider)
                
                logger.debug(f"🔄 Streaming with {provider}")
                
                stream = model._stream(
                    messages,
                    stop=stop,
                    run_manager=run_manager,
                    **kwargs
                )
                
                # Yield chunks
                chunk_count = 0
                for chunk in stream:
                    chunk_count += 1
                    yield chunk
                
                # Success
                quota_tracker.record_request(provider)
                logger.info(f"✅ Streamed {chunk_count} chunks from {provider}")
                return
                
            except Exception as e:
                last_exception = e
                
                if is_rate_limit_error(e):
                    quota_tracker.record_error_429(provider)
                    logger.warning(f"⏳ {provider} rate limit during stream, trying next...")
                else:
                    logger.warning(f"❌ {provider} stream error: {e}")
                continue
        
        quota_tracker.log_status()
        logger.error("⛔ All providers failed streaming!")
        raise last_exception or Exception("All providers failed streaming")

    def invoke(self, input: Any, config: Optional[Any] = None, **kwargs) -> Any:
        """Invoke with rate limiting."""
        try:
            return super().invoke(input, config, **kwargs)
        except Exception as e:
            if is_rate_limit_error(e):
                logger.error("⛔ All providers rate limited!")
                quota_tracker.log_status()
            raise
