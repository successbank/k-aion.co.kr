# Products Module

제품 및 카테고리 관리 모듈 - 제품 CRUD, 카테고리 계층 구조, 재고 관리

## 구조

```
products/
├── products.module.ts          # 모듈 정의
├── products.controller.ts      # 제품 REST API 컨트롤러
├── products.service.ts         # 제품 비즈니스 로직
├── categories.controller.ts    # 카테고리 REST API 컨트롤러
├── categories.service.ts       # 카테고리 비즈니스 로직
├── dto/                        # Data Transfer Objects
│   ├── create-product.dto.ts
│   ├── update-product.dto.ts
│   ├── product-response.dto.ts
│   ├── create-category.dto.ts
│   └── update-category.dto.ts
└── README.md                   # 이 파일
```

## 주요 기능

### 1. 제품 관리 (ProductsService)

- **CRUD 작업**: 제품 생성, 조회, 수정, 삭제
- **페이징/검색**: 제품명, 코드로 검색, 페이지네이션 지원
- **카테고리 필터링**: 특정 카테고리의 제품만 조회
- **활성 상태 필터**: isActive 필드로 판매 중/중단 제품 관리
- **재고 관리**: 재고 조정 (증가/감소)
- **소프트 삭제**: 판매 이력이 있는 제품은 비활성화, 없는 제품은 하드 삭제

### 2. 카테고리 관리 (CategoriesService)

- **2단계 계층 구조**: 대분류(level=1), 소분류(level=2)
- **계층 구조 조회**: 대분류와 하위 소분류를 한 번에 조회
- **제품 수 확인**: 카테고리별 제품 목록 포함
- **삭제 보호**: 하위 카테고리나 제품이 있으면 삭제 불가

## API 엔드포인트

### 제품 API

#### 기본 CRUD

- `GET /api/v1/products` - 제품 목록 조회 (페이징)
  - Query Parameters:
    - `page`: 페이지 번호 (기본값: 1)
    - `limit`: 페이지당 개수 (기본값: 20)
    - `search`: 제품명 또는 코드 검색
    - `categoryId`: 카테고리 필터
    - `isActive`: 활성 상태 필터

- `GET /api/v1/products/:id` - 제품 상세 조회
- `POST /api/v1/products` - 제품 생성 (ADMIN)
- `PATCH /api/v1/products/:id` - 제품 수정 (ADMIN)
- `DELETE /api/v1/products/:id` - 제품 삭제 (ADMIN)

#### 재고 관리

- `PATCH /api/v1/products/:id/stock` - 재고 조정 (ADMIN)
  - Body: `{ "adjustment": 10 }` (양수: 입고, 음수: 출고)

### 카테고리 API

- `GET /api/v1/categories` - 카테고리 목록 조회 (계층 구조)
- `GET /api/v1/categories/:id` - 카테고리 상세 조회
- `POST /api/v1/categories` - 카테고리 생성 (ADMIN)
- `PATCH /api/v1/categories/:id` - 카테고리 수정 (ADMIN)
- `DELETE /api/v1/categories/:id` - 카테고리 삭제 (ADMIN)

## 데이터 모델

### Product (Prisma Schema)

```prisma
model Product {
  id            Int       @id @default(autoincrement())
  code          String    @unique @db.VarChar(50)        // 제품 코드
  name          String    @db.VarChar(200)               // 제품명
  categoryId    Int       @map("category_id")            // 카테고리 ID
  price         Int                                      // 판매 가격
  pv            Int                                      // Point Value
  stock         Int       @default(0)                    // 재고
  imageUrl      String?   @map("image_url") @db.VarChar(500)
  description   String?   @db.Text
  isActive      Boolean   @default(true) @map("is_active")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  category      Category  @relation(fields: [categoryId], references: [id])
  sales         Sale[]

  @@index([categoryId])
  @@map("products")
}
```

### Category (Prisma Schema)

```prisma
model Category {
  id            Int       @id @default(autoincrement())
  name          String    @db.VarChar(100)               // 카테고리명
  level         Int                                      // 1=대분류, 2=소분류
  parentId      Int?      @map("parent_id")              // 상위 카테고리

  parent        Category? @relation("CategoryTree", fields: [parentId], references: [id])
  children      Category[]  @relation("CategoryTree")
  products      Product[]

  @@index([parentId])
  @@map("categories")
}
```

