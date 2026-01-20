# Members Module

회원 관리 모듈 - 회원 CRUD, 등급 관리, 계보 관리, 승급 로직

## 구조

```
members/
├── members.module.ts           # 모듈 정의
├── members.controller.ts       # REST API 컨트롤러
├── members.service.ts          # 회원 CRUD 및 기본 로직
├── promotion.service.ts        # 승급 조건 확인 및 처리
├── genealogy.service.ts        # 계보 관리 및 팀 통계
├── dto/                        # Data Transfer Objects
│   ├── create-member.dto.ts
│   ├── update-member.dto.ts
│   └── member-response.dto.ts
├── events/                     # 이벤트 정의
│   └── member-events.ts
└── listeners/                  # 이벤트 리스너
    └── member-grade.listener.ts
```

## 주요 기능

### 1. 회원 관리 (MembersService)
- CRUD 작업 (생성, 조회, 수정, 삭제)
- PV 누적 및 자동 승급 체크
- 등급 수동 변경 (ADMIN 전용)
- 하위 회원 조회 (후원계보/추천계보)

### 2. 승급 로직 (PromotionService)
- **MEMBER → AGENT**: 누적 PV >= 1,000,000
- **AGENT → MANAGER**: 3팀 모두 AGENT 1명 이상
- **MANAGER → BRANCH_CHIEF**: 3팀 중 2팀에 MANAGER 1명 이상
- **BRANCH_CHIEF → DIVISION_CHIEF**: 3팀 중 2팀에 BRANCH_CHIEF 1명 이상

### 3. 계보 관리 (GenealogyService)
- 팀별 통계 (회원 수, PV 합계, 등급 분포)
- 추천계보 통계
- 계보 트리 조회 (재귀, 지정 깊이)
- 팀 라인 자동 배정
- 팀 균형 재조정
- 상위 라인 조회 (부모 → 조부모)

## API 엔드포인트

### 회원 기본 CRUD
- `GET /api/v1/members` - 회원 목록 조회
- `GET /api/v1/members/:id` - 회원 상세 조회
- `POST /api/v1/members` - 회원 생성
- `PATCH /api/v1/members/:id` - 회원 정보 수정
- `DELETE /api/v1/members/:id` - 회원 삭제 (소프트 삭제)

### 계보 조회
- `GET /api/v1/members/:id/downline` - 하위 회원 (후원계보)
- `GET /api/v1/members/:id/recommendees` - 추천 회원 (추천계보)
- `GET /api/v1/members/:id/team-stats` - 팀별 통계
- `GET /api/v1/members/:id/recommender-stats` - 추천계보 통계
- `GET /api/v1/members/:id/genealogy-tree` - 계보 트리 (재귀)
- `GET /api/v1/members/:id/upline` - 상위 라인 조회

### 승급 관리
- `GET /api/v1/members/:id/promotion-check` - 승급 가능 여부 확인
- `POST /api/v1/members/:id/promote` - 승급 처리
- `POST /api/v1/members/batch-promote` - 일괄 승급 처리 (ADMIN)
- `PATCH /api/v1/members/:id/grade` - 수동 등급 변경 (ADMIN)

### 팀 관리
- `POST /api/v1/members/:id/suggest-team-line` - 최적 팀 라인 추천
- `POST /api/v1/members/:id/rebalance-teams` - 팀 균형 재조정 (ADMIN)

## 이벤트 시스템

### 설정 방법

1. `@nestjs/event-emitter` 설치:
```bash
pnpm add @nestjs/event-emitter
```

2. `MembersModule`에 EventEmitterModule 추가:
```typescript
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    PrismaModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [MembersController],
  providers: [
    MembersService,
    PromotionService,
    GenealogyService,
    MemberGradeListener, // 리스너 추가
  ],
  exports: [MembersService, PromotionService, GenealogyService],
})
export class MembersModule {}
```

3. 서비스에서 이벤트 발행:
```typescript
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GradeChangedEvent, MEMBER_EVENTS } from './events/member-events';

constructor(
  private readonly prisma: PrismaService,
  private readonly eventEmitter: EventEmitter2,
) {}

// 등급 변경 시 이벤트 발행
this.eventEmitter.emit(
  MEMBER_EVENTS.GRADE_CHANGED,
  new GradeChangedEvent(memberId, name, email, oldGrade, newGrade, 'auto')
);
```

### 정의된 이벤트

- `member.grade.changed` - 등급 변경 (자동/수동)
- `member.promoted` - 자동 승급
- `member.created` - 회원 생성
- `member.updated` - 회원 정보 수정
- `member.deleted` - 회원 삭제
- `member.pv.accumulated` - PV 누적

### BullMQ 통합 (향후)

이벤트 리스너를 BullMQ 큐 프로듀서로 전환하여 비동기 작업 처리:
```typescript
@Injectable()
export class MemberGradeListener {
  constructor(
    @InjectQueue('member-grade') private gradeQueue: Queue,
  ) {}

  @OnEvent(MEMBER_EVENTS.GRADE_CHANGED)
  async handleGradeChanged(event: GradeChangedEvent) {
    await this.gradeQueue.add('grade-changed', event);
  }
}
```

## 권한 관리 (TODO)

Task #44.5에서 구현 예정:
- JWT 인증 가드 적용
- Role 기반 권한 체크 (ADMIN, DIVISION_CHIEF 등)
- `@Roles()` 데코레이터 사용
- `@CurrentUser()` 데코레이터로 현재 사용자 정보 추출

## 테스트

```bash
# 유닛 테스트
pnpm test members.service.spec.ts
pnpm test promotion.service.spec.ts
pnpm test genealogy.service.spec.ts

# E2E 테스트
pnpm test:e2e members
```

## 주요 비즈니스 로직

### PV 누적 및 자동 승급
```typescript
// 판매 완료 시 PV 누적
const result = await membersService.accumulatePv(memberId, pvAmount);

if (result.promoted) {
  console.log(`자동 승급: ${result.newGrade}`);
}
```

### 일괄 승급 처리 (크론 작업)
```typescript
// 매일 자정 실행 (예: 크론 스케줄러)
const result = await promotionService.processBatchPromotion();
console.log(`${result.promoted}/${result.processed}명 승급`);
```

### 계보 트리 조회
```typescript
// 3단계 깊이로 후원계보 트리 조회
const tree = await genealogyService.getGenealogyTree(memberId, 3, 'sponsor');
```

## 데이터 모델

### Member (Prisma Schema)
```prisma
model Member {
  id              Int       @id @default(autoincrement())
  email           String    @unique
  grade           MemberGrade @default(MEMBER)
  recommenderId   Int?      // 추천인 (1:N)
  sponsorId       Int?      // 후원인 (3팀)
  teamLine        Int?      // 1, 2, 3
  cumulativePv    Int       @default(0)
  agentPromotedAt DateTime?
  // ...
}

enum MemberGrade {
  MEMBER          // 회원
  AGENT           // 에이전트 (100만 PV)
  MANAGER         // 매니저
  BRANCH_CHIEF    // 지부장
  DIVISION_CHIEF  // 본부장
  ADMIN           // 최고관리자
}
```

---

**Last Updated**: 2025-12-28
**Version**: 1.0.0
