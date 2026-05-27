"""
Hugging Face Chat Client
Uses huggingface_hub.InferenceClient for robust chat completion support.
"""

from typing import Any, List, Optional, Dict, Iterator
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_core.outputs import ChatResult, ChatGeneration, ChatGenerationChunk
from huggingface_hub import InferenceClient
import os

class HuggingFaceHubChat(BaseChatModel):
    """
    Custom LangChain wrapper for Hugging Face Inference API (Chat Completion).
    This is more robust than HuggingFaceEndpoint for chat models.
    """
    
    model_name: str
    api_token: str
    temperature: float = 0.5
    max_tokens: int = 1024
    top_p: float = 0.9
    
    def __init__(self, model_name: str, api_token: str = None, **kwargs):
        api_token = api_token or os.getenv("HUGGINGFACE_API_TOKEN")
        if not api_token:
            raise ValueError("HUGGINGFACE_API_TOKEN is required")
            
        super().__init__(model_name=model_name, api_token=api_token, **kwargs)
    
    @property
    def _llm_type(self) -> str:
        return "huggingface_hub_chat"
        
    def _convert_messages(self, messages: List[BaseMessage]) -> List[Dict[str, str]]:
        """Convert LangChain messages to HF format."""
        hf_messages = []
        for msg in messages:
            role = "user"
            if isinstance(msg, AIMessage):
                role = "assistant"
            elif isinstance(msg, SystemMessage):
                role = "system"
            
            hf_messages.append({"role": role, "content": msg.content})
        return hf_messages

    def _generate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Optional[Any] = None,
        **kwargs: Any,
    ) -> ChatResult:
        """Generate response."""
        # Use new router URL to fix 410 error
        client = InferenceClient(
            token=self.api_token,
            base_url="https://router.huggingface.co/hf-inference"
        )
        hf_messages = self._convert_messages(messages)
        
        response = client.chat_completion(
            messages=hf_messages,
            model=self.model_name,
            temperature=self.temperature,
            max_tokens=self.max_tokens,
            top_p=self.top_p,
            stream=False
        )
        
        content = response.choices[0].message.content
        generation = ChatGeneration(message=AIMessage(content=content))
        return ChatResult(generations=[generation])

    def _stream(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Optional[Any] = None,
        **kwargs: Any,
    ) -> Iterator[ChatGenerationChunk]:
        """Stream response."""
        # Use new router URL to fix 410 error
        client = InferenceClient(
            token=self.api_token,
            base_url="https://router.huggingface.co/hf-inference"
        )
        hf_messages = self._convert_messages(messages)
        
        stream = client.chat_completion(
            messages=hf_messages,
            model=self.model_name,
            temperature=self.temperature,
            max_tokens=self.max_tokens,
            top_p=self.top_p,
            stream=True
        )
        
        for chunk in stream:
            content = chunk.choices[0].delta.content or ""
            yield ChatGenerationChunk(message=AIMessage(content=content))
