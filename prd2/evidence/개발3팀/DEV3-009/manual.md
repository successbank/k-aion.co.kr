# DEV3-009 manual verification

**일자**: 2026-04-15 / **담당**: 윤재호 (코드검증 Hook)

## 변경

`.husky/commit-msg` 신규 (실행권한 chmod +x)

## 검증 항목 3가지

1. **빈 메시지 차단**: 주석/공백만 있는 커밋 메시지 → exit 1
2. **최소 길이**: 첫 줄 10자 이상 (주석 제외) → 미달 시 exit 1
3. **검증 태그 권장 (경고만)**: `[검증:대기/통과/통합통과/실패]` 패턴 권장 → 미준수 시 경고 출력만 (차단 X)

## 검증 태그 차단 안 함 — 사유

페르소나 시스템 v2 검증 게이트 규칙은 검증 태그를 권장하지만, 다음 경우 태그가 없을 수 있음:
- Co-Authored 머지 commit
- fix commit (즉시 수정)
- 본 작업의 인프라 정리 commit

차단 시 정상 작업도 막힘 → 경고만으로 권장. 강제는 README + 페르소나 카드가 담당.

## 후속 검증

```bash
# 빈 메시지 시도
git commit --allow-empty -m ""
# Expected: 차단 (commit-msg가 거부)

# 너무 짧은 메시지
git commit --allow-empty -m "fix"
# Expected: 차단 (5자 < 10자)

# 검증 태그 없는 정상 메시지
git commit --allow-empty -m "feat: 첫 commit message"
# Expected: 경고만, 통과

# 검증 태그 있는 메시지
git commit --allow-empty -m "feat: feature complete [검증:통과]"
# Expected: OK 표시
```

## Pass 기준

- [x] .husky/commit-msg 작성 (실행권한)
- [x] 빈 메시지 차단 로직
- [x] 최소 길이 (10자) 검증
- [x] 검증 태그 권장 (경고만)
- [x] husky shim 조건부 source

## 의존

- DEV3-008 (husky pre-commit) 동시 설치 → husky 자체가 활성화

## 결과: PASS (정적 검증)
