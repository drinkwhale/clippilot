/**
 * 포맷팅 유틸리티
 *
 * 날짜, 시간, 숫자 등을 사람이 읽기 쉬운 형식으로 변환합니다.
 */

/**
 * 영상 길이(초)를 시:분:초 형식으로 변환
 *
 * @param seconds - 총 초
 * @returns 포맷팅된 시간 문자열
 *
 * @example
 * formatDuration(90) // "1:30"
 * formatDuration(3730) // "1:02:10"
 * formatDuration(30) // "0:30"
 */
export function formatDuration(seconds: number): string {
  if (seconds < 0) return '0:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

/**
 * 조회수를 축약된 형식으로 변환
 *
 * @param count - 조회수
 * @returns 포맷팅된 조회수 문자열
 *
 * @example
 * formatViewCount(1234) // "1.2천"
 * formatViewCount(1234567) // "123만"
 * formatViewCount(123) // "123"
 */
export function formatViewCount(count: number): string {
  if (count < 1000) {
    return count.toString();
  } else if (count < 10000) {
    return `${(count / 1000).toFixed(1)}천`;
  } else if (count < 100000000) {
    return `${Math.floor(count / 10000)}만`;
  } else {
    return `${(count / 100000000).toFixed(1)}억`;
  }
}

/**
 * ISO 8601 날짜를 상대적 시간으로 변환
 *
 * @param dateString - ISO 8601 날짜 문자열
 * @returns 상대적 시간 문자열
 *
 * @example
 * formatRelativeDate("2024-01-01T00:00:00Z") // "3일 전"
 * formatRelativeDate("2024-01-01T00:00:00Z") // "2주 전"
 */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSecs < 60) {
    return '방금 전';
  } else if (diffMins < 60) {
    return `${diffMins}분 전`;
  } else if (diffHours < 24) {
    return `${diffHours}시간 전`;
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else if (diffWeeks < 4) {
    return `${diffWeeks}주 전`;
  } else if (diffMonths < 12) {
    return `${diffMonths}개월 전`;
  } else {
    return `${diffYears}년 전`;
  }
}

/**
 * ISO 8601 날짜를 YYYY.MM.DD 형식으로 변환
 *
 * @param dateString - ISO 8601 날짜 문자열
 * @returns 포맷팅된 날짜 문자열
 *
 * @example
 * formatDate("2024-01-15T10:30:00Z") // "2024.01.15"
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  return `${year}.${month}.${day}`;
}

/**
 * ISO 8601 날짜를 YYYY.MM.DD HH:mm 형식으로 변환
 *
 * @param dateString - ISO 8601 날짜 문자열
 * @returns 포맷팅된 날짜 시간 문자열
 *
 * @example
 * formatDateTime("2024-01-15T10:30:00Z") // "2024.01.15 10:30"
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${year}.${month}.${day} ${hours}:${minutes}`;
}

/**
 * 숫자를 천 단위 콤마 형식으로 변환
 *
 * @param num - 숫자
 * @returns 포맷팅된 숫자 문자열
 *
 * @example
 * formatNumber(1234567) // "1,234,567"
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('ko-KR');
}

/**
 * 파일 크기를 사람이 읽기 쉬운 형식으로 변환
 *
 * @param bytes - 바이트 크기
 * @returns 포맷팅된 파일 크기 문자열
 *
 * @example
 * formatFileSize(1024) // "1 KB"
 * formatFileSize(1048576) // "1 MB"
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
}

/**
 * 퍼센트 값을 소수점 1자리까지 포맷팅
 *
 * @param value - 퍼센트 값 (0-100)
 * @returns 포맷팅된 퍼센트 문자열
 *
 * @example
 * formatPercent(75.456) // "75.5%"
 * formatPercent(100) // "100%"
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * CII 점수를 포맷팅 (0-100)
 *
 * @param score - CII 점수
 * @returns 포맷팅된 점수 문자열
 *
 * @example
 * formatCIIScore(75.456) // "75"
 * formatCIIScore(100) // "100"
 */
export function formatCIIScore(score: number): string {
  return Math.round(score).toString();
}