## 비즈니스 로직

### 제품 생성 시 검증

1. **제품 코드 중복 확인**: 동일한 code가 이미 존재하면 BadRequestException
2. **카테고리 존재 확인**: categoryId가 유효하지 않으면 NotFoundException
3. **재고 초기값**: stock 값이 없으면 0으로 설정

### 제품 삭제 로직

```typescript
// 판매 이력 확인
const salesCount = await prisma.sale.count({ where: { productId } });

if (salesCount > 0) {
  // 판매 이력 있음 → 소프트 삭제 (isActive = false)
  await prisma.product.update({ where: { id }, data: { isActive: false } });
} else {
  // 판매 이력 없음 → 하드 삭제
  await prisma.product.delete({ where: { id } });
}
```

### 카테고리 생성 시 검증

1. **레벨 검증**:
   - level=1 (대분류): parentId가 있으면 BadRequestException
   - level=2 (소분류): parentId가 없으면 BadRequestException
2. **상위 카테고리 검증** (소분류인 경우):
   - parentId가 존재하지 않으면 NotFoundException
   - 상위 카테고리가 대분류(level=1)가 아니면 BadRequestException

### 카테고리 삭제 시 검증

1. **하위 카테고리 확인**: children이 있으면 BadRequestException
2. **제품 확인**: 이 카테고리에 제품이 등록되어 있으면 BadRequestException

## 권한 관리

**현재 상태**: 모든 엔드포인트에 `@ApiBearerAuth()` 적용, Guards 준비 완료

**TODO (Task #56)**: JWT 인증 시스템 구현 후:

```typescript
// 관리자 전용 엔드포인트
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(MemberGrade.ADMIN)
@Post()
create(@Body() dto: CreateProductDto) {
  return this.productsService.create(dto);
}
```

## 로깅

- **요청 로그**: 모든 API 호출 로그 기록 (method, url, user, body)
- **변경 로그**: 제품 생성/수정/삭제 시 Logger로 기록
- **TODO**: 향후 AuditLog 모델 추가하여 DB에 감사 로그 저장

## 사용 예시

### 제품 생성

```bash
curl -X POST http://localhost:3000/api/v1/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "code": "PROD-001",
    "name": "비타민 C 1000mg",
    "categoryId": 1,
    "price": 50000,
    "pv": 40000,
    "stock": 100,
    "imageUrl": "https://example.com/product.jpg",
    "description": "고함량 비타민 C 건강기능식품"
  }'
```

### 제품 목록 조회 (검색, 페이징)

```bash
curl "http://localhost:3000/api/v1/products?page=1&limit=20&search=비타민&categoryId=1&isActive=true"
```

### 재고 조정 (입고 +50)

```bash
curl -X PATCH http://localhost:3000/api/v1/products/1/stock \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"adjustment": 50}'
```

### 카테고리 생성 (대분류)

```bash
curl -X POST http://localhost:3000/api/v1/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "건강기능식품",
    "level": 1
  }'
```

### 카테고리 생성 (소분류)

```bash
curl -X POST http://localhost:3000/api/v1/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "비타민",
    "level": 2,
    "parentId": 1
  }'
```

## 테스트

```bash
# 유닛 테스트
pnpm test products.service.spec.ts
pnpm test categories.service.spec.ts

# E2E 테스트
pnpm test:e2e products

# 수동 테스트 (Swagger UI)
http://localhost:3000/api
```

## 주요 파일 위치

- **스키마**: `/prisma/schema.prisma`
- **Seed 데이터**: `/prisma/seed.ts` (5개 제품 포함)
- **환경 변수**: `.env` (DATABASE_URL)
- **Guards**: `/common/guards/jwt-auth.guard.ts`, `/common/guards/roles.guard.ts`
- **Decorators**: `/common/decorators/roles.decorator.ts`, `/common/decorators/current-user.decorator.ts`
- **Interceptors**: `/common/interceptors/logging.interceptor.ts`

---

**Last Updated**: 2025-12-28
**Version**: 2.0.0
**Task**: #46 (Commission PRD v2.0)
