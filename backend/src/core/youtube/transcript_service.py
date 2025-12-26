"""YouTube 자막 다운로드 서비스"""

import logging
from typing import List, Dict, Any, Optional
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    TranscriptsDisabled,
    NoTranscriptFound,
    VideoUnavailable,
)

from src.core.youtube.exceptions import YouTubeAPIError

logger = logging.getLogger(__name__)


class TranscriptService:
    """YouTube 자막 추출 서비스"""

    @staticmethod
    async def get_transcript(
        video_id: str, languages: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        YouTube 영상의 자막 가져오기

        Args:
            video_id: YouTube 영상 ID
            languages: 선호 언어 목록 (기본값: ['ko', 'en'])

        Returns:
            자막 세그먼트 목록 [{"text": str, "start": float, "duration": float}]

        Raises:
            YouTubeAPIError: 자막을 가져올 수 없는 경우
        """
        if languages is None:
            languages = ["ko", "en"]

        try:
            # 자막 가져오기
            transcript_list = YouTubeTranscriptApi.get_transcript(
                video_id, languages=languages
            )

            logger.info(
                f"자막 가져오기 성공: video_id={video_id}, segments={len(transcript_list)}"
            )
            return transcript_list

        except TranscriptsDisabled:
            logger.warning(f"자막이 비활성화됨: video_id={video_id}")
            raise YouTubeAPIError("이 영상은 자막이 비활성화되어 있습니다.")
        except NoTranscriptFound:
            logger.warning(f"요청한 언어의 자막을 찾을 수 없음: video_id={video_id}")
            raise YouTubeAPIError(
                f"요청한 언어({', '.join(languages)})의 자막을 찾을 수 없습니다."
            )
        except VideoUnavailable:
            logger.warning(f"영상을 사용할 수 없음: video_id={video_id}")
            raise YouTubeAPIError("영상을 사용할 수 없습니다.")
        except Exception as e:
            logger.error(f"자막 가져오기 실패: video_id={video_id}, error={e}")
            raise YouTubeAPIError(f"자막을 가져오는 중 오류가 발생했습니다: {str(e)}")

    @staticmethod
    async def get_transcript_text(
        video_id: str, languages: Optional[List[str]] = None
    ) -> str:
        """
        YouTube 영상의 자막을 텍스트로 변환

        Args:
            video_id: YouTube 영상 ID
            languages: 선호 언어 목록 (기본값: ['ko', 'en'])

        Returns:
            자막 전체 텍스트 (줄바꿈으로 구분)

        Raises:
            YouTubeAPIError: 자막을 가져올 수 없는 경우
        """
        transcript = await TranscriptService.get_transcript(video_id, languages)

        # 자막 텍스트만 추출하여 결합
        text_lines = [segment["text"] for segment in transcript]
        full_text = "\n".join(text_lines)

        logger.info(
            f"자막 텍스트 변환 성공: video_id={video_id}, length={len(full_text)}"
        )
        return full_text

    @staticmethod
    async def get_available_transcripts(video_id: str) -> List[Dict[str, Any]]:
        """
        YouTube 영상의 사용 가능한 자막 목록 조회

        Args:
            video_id: YouTube 영상 ID

        Returns:
            사용 가능한 자막 목록 [{"language": str, "language_code": str, "is_generated": bool}]

        Raises:
            YouTubeAPIError: 자막 목록을 가져올 수 없는 경우
        """
        try:
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)

            available = []

            # 수동 생성 자막
            for transcript in transcript_list:
                if not transcript.is_generated:
                    available.append(
                        {
                            "language": transcript.language,
                            "language_code": transcript.language_code,
                            "is_generated": False,
                        }
                    )

            # 자동 생성 자막
            for transcript in transcript_list:
                if transcript.is_generated:
                    available.append(
                        {
                            "language": transcript.language,
                            "language_code": transcript.language_code,
                            "is_generated": True,
                        }
                    )

            logger.info(
                f"사용 가능한 자막 목록 조회 성공: video_id={video_id}, count={len(available)}"
            )
            return available

        except TranscriptsDisabled:
            logger.warning(f"자막이 비활성화됨: video_id={video_id}")
            return []
        except VideoUnavailable:
            logger.warning(f"영상을 사용할 수 없음: video_id={video_id}")
            raise YouTubeAPIError("영상을 사용할 수 없습니다.")
        except Exception as e:
            logger.error(f"자막 목록 조회 실패: video_id={video_id}, error={e}")
            raise YouTubeAPIError(f"자막 목록 조회 중 오류가 발생했습니다: {str(e)}")
