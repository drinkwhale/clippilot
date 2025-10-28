"""
OpenAI API client wrapper for ClipPilot
Handles GPT-4o API calls for script generation and metadata extraction
"""

import os
from typing import Any, Optional

from openai import AsyncOpenAI, OpenAI


class OpenAIClient:
    """Wrapper for OpenAI API with helper methods"""

    def __init__(self):
        """Initialize OpenAI client"""
        self.api_key = os.getenv("OPENAI_API_KEY")

        if not self.api_key:
            raise ValueError("OPENAI_API_KEY must be set")

        # Synchronous client
        self._sync_client = OpenAI(api_key=self.api_key)

        # Asynchronous client
        self._async_client = AsyncOpenAI(api_key=self.api_key)

        # Default model
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o")

    @property
    def sync(self) -> OpenAI:
        """Get synchronous OpenAI client"""
        return self._sync_client

    @property
    def async_client(self) -> AsyncOpenAI:
        """Get asynchronous OpenAI client"""
        return self._async_client

    async def chat_completion(
        self,
        messages: list[dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        response_format: Optional[dict[str, str]] = None,
    ) -> dict[str, Any]:
        """
        Create chat completion

        Args:
            messages: List of message dicts with 'role' and 'content'
            model: Model name (defaults to self.model)
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens to generate
            response_format: Response format (e.g., {"type": "json_object"})

        Returns:
            Dict with 'content', 'tokens_in', 'tokens_out'
        """
        model = model or self.model

        params = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
        }

        if max_tokens:
            params["max_tokens"] = max_tokens

        if response_format:
            params["response_format"] = response_format

        response = await self._async_client.chat.completions.create(**params)

        return {
            "content": response.choices[0].message.content,
            "tokens_in": response.usage.prompt_tokens,
            "tokens_out": response.usage.completion_tokens,
            "total_tokens": response.usage.total_tokens,
            "model": response.model,
            "finish_reason": response.choices[0].finish_reason,
        }

    async def generate_script(
        self,
        prompt: str,
        video_length_sec: int,
        tone: str,
        additional_context: Optional[str] = None,
    ) -> dict[str, Any]:
        """
        Generate video script from prompt

        Args:
            prompt: User input prompt
            video_length_sec: Target video length (15, 30, or 60 seconds)
            tone: Script tone (informative, fun, emotional)
            additional_context: Optional additional context

        Returns:
            Dict with 'script', 'tokens_in', 'tokens_out'
        """
        # Calculate approximate word count
        # Average speaking rate: 150 words per minute
        # 15 sec = ~37 words, 30 sec = ~75 words, 60 sec = ~150 words
        word_count_map = {15: 37, 30: 75, 60: 150}
        target_words = word_count_map.get(video_length_sec, 150)

        # Build system message
        system_message = f"""당신은 숏폼 비디오 스크립트 작가입니다.
주어진 주제로 {video_length_sec}초 길이의 영상 스크립트를 작성해주세요.

요구사항:
- 길이: 약 {target_words}단어
- 톤: {tone}
- 구조: 훅(3초) → 본론 → 결론(CTA)
- 자막 표시를 위해 문장은 짧고 명확하게
- 각 문장은 개행으로 구분"""

        if additional_context:
            system_message += f"\n\n추가 컨텍스트:\n{additional_context}"

        messages = [
            {"role": "system", "content": system_message},
            {"role": "user", "content": prompt},
        ]

        response = await self.chat_completion(
            messages=messages,
            temperature=0.8,
            max_tokens=1000,
        )

        return {
            "script": response["content"],
            "tokens_in": response["tokens_in"],
            "tokens_out": response["tokens_out"],
        }

    async def generate_metadata(
        self,
        script: str,
        prompt: str,
    ) -> dict[str, Any]:
        """
        Generate video metadata (title, description, tags) from script

        Args:
            script: Generated video script
            prompt: Original user prompt

        Returns:
            Dict with 'title', 'description', 'tags', 'tokens_in', 'tokens_out'
        """
        system_message = """당신은 YouTube SEO 전문가입니다.
주어진 스크립트로부터 최적화된 메타데이터를 생성해주세요.

JSON 형식으로 응답:
{
  "title": "클릭을 유도하는 제목 (50자 이내)",
  "description": "SEO 최적화된 설명 (200자 이내)",
  "tags": ["태그1", "태그2", "태그3"]
}"""

        user_message = f"""원본 프롬프트: {prompt}

스크립트:
{script}

위 스크립트를 기반으로 YouTube 메타데이터를 생성해주세요."""

        messages = [
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_message},
        ]

        response = await self.chat_completion(
            messages=messages,
            temperature=0.7,
            response_format={"type": "json_object"},
        )

        import json
        metadata = json.loads(response["content"])

        return {
            "title": metadata.get("title", ""),
            "description": metadata.get("description", ""),
            "tags": metadata.get("tags", []),
            "tokens_in": response["tokens_in"],
            "tokens_out": response["tokens_out"],
        }

    async def estimate_cost(
        self,
        tokens_in: int,
        tokens_out: int,
        model: Optional[str] = None,
    ) -> float:
        """
        Estimate API cost in USD

        Args:
            tokens_in: Input tokens
            tokens_out: Output tokens
            model: Model name

        Returns:
            Estimated cost in USD
        """
        model = model or self.model

        # Pricing as of 2024 (per 1M tokens)
        pricing = {
            "gpt-4o": {"input": 2.5, "output": 10.0},
            "gpt-4o-mini": {"input": 0.15, "output": 0.6},
            "gpt-4": {"input": 30.0, "output": 60.0},
        }

        if model not in pricing:
            # Default to gpt-4o pricing
            model = "gpt-4o"

        input_cost = (tokens_in / 1_000_000) * pricing[model]["input"]
        output_cost = (tokens_out / 1_000_000) * pricing[model]["output"]

        return input_cost + output_cost


# Global OpenAI client instance
_openai_client: Optional[OpenAIClient] = None


def get_openai_client() -> OpenAIClient:
    """
    Get or create global OpenAI client instance

    Returns:
        OpenAIClient instance
    """
    global _openai_client

    if _openai_client is None:
        _openai_client = OpenAIClient()

    return _openai_client
