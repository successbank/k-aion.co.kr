# MON-004 manual verification

**일자**: 2026-04-15
**담당**: 김수현 (모니터링팀 시스템)

## 변경

`docker/nginx/nginx.conf` `/health` proxy_pass: `backend/health` → `backend/api/health`

## 사유

NestJS는 `app.setGlobalPrefix('api')`로 모든 라우트에 `/api` 접두사 적용. 따라서 backend는 `/api/health`만 응답하고 `/health`는 404. 이전 nginx 설정은 잘못된 경로로 proxy.

추가: `access_log` + `error_log` 지시어 명시 (MON-002 — 이전엔 default값 사용).

## 후속 런타임 검증

```bash
docker-compose restart nginx
curl -i http://localhost:5667/health
# Expected: 200 OK + backend health check JSON
```

## Pass 기준

- [x] nginx.conf `/health` location 수정
- [x] access_log/error_log 지시어 추가
- [ ] 런타임 검증 (후속)

## 결과: PASS (정적 검증 기준)
