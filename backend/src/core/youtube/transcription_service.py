"""
YouTube 영상 음성 자막 수집 서비스

OpenAI Whisper API를 사용하여 YouTube 영상의 음성을 텍스트로 변환합니다.
"""
import tempfile
import os
from pathlib import Path
from typing import Optional
import yt_dlp
from openai import OpenAI
from loguru import logger

from src.config import settings


class TranscriptionService:
    """YouTube 영상 음성을 자막으로 변환하는 서비스"""

    def __init__(self):
        self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)

    def extract_audio(self, video_id: str, output_dir: str) -> str:
        """
        YouTube 영상에서 오디오 추출 (mp3)

        Args:
            video_id: YouTube 영상 ID
            output_dir: 오디오 파일 저장 디렉토리

        Returns:
            추출된 오디오 파일 경로

        Raises:
            Exception: 오디오 추출 실패 시
        """
        url = f"https://www.youtube.com/watch?v={video_id}"
        output_path = os.path.join(output_dir, "audio")

        ydl_opts = {
            "format": "bestaudio/best",
            "outtmpl": output_path,
            "postprocessors": [
                {
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "mp3",
                    "preferredquality": "192",
                }
            ],
            "quiet": True,
            "no_warnings": True,
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                logger.info(f"Extracting audio from video: {video_id}")
                ydl.download([url])
            return f"{output_path}.mp3"
        except Exception as e:
            logger.error(f"Failed to extract audio from {video_id}: {str(e)}")
            raise

    def transcribe_audio(
        self, audio_path: str, language: Optional[str] = "ko"
    ) -> dict:
        """
        OpenAI Whisper API로 음성을 텍스트로 변환

        Args:
            audio_path: 오디오 파일 경로
            language: 언어 코드 (ko, en, ja 등) - None이면 자동 감지

        Returns:
            {
                "text": "전체 텍스트",
                "language": "언어 코드",
                "duration": 120.5,
                "segments": [
                    {"start": 0.0, "end": 2.5, "text": "안녕하세요"},
                    ...
                ]
            }

        Raises:
            Exception: API 호출 실패 시
        """
        try:
            with open(audio_path, "rb") as audio_file:
                logger.info(f"Transcribing audio file: {audio_path}")
                response = self.openai_client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language=language,
                    response_format="verbose_json",
                    timestamp_granularities=["segment"],
                )

            return {
                "text": response.text,
                "language": response.language,
                "duration": response.duration,
                "segments": [
                    {"start": seg["start"], "end": seg["end"], "text": seg["text"]}
                    for seg in response.segments
                ],
            }
        except Exception as e:
            logger.error(f"Failed to transcribe audio: {str(e)}")
            raise

    def transcribe_video(
        self, video_id: str, language: Optional[str] = "ko"
    ) -> dict:
        """
        YouTube 영상 음성을 자막으로 변환 (전체 프로세스)

        Args:
            video_id: YouTube 영상 ID
            language: 언어 코드 (ko, en, ja 등) - None이면 자동 감지

        Returns:
            {
                "video_id": "영상 ID",
                "language": "언어 코드",
                "text": "전체 텍스트",
                "duration": 120.5,
                "segments": [
                    {"start": 0.0, "end": 2.5, "text": "안녕하세요"},
                    ...
                ]
            }

        Raises:
            Exception: 처리 실패 시
        """
        with tempfile.TemporaryDirectory() as tmpdir:
            try:
                # 1. 오디오 추출
                audio_path = self.extract_audio(video_id, tmpdir)
                logger.info(f"Audio extracted to: {audio_path}")

                # 2. Whisper API로 변환
                result = self.transcribe_audio(audio_path, language)
                logger.info(
                    f"Transcription completed for {video_id}: "
                    f"{len(result['segments'])} segments, "
                    f"{result['duration']:.2f}s"
                )

                return {
                    "video_id": video_id,
                    "language": result["language"],
                    "text": result["text"],
                    "duration": result["duration"],
                    "segments": result["segments"],
                }
            except Exception as e:
                logger.error(f"Failed to transcribe video {video_id}: {str(e)}")
                raise

    def transcribe_to_srt(
        self, video_id: str, language: Optional[str] = "ko"
    ) -> str:
        """
        SRT 자막 형식으로 변환

        Args:
            video_id: YouTube 영상 ID
            language: 언어 코드 (ko, en, ja 등) - None이면 자동 감지

        Returns:
            SRT 형식 문자열

        Raises:
            Exception: 처리 실패 시
        """
        with tempfile.TemporaryDirectory() as tmpdir:
            try:
                audio_path = self.extract_audio(video_id, tmpdir)

                with open(audio_path, "rb") as audio_file:
                    response = self.openai_client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file,
                        language=language,
                        response_format="srt",
                    )

                return response  # SRT 문자열 반환
            except Exception as e:
                logger.error(
                    f"Failed to generate SRT for video {video_id}: {str(e)}"
                )
                raise
