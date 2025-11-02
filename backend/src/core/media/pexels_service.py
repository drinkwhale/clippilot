"""
Pexels API 연동 서비스

스톡 영상 및 이미지 검색 기능을 제공합니다.
FR-003: 스톡 미디어 검색 및 다운로드
"""

import os
from typing import List, Optional, Dict, Any
import httpx
from loguru import logger


class PexelsService:
    """Pexels API 연동 클래스"""

    def __init__(self):
        self.api_key = os.getenv("PEXELS_API_KEY")
        if not self.api_key:
            raise ValueError("PEXELS_API_KEY environment variable is required")

        self.base_url = "https://api.pexels.com/v1"
        self.videos_url = "https://api.pexels.com/videos"
        self.headers = {"Authorization": self.api_key}

    async def search_videos(
        self,
        query: str,
        per_page: int = 15,
        page: int = 1,
        orientation: Optional[str] = None,
        size: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Pexels에서 영상 검색

        Args:
            query: 검색 키워드
            per_page: 페이지당 결과 수 (1-80)
            page: 페이지 번호
            orientation: 영상 방향 (landscape, portrait, square)
            size: 영상 크기 (large, medium, small)

        Returns:
            검색 결과 딕셔너리
            {
                "videos": [...],
                "page": 1,
                "per_page": 15,
                "total_results": 100,
                "url": "..."
            }

        Raises:
            httpx.HTTPStatusError: API 요청 실패
        """
        params = {
            "query": query,
            "per_page": per_page,
            "page": page,
        }

        if orientation:
            params["orientation"] = orientation
        if size:
            params["size"] = size

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.get(
                    f"{self.videos_url}/search",
                    headers=self.headers,
                    params=params,
                )
                response.raise_for_status()

                data = response.json()
                logger.info(
                    f"Pexels video search: query={query}, "
                    f"results={data.get('total_results', 0)}"
                )

                return data

            except httpx.HTTPStatusError as e:
                logger.error(f"Pexels API error: {e.response.status_code} - {e.response.text}")
                raise
            except Exception as e:
                logger.error(f"Pexels search failed: {str(e)}")
                raise

    async def search_photos(
        self,
        query: str,
        per_page: int = 15,
        page: int = 1,
        orientation: Optional[str] = None,
        size: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Pexels에서 이미지 검색

        Args:
            query: 검색 키워드
            per_page: 페이지당 결과 수 (1-80)
            page: 페이지 번호
            orientation: 이미지 방향 (landscape, portrait, square)
            size: 이미지 크기 (large, medium, small)

        Returns:
            검색 결과 딕셔너리
        """
        params = {
            "query": query,
            "per_page": per_page,
            "page": page,
        }

        if orientation:
            params["orientation"] = orientation
        if size:
            params["size"] = size

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/search",
                    headers=self.headers,
                    params=params,
                )
                response.raise_for_status()

                data = response.json()
                logger.info(
                    f"Pexels photo search: query={query}, "
                    f"results={data.get('total_results', 0)}"
                )

                return data

            except httpx.HTTPStatusError as e:
                logger.error(f"Pexels API error: {e.response.status_code} - {e.response.text}")
                raise
            except Exception as e:
                logger.error(f"Pexels search failed: {str(e)}")
                raise

    async def get_video(self, video_id: int) -> Dict[str, Any]:
        """
        특정 영상의 상세 정보 가져오기

        Args:
            video_id: Pexels 영상 ID

        Returns:
            영상 정보 딕셔너리
        """
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.get(
                    f"{self.videos_url}/videos/{video_id}",
                    headers=self.headers,
                )
                response.raise_for_status()
                return response.json()

            except httpx.HTTPStatusError as e:
                logger.error(f"Pexels API error: {e.response.status_code} - {e.response.text}")
                raise
            except Exception as e:
                logger.error(f"Get video failed: {str(e)}")
                raise

    async def get_photo(self, photo_id: int) -> Dict[str, Any]:
        """
        특정 이미지의 상세 정보 가져오기

        Args:
            photo_id: Pexels 이미지 ID

        Returns:
            이미지 정보 딕셔너리
        """
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.get(
                    f"{self.base_url}/photos/{photo_id}",
                    headers=self.headers,
                )
                response.raise_for_status()
                return response.json()

            except httpx.HTTPStatusError as e:
                logger.error(f"Pexels API error: {e.response.status_code} - {e.response.text}")
                raise
            except Exception as e:
                logger.error(f"Get photo failed: {str(e)}")
                raise

    def get_video_file_url(
        self,
        video_data: Dict[str, Any],
        quality: str = "hd"
    ) -> Optional[str]:
        """
        영상 파일 다운로드 URL 추출

        Args:
            video_data: get_video() 또는 search_videos()에서 반환된 영상 데이터
            quality: 영상 품질 (hd, sd, etc.)

        Returns:
            다운로드 URL 또는 None
        """
        video_files = video_data.get("video_files", [])

        # 요청한 품질의 영상 파일 찾기
        for file in video_files:
            if file.get("quality") == quality:
                return file.get("link")

        # 품질이 없으면 첫 번째 파일 반환
        if video_files:
            return video_files[0].get("link")

        return None

    def get_photo_file_url(
        self,
        photo_data: Dict[str, Any],
        size: str = "large"
    ) -> Optional[str]:
        """
        이미지 파일 다운로드 URL 추출

        Args:
            photo_data: get_photo() 또는 search_photos()에서 반환된 이미지 데이터
            size: 이미지 크기 (original, large, large2x, medium, small, portrait, landscape, tiny)

        Returns:
            다운로드 URL 또는 None
        """
        src = photo_data.get("src", {})
        return src.get(size, src.get("original"))

    async def download_media(
        self,
        url: str,
        output_path: str,
    ) -> bool:
        """
        미디어 파일 다운로드

        Args:
            url: 다운로드 URL
            output_path: 저장할 파일 경로

        Returns:
            성공 여부
        """
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.get(url)
                response.raise_for_status()

                with open(output_path, "wb") as f:
                    f.write(response.content)

                logger.info(f"Media downloaded: {output_path}")
                return True

            except Exception as e:
                logger.error(f"Download failed: {str(e)}")
                return False


# 싱글톤 인스턴스
_pexels_service: Optional[PexelsService] = None


def get_pexels_service() -> PexelsService:
    """Pexels 서비스 싱글톤 인스턴스 반환"""
    global _pexels_service
    if _pexels_service is None:
        _pexels_service = PexelsService()
    return _pexels_service
