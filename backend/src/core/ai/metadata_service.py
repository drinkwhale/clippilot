"""
Metadata Generation Service for ClipPilot
Generates YouTube metadata (title, description, tags) from scripts
"""

from typing import Dict, Any, List, Optional
import logging

from .openai_client import get_openai_client
from ...core.exceptions import ContentGenerationError

logger = logging.getLogger(__name__)


class MetadataService:
    """Service for generating YouTube metadata using OpenAI GPT-4o"""

    def __init__(self):
        """Initialize metadata generation service"""
        self.openai_client = get_openai_client()

    async def generate_metadata(
        self,
        script: str,
        prompt: str,
    ) -> Dict[str, Any]:
        """
        Generate YouTube metadata (title, description, tags) from script

        Args:
            script: Generated video script
            prompt: Original user prompt

        Returns:
            Dict with:
                - title: Video title (max 50 characters)
                - description: Video description (max 200 characters)
                - tags: List of tags (3-10 tags)
                - tokens_in: Input tokens used
                - tokens_out: Output tokens generated
                - api_cost: Estimated cost in USD

        Raises:
            ContentGenerationError: If metadata generation fails
        """
        try:
            logger.info(
                f"Generating metadata: script_length={len(script)}, "
                f"prompt_length={len(prompt)}"
            )

            # Generate metadata using OpenAI
            result = await self.openai_client.generate_metadata(
                script=script,
                prompt=prompt,
            )

            # Validate and sanitize metadata
            title = self._validate_title(result.get("title", ""))
            description = self._validate_description(result.get("description", ""))
            tags = self._validate_tags(result.get("tags", []))

            # Calculate API cost
            api_cost = await self.openai_client.estimate_cost(
                tokens_in=result["tokens_in"],
                tokens_out=result["tokens_out"],
            )

            logger.info(
                f"Metadata generated successfully: "
                f"title_length={len(title)}, tags_count={len(tags)}, "
                f"cost=${api_cost:.4f}"
            )

            return {
                "title": title,
                "description": description,
                "tags": tags,
                "tokens_in": result["tokens_in"],
                "tokens_out": result["tokens_out"],
                "api_cost": api_cost,
            }

        except Exception as e:
            logger.error(f"Metadata generation failed: {e}", exc_info=True)
            raise ContentGenerationError(
                "메타데이터 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
            )

    def _validate_title(self, title: str) -> str:
        """
        Validate and sanitize video title

        YouTube title limits:
        - Max 100 characters (we limit to 50 for better display)
        - No special characters that break URLs

        Args:
            title: Raw title from AI

        Returns:
            Validated and sanitized title
        """
        # Strip whitespace
        title = title.strip()

        # Ensure title is not empty
        if not title:
            title = "클립파일럿 AI 생성 영상"

        # Truncate to 50 characters
        if len(title) > 50:
            title = title[:47] + "..."

        # Remove problematic characters
        title = title.replace("|", "-").replace("<", "").replace(">", "")

        return title

    def _validate_description(self, description: str) -> str:
        """
        Validate and sanitize video description

        YouTube description limits:
        - Max 5000 characters (we limit to 200 for MVP)

        Args:
            description: Raw description from AI

        Returns:
            Validated and sanitized description
        """
        # Strip whitespace
        description = description.strip()

        # Ensure description is not empty
        if not description:
            description = "클립파일럿 AI로 자동 생성된 영상입니다."

        # Truncate to 200 characters
        if len(description) > 200:
            description = description[:197] + "..."

        return description

    def _validate_tags(self, tags: List[str]) -> List[str]:
        """
        Validate and sanitize tags

        YouTube tag limits:
        - Max 500 characters total
        - Each tag max 30 characters
        - 3-10 tags recommended for MVP

        Args:
            tags: Raw tags from AI

        Returns:
            Validated and sanitized tags (3-10 items)
        """
        # Ensure tags is a list
        if not isinstance(tags, list):
            tags = []

        # Strip whitespace and filter empty tags
        tags = [tag.strip() for tag in tags if tag and tag.strip()]

        # Remove duplicates (case-insensitive)
        seen = set()
        unique_tags = []
        for tag in tags:
            tag_lower = tag.lower()
            if tag_lower not in seen:
                seen.add(tag_lower)
                unique_tags.append(tag)

        tags = unique_tags

        # Truncate each tag to 30 characters
        tags = [tag[:30] if len(tag) > 30 else tag for tag in tags]

        # Limit to 10 tags
        tags = tags[:10]

        # Ensure at least 3 tags
        default_tags = ["숏폼", "AI", "자동생성"]
        while len(tags) < 3:
            for default_tag in default_tags:
                if default_tag not in tags:
                    tags.append(default_tag)
                    break
            if len(tags) >= 3:
                break

        return tags


# Global service instance
_metadata_service: Optional[MetadataService] = None


def get_metadata_service() -> MetadataService:
    """
    Get or create global MetadataService instance

    Returns:
        MetadataService instance
    """
    global _metadata_service

    if _metadata_service is None:
        _metadata_service = MetadataService()

    return _metadata_service
