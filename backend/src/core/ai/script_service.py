"""
Script Generation Service for ClipPilot
Handles AI-powered script generation with OpenAI GPT-4o
"""

from typing import Dict, Any, Optional
import logging

from .openai_client import get_openai_client
from ...core.exceptions import ContentGenerationError

logger = logging.getLogger(__name__)


class ScriptGenerationService:
    """Service for generating video scripts using OpenAI GPT-4o"""

    def __init__(self):
        """Initialize script generation service"""
        self.openai_client = get_openai_client()

    async def generate_script(
        self,
        prompt: str,
        video_length_sec: int = 30,
        tone: str = "informative",
        additional_context: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate video script from user prompt

        Args:
            prompt: User input prompt (10-2000 characters)
            video_length_sec: Target video length (15, 30, or 60 seconds)
            tone: Script tone (informative, fun, emotional)
            additional_context: Optional additional context

        Returns:
            Dict with:
                - script: Generated script content
                - tokens_in: Input tokens used
                - tokens_out: Output tokens generated
                - api_cost: Estimated cost in USD

        Raises:
            ContentGenerationError: If script generation fails
        """
        try:
            logger.info(
                f"Generating script: prompt_length={len(prompt)}, "
                f"video_length={video_length_sec}s, tone={tone}"
            )

            # Validate video length
            if video_length_sec not in [15, 30, 60]:
                raise ValueError("video_length_sec must be 15, 30, or 60")

            # Validate tone
            valid_tones = ["informative", "fun", "emotional"]
            if tone not in valid_tones:
                raise ValueError(f"tone must be one of {valid_tones}")

            # Content filtering: 부적절한 콘텐츠 감지 (FR-014)
            if self._contains_inappropriate_content(prompt):
                raise ContentGenerationError(
                    "프롬프트에 부적절한 콘텐츠가 포함되어 있습니다. "
                    "정책에 위배되는 콘텐츠는 생성할 수 없습니다."
                )

            # Generate script using OpenAI
            result = await self.openai_client.generate_script(
                prompt=prompt,
                video_length_sec=video_length_sec,
                tone=tone,
                additional_context=additional_context,
            )

            # Calculate API cost
            api_cost = await self.openai_client.estimate_cost(
                tokens_in=result["tokens_in"],
                tokens_out=result["tokens_out"],
            )

            logger.info(
                f"Script generated successfully: "
                f"tokens={result['tokens_in'] + result['tokens_out']}, "
                f"cost=${api_cost:.4f}"
            )

            return {
                "script": result["script"],
                "tokens_in": result["tokens_in"],
                "tokens_out": result["tokens_out"],
                "api_cost": api_cost,
            }

        except ContentGenerationError:
            # Re-raise content filtering errors
            raise

        except ValueError as e:
            logger.error(f"Invalid parameters for script generation: {e}")
            raise ContentGenerationError(f"잘못된 요청 파라미터: {str(e)}")

        except Exception as e:
            logger.error(f"Script generation failed: {e}", exc_info=True)
            raise ContentGenerationError(
                "스크립트 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
            )

    def _contains_inappropriate_content(self, text: str) -> bool:
        """
        Check if text contains inappropriate content (FR-014)

        This is a basic implementation. In production, you might want to use:
        - OpenAI Moderation API
        - Custom content filtering service
        - Regular expression patterns

        Args:
            text: Text to check

        Returns:
            True if inappropriate content detected
        """
        # Lowercase for case-insensitive matching
        text_lower = text.lower()

        # Basic keyword filtering
        # TODO: Expand this list or use ML-based moderation
        inappropriate_keywords = [
            "폭력",
            "혐오",
            "성인",
            "도박",
            "마약",
            "자살",
            "테러",
        ]

        for keyword in inappropriate_keywords:
            if keyword in text_lower:
                logger.warning(f"Inappropriate content detected: keyword='{keyword}'")
                return True

        return False


# Global service instance
_script_service: Optional[ScriptGenerationService] = None


def get_script_service() -> ScriptGenerationService:
    """
    Get or create global ScriptGenerationService instance

    Returns:
        ScriptGenerationService instance
    """
    global _script_service

    if _script_service is None:
        _script_service = ScriptGenerationService()

    return _script_service
