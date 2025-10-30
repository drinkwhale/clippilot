"""
Subtitle Generation Service for ClipPilot
Converts scripts into SRT (SubRip Text) format for video subtitles
"""

from typing import List, Dict, Any
import logging
import re

from ...core.exceptions import ContentGenerationError

logger = logging.getLogger(__name__)


class SubtitleService:
    """Service for generating SRT subtitles from scripts"""

    def __init__(self):
        """Initialize subtitle service"""
        pass

    def generate_srt(
        self,
        script: str,
        video_length_sec: int = 30,
        words_per_minute: int = 150,
    ) -> str:
        """
        Generate SRT subtitle file from script

        SRT format:
        1
        00:00:00,000 --> 00:00:03,000
        First subtitle line

        2
        00:00:03,000 --> 00:00:06,000
        Second subtitle line

        Args:
            script: Video script (one sentence per line or paragraph)
            video_length_sec: Target video length in seconds
            words_per_minute: Average speaking rate (default: 150 wpm)

        Returns:
            SRT format subtitle string

        Raises:
            ContentGenerationError: If subtitle generation fails
        """
        try:
            logger.info(f"Generating SRT: video_length={video_length_sec}s, wpm={words_per_minute}")

            # Split script into sentences
            sentences = self._split_into_sentences(script)

            if not sentences:
                raise ValueError("Script is empty or contains no valid sentences")

            # Calculate timing for each sentence
            subtitle_blocks = self._calculate_timings(
                sentences=sentences,
                total_duration_sec=video_length_sec,
                words_per_minute=words_per_minute,
            )

            # Generate SRT content
            srt_content = self._format_srt(subtitle_blocks)

            logger.info(f"SRT generated successfully: {len(subtitle_blocks)} subtitle blocks")

            return srt_content

        except ValueError as e:
            logger.error(f"Invalid script for SRT generation: {e}")
            raise ContentGenerationError(f"자막 생성 실패: {str(e)}")

        except Exception as e:
            logger.error(f"SRT generation failed: {e}", exc_info=True)
            raise ContentGenerationError(
                "자막 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
            )

    def _split_into_sentences(self, script: str) -> List[str]:
        """
        Split script into sentences

        Args:
            script: Input script text

        Returns:
            List of sentences
        """
        # Remove extra whitespace
        script = script.strip()

        # Split by newlines first (script is expected to have one sentence per line)
        lines = [line.strip() for line in script.split("\n") if line.strip()]

        # If no newlines, split by sentence endings
        if not lines:
            # Split by Korean/English sentence endings
            sentences = re.split(r"[.!?]\s+", script)
            sentences = [s.strip() for s in sentences if s.strip()]
        else:
            sentences = lines

        return sentences

    def _calculate_timings(
        self,
        sentences: List[str],
        total_duration_sec: int,
        words_per_minute: int,
    ) -> List[Dict[str, Any]]:
        """
        Calculate start/end times for each sentence

        Args:
            sentences: List of sentences
            total_duration_sec: Total video duration
            words_per_minute: Speaking rate

        Returns:
            List of dicts with 'text', 'start_ms', 'end_ms'
        """
        # Calculate word count for each sentence
        # For Korean, count characters divided by 2 as approximate word count
        sentence_word_counts = []
        for sentence in sentences:
            # Count English words
            english_words = len(re.findall(r"\b[a-zA-Z]+\b", sentence))
            # Count Korean characters (rough estimate: 2 chars = 1 word)
            korean_chars = len(re.findall(r"[가-힣]", sentence))
            korean_words = korean_chars / 2

            total_words = english_words + korean_words
            sentence_word_counts.append(max(1, total_words))  # At least 1 word

        total_words = sum(sentence_word_counts)
        total_duration_ms = total_duration_sec * 1000

        # Validate: check if minimum duration (1s per sentence) fits in video length
        min_required_duration_ms = len(sentences) * 1000
        if min_required_duration_ms > total_duration_ms:
            raise ValueError(
                f"스크립트가 너무 깁니다. {len(sentences)}개 문장은 최소 {min_required_duration_ms / 1000}초가 필요하지만, "
                f"영상 길이는 {total_duration_sec}초입니다. 문장을 줄여주세요."
            )

        # Calculate duration for each sentence proportionally
        subtitle_blocks = []
        current_time_ms = 0

        for i, (sentence, word_count) in enumerate(zip(sentences, sentence_word_counts)):
            # Calculate duration based on word proportion
            proportion = word_count / total_words
            duration_ms = int(proportion * total_duration_ms)

            # Ensure minimum duration of 1 second per subtitle
            duration_ms = max(duration_ms, 1000)

            # For last sentence, extend to end of video
            if i == len(sentences) - 1:
                end_time_ms = total_duration_ms
            else:
                end_time_ms = min(current_time_ms + duration_ms, total_duration_ms)

            # Prevent negative durations
            if end_time_ms <= current_time_ms:
                end_time_ms = min(current_time_ms + 1000, total_duration_ms)

            subtitle_blocks.append({
                "text": sentence,
                "start_ms": current_time_ms,
                "end_ms": end_time_ms,
            })

            current_time_ms = end_time_ms

            # Stop if we've reached the end of the video
            if current_time_ms >= total_duration_ms:
                # If there are remaining sentences, log a warning
                remaining = len(sentences) - i - 1
                if remaining > 0:
                    logger.warning(
                        f"Video duration exceeded: skipping last {remaining} sentences"
                    )
                break

        return subtitle_blocks

    def _format_srt(self, subtitle_blocks: List[Dict[str, Any]]) -> str:
        """
        Format subtitle blocks into SRT format

        Args:
            subtitle_blocks: List of subtitle blocks with timing

        Returns:
            SRT format string
        """
        srt_lines = []

        for i, block in enumerate(subtitle_blocks, start=1):
            # Block number
            srt_lines.append(str(i))

            # Timing line
            start_time = self._format_timestamp(block["start_ms"])
            end_time = self._format_timestamp(block["end_ms"])
            srt_lines.append(f"{start_time} --> {end_time}")

            # Subtitle text
            srt_lines.append(block["text"])

            # Blank line (separator)
            srt_lines.append("")

        return "\n".join(srt_lines)

    def _format_timestamp(self, ms: int) -> str:
        """
        Format milliseconds into SRT timestamp (HH:MM:SS,mmm)

        Args:
            ms: Time in milliseconds

        Returns:
            Formatted timestamp string
        """
        hours = ms // 3600000
        ms %= 3600000
        minutes = ms // 60000
        ms %= 60000
        seconds = ms // 1000
        milliseconds = ms % 1000

        return f"{hours:02d}:{minutes:02d}:{seconds:02d},{milliseconds:03d}"


# Global service instance
_subtitle_service: SubtitleService | None = None


def get_subtitle_service() -> SubtitleService:
    """
    Get or create global SubtitleService instance

    Returns:
        SubtitleService instance
    """
    global _subtitle_service

    if _subtitle_service is None:
        _subtitle_service = SubtitleService()

    return _subtitle_service
