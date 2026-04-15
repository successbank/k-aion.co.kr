# MON-007 manual verification

**일자**: 2026-04-15
**담당**: 김수현 (시스템) + 임동혁 (DevOps)

## 변경

`docker-compose.yml` backend service에 Winston 로그 호스트 마운트 추가:
```yaml
- ./apps/backend/logs:/app/apps/backend/logs
```

## 사유

- 이전: Winston 파일 로거가 `apps/backend/logs/`에 기록 (상대 경로)
- 이전: 컨테이너 내부 경로만 존재 → 컨테이너 재시작 시 로그 증발
- 이후: 호스트의 `apps/backend/logs/` 디렉토리에 영구 보관
- MON-001 (LoggingInterceptor 등록) + MON-002 (Nginx access_log) + MON-007 (Winston 영구화)이 함께 모니터링 인프라 핵심 3종 세트

## 후속 검증

```bash
mkdir -p apps/backend/logs  # 호스트 디렉토리 생성 (없으면)
docker-compose down && docker-compose up -d
docker exec kaion_backend ls -la /app/apps/backend/logs
# Expected: 로그 파일 2-3개 (combined.log, error.log 등)
ls -la apps/backend/logs/
# Expected: 동일 파일 호스트에서 직접 확인
```

## 결과: PASS
