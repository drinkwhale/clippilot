package main

import (
	"fmt"
	"log"
)

func main() {
	fmt.Println("ClipPilot Rendering Worker v1.0.0")
	log.Println("Worker 시작...")

	// TODO: Redis 큐 리스너 초기화
	// TODO: 렌더링 워커 풀 시작

	select {} // 무한 대기
}
