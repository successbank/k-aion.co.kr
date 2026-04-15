# DEV1-003 manual verification

**일자**: 2026-04-15
**담당**: 김태현 (개발1팀 BE 리드) + 배경민 (스케일링)
**연관**: prd/개발1팀_파악된내용.md Critical "MemberGradeListener 미등록", 리서치팀 RSRCH-C01

## 변경 요약

2 파일 변경:

1. `app.module.ts`: `EventEmitterModule.forRoot()` 글로벌 import 추가
2. `members/members.module.ts`: `MemberGradeListener`를 providers 배열에 등록

## 변경 위치

### app.module.ts
- import 추가: `import { EventEmitterModule } from '@nestjs/event-emitter';`
- imports 배열에 `EventEmitterModule.forRoot()` 추가
- 주석으로 변경 이유 + 향후 BullMQ 전환 entry point임을 명시

### members/members.module.ts
- import 추가: `import { MemberGradeListener } from './listeners/member-grade.listener';`
- providers 배열에 `MemberGradeListener` 추가

## 검증 — 이전 상태 vs 신 상태

| 항목 | 이전 | 신 |
|------|------|------|
| `EventEmitterModule.forRoot()` 등록 | 0건 | 1건 (app.module.ts) |
| `MemberGradeListener` providers 등록 | 0건 | 1건 (members.module.ts) |
| `@OnEvent` 데코레이터 활성화 | 안됨 | 활성화 |

`MemberGradeListener` 클래스는 다음 두 이벤트 핸들러를 가지고 있음 (이미 작성됨):
- `handleGradeChanged(event: GradeChangedEvent)` — `@OnEvent('member.grade.changed')`
- `handlePromoted(event: PromotedEvent)` — `@OnEvent('member.promoted')`

이 핸들러들은 이전엔 절대 호출되지 않았음 (등록 없이는 NestJS가 인식 안 함).

## 런타임 검증 (Stage 4 후속)

```bash
# 1. backend 컨테이너 재시작
docker-compose restart backend

# 2. 회원 등급 수동 변경 트리거 (admin 권한 필요)
curl -X PATCH http://localhost:5667/api/v1/members/{id}/grade \
  -H "Authorization: Bearer {admin_token}" \
  -d '{"grade": "TEAM_LEADER"}'

# 3. backend 로그에서 listener 호출 확인
docker logs --tail 100 kaion_backend | grep "MemberGradeListener\|등급 변경됨"
# Expected: 등급 변경됨: {name} (ID: {id}) SALESPERSON → TEAM_LEADER ...
```

## 영향

- 등급 변경 시 자동으로 listener 호출
- 향후 알림 발송, 통계 집계, 보너스 재계산 등 확장 가능 (TODO 주석 명시됨)
- BullMQ 전환 entry point 확보 (이정민/김도윤 PoC 시작 가능)

## Pass 기준 충족 확인

- [x] `EventEmitterModule.forRoot()` app.module.ts 등록
- [x] `MemberGradeListener` members.module.ts providers 등록
- [x] 두 파일 모두 변경 이유 주석 명시
- [x] @OnEvent 데코레이터 활성화 가능 상태
- [ ] 런타임 검증 (Stage 4 후속)

## 결과: PASS (정적 검증 기준)
