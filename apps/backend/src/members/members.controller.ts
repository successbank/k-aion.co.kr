import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { MembersService } from './members.service';
import { PromotionService } from './promotion.service';
import { GenealogyService } from './genealogy.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SearchMemberDto } from './dto/search-member.dto';
import { MemberResponseDto } from './dto/member-response.dto';
import { DeleteMemberDto, DeleteMemberResponseDto } from './dto/delete-member.dto';
import { DeleteImpactResponseDto } from './dto/delete-impact.dto';
import {
  RollbackMemberDto,
  RollbackReason,
  ChangeHistoryResponse,
  RollbackResultResponse,
} from './dto/rollback-member.dto';
import {
  AssignCenterDto,
  AssignCenterResponseDto,
  CenterStatsResponseDto,
} from './dto/assign-center.dto';
import {
  IntegrityReport,
  IntegrityCheckHistoryResponse,
} from './dto/integrity-report.dto';
import { IntegrityCheckService } from './integrity-check.service';
import { MemberGrade } from '@prisma/client';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('members')
@Controller('v1/members')
export class MembersController {
  constructor(
    private readonly membersService: MembersService,
    private readonly promotionService: PromotionService,
    private readonly genealogyService: GenealogyService,
    private readonly integrityCheckService: IntegrityCheckService,
  ) {}

  /**
   * 회원 목록 조회 (GET /api/v1/members)
   */
  @Public()
  @Get()
  @ApiOperation({ summary: '회원 목록 조회' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'grade', required: false, enum: MemberGrade })
  @ApiQuery({ name: 'search', required: false, type: String, description: '이름 또는 아이디 검색' })
  @ApiResponse({ status: 200, description: '성공', type: [MemberResponseDto] })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('grade') grade?: MemberGrade,
    @Query('search') search?: string,
  ) {
    return this.membersService.findAll({ page, limit, grade, search });
  }

  /**
   * 회원 검색 (GET /api/v1/members/search)
   */
  @Public()
  @Get('search')
  @ApiOperation({ summary: '회원 검색 (이름, 아이디, ID)' })
  @ApiQuery({ name: 'q', required: false, type: String, example: '홍길동' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'grade', required: false, enum: MemberGrade })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, example: true })
  @ApiResponse({ status: 200, description: '검색 성공' })
  async search(@Query() searchDto: SearchMemberDto) {
    return this.membersService.search(searchDto);
  }

  /**
   * ADMIN 대시보드 통계 조회 (GET /api/v1/members/admin-stats)
   * ADMIN 전용: 전체 회원 수, 제품 수, 등급별 분포
   */
  @Get('admin-stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(MemberGrade.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'ADMIN 대시보드 통계 조회 (ADMIN 전용)' })
  @ApiResponse({
    status: 200,
    description: '성공',
    schema: {
      example: {
        totalMembers: 243,
        totalProducts: 30,
        gradeDistribution: {
          SALESPERSON: 162,
          TEAM_LEADER: 54,
          BRANCH_MANAGER: 18,
          CENTER: 6,
          ADMIN: 1,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음 (ADMIN만 접근 가능)' })
  async getAdminStats() {
    return this.membersService.getAdminStats();
  }

  /**
   * 전체 회원 롤백 이력 조회 (GET /api/v1/members/rollback-history)
   * ADMIN 전용: 전체 회원의 롤백 이력을 조회
   */
  @Get('rollback-history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(MemberGrade.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '전체 회원 롤백 이력 조회 (ADMIN 전용)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({
    name: 'reason',
    required: false,
    enum: ['INPUT_ERROR', 'SYSTEM_ERROR', 'OTHER'],
    description: '롤백 사유 필터',
  })
  @ApiQuery({ name: 'search', required: false, type: String, description: '회원명 또는 ID 검색' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: '시작일 (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: '종료일 (YYYY-MM-DD)' })
  @ApiResponse({
    status: 200,
    description: '롤백 이력 조회 성공',
    schema: {
      example: {
        data: [
          {
            id: 123,
            memberId: 1,
            memberName: '관리자',
            targetMemberId: 456,
            targetMemberName: '홍길동',
            rollbackReason: 'INPUT_ERROR',
            rollbackReasonLabel: '입력 오류 수정',
            restoredFields: ['phone', 'name'],
            changes: [
              { field: 'phone', before: '010-3333-4444', after: '010-1111-2222' },
            ],
            createdAt: '2026-01-16T12:00:00Z',
          },
        ],
        meta: {
          total: 50,
          page: 1,
          limit: 20,
          totalPages: 3,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음 (ADMIN만 접근 가능)' })
  async getRollbackHistory(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('reason') reason?: RollbackReason,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.membersService.getRollbackHistory({
      page,
      limit,
      reason,
      search,
      startDate,
      endDate,
    });
  }

  // ============================================
  // 회원 데이터 무결성 검사 API
  // ============================================

  /**
   * 무결성 검사 실행 (GET /api/v1/members/integrity-check)
   * ADMIN 전용: 회원 데이터 무결성 검사 및 선택적 자동 수정
   */
  @Get('integrity-check')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(MemberGrade.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '회원 데이터 무결성 검사 실행 (ADMIN 전용)' })
  @ApiQuery({
    name: 'autoFix',
    required: false,
    type: Boolean,
    example: false,
    description: '자동 수정 여부 (true: 위반 사항 자동 수정)',
  })
  @ApiResponse({
    status: 200,
    description: '무결성 검사 완료',
    schema: {
      example: {
        executedAt: '2026-01-17T12:00:00.000Z',
        totalMembers: 243,
        summary: {
          circularReferences: 0,
          orphanNodes: 2,
          invalidTeamLines: 1,
          selfReferences: 0,
          inactiveParentReferences: 3,
          totalViolations: 6,
        },
        violations: {
          circularReferences: [],
          orphanNodes: [
            {
              type: 'ORPHAN_NODE',
              memberId: 123,
              memberName: '홍길동',
              description: '존재하지 않는 후원인 ID 참조: 999',
              fieldName: 'sponsorId',
              invalidReferenceId: 999,
            },
          ],
          invalidTeamLines: [],
          selfReferences: [],
          inactiveParentReferences: [],
        },
        healthy: false,
      },
    },
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음 (ADMIN만 접근 가능)' })
  async runIntegrityCheck(
    @Query('autoFix') autoFix?: string,
    @CurrentUser('id') adminId?: number,
  ): Promise<IntegrityReport> {
    const shouldAutoFix = autoFix === 'true';
    const report = await this.integrityCheckService.runFullIntegrityCheck(shouldAutoFix);

    // 검사 이력 저장
    await this.integrityCheckService.saveCheckHistory(report, adminId);

    return report;
  }

  /**
   * 무결성 검사 이력 조회 (GET /api/v1/members/integrity-check/history)
   * ADMIN 전용: 과거 무결성 검사 이력 조회
   */
  @Get('integrity-check/history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(MemberGrade.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '무결성 검사 이력 조회 (ADMIN 전용)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({
    status: 200,
    description: '이력 조회 성공',
    schema: {
      example: {
        data: [
          {
            id: 1,
            executedAt: '2026-01-17T03:00:00.000Z',
            executedBy: { id: 1, name: '관리자' },
            totalMembers: 243,
            totalViolations: 0,
            wasAutoFixed: true,
            fixedCount: 0,
            healthy: true,
          },
        ],
        meta: {
          total: 30,
          page: 1,
          limit: 20,
          totalPages: 2,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음 (ADMIN만 접근 가능)' })
  async getIntegrityCheckHistory(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ): Promise<IntegrityCheckHistoryResponse> {
    return this.integrityCheckService.getCheckHistory({ page, limit });
  }

  // ============================================
  // 센터별 회원 관리 API
  // ============================================

  /**
   * 센터별 회원 수 통계 조회 (GET /api/v1/members/centers/stats)
   * ADMIN 전용: 각 센터별 소속 회원 수와 미지정 회원 수 반환
   */
  @Get('centers/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(MemberGrade.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '센터별 회원 수 통계 조회 (ADMIN 전용)' })
  @ApiResponse({
    status: 200,
    description: '성공',
    schema: {
      example: {
        centers: [
          { centerName: '강남센터', centerId: 5, memberCount: 25 },
          { centerName: '서초센터', centerId: 6, memberCount: 18 },
        ],
        unassignedCount: 10,
        totalMembers: 200,
      },
    },
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음 (ADMIN만 접근 가능)' })
  async getCenterStats(): Promise<CenterStatsResponseDto> {
    return this.membersService.getCenterStats();
  }

  /**
   * 센터별 회원 목록 조회 (GET /api/v1/members/by-center/:centerName)
   * ADMIN 전용: 특정 센터에 소속된 회원 목록 조회
   */
  @Get('by-center/:centerName')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(MemberGrade.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '센터별 회원 목록 조회 (ADMIN 전용)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'search', required: false, type: String, description: '이름 또는 아이디 검색' })
  @ApiResponse({
    status: 200,
    description: '성공',
    schema: {
      example: {
        data: [
          {
            id: 1,
            username: 'user1',
            name: '홍길동',
            phone: '010-1234-5678',
            grade: 'SALESPERSON',
            cumulativePv: 500000,
            createdAt: '2026-01-01T00:00:00Z',
            centerName: '강남센터',
          },
        ],
        meta: { total: 25, page: 1, limit: 20, totalPages: 2, centerName: '강남센터' },
      },
    },
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음 (ADMIN만 접근 가능)' })
  async getMembersByCenter(
    @Param('centerName') centerName: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.membersService.getMembersByCenter(decodeURIComponent(centerName), {
      page,
      limit,
      search,
    });
  }

  /**
   * 센터 미지정 회원 목록 조회 (GET /api/v1/members/unassigned)
   * ADMIN 전용: centerName이 null 또는 빈 값인 회원 목록 조회
   */
  @Get('unassigned')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(MemberGrade.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '센터 미지정 회원 목록 조회 (ADMIN 전용)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'search', required: false, type: String, description: '이름 또는 아이디 검색' })
  @ApiResponse({
    status: 200,
    description: '성공',
    schema: {
      example: {
        data: [
          {
            id: 10,
            username: 'user10',
            name: '김철수',
            phone: '010-9876-5432',
            grade: 'TEAM_LEADER',
            cumulativePv: 1500000,
            createdAt: '2026-01-05T00:00:00Z',
            centerName: null,
          },
        ],
        meta: { total: 10, page: 1, limit: 20, totalPages: 1 },
      },
    },
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음 (ADMIN만 접근 가능)' })
  async getUnassignedMembers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.membersService.getUnassignedMembers({ page, limit, search });
  }

  /**
   * 일괄 센터 지정 (PATCH /api/v1/members/assign-center)
   * ADMIN 전용: 여러 회원에게 동일한 센터를 일괄 지정
   */
  @Patch('assign-center')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(MemberGrade.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '일괄 센터 지정 (ADMIN 전용)' })
  @ApiBody({ type: AssignCenterDto })
  @ApiResponse({
    status: 200,
    description: '센터 지정 성공',
    type: AssignCenterResponseDto,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청 (센터 없음, 유효하지 않은 회원)' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음 (ADMIN만 접근 가능)' })
  async assignCenterBulk(
    @Body() dto: AssignCenterDto,
    @CurrentUser('id') adminId: number,
  ): Promise<AssignCenterResponseDto> {
    return this.membersService.assignCenterBulk(dto.memberIds, dto.centerName, adminId);
  }

  /**
   * 회원 센터 해제 (PATCH /api/v1/members/:id/unassign-center)
   * ADMIN 전용: 특정 회원의 센터 지정 해제
   */
  @Patch(':id/unassign-center')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(MemberGrade.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '회원 센터 해제 (ADMIN 전용)' })
  @ApiResponse({
    status: 200,
    description: '센터 해제 성공',
    schema: {
      example: {
        success: true,
        message: '홍길동님의 센터 지정이 해제되었습니다',
        memberId: 1,
        memberName: '홍길동',
        previousCenter: '강남센터',
      },
    },
  })
  @ApiResponse({ status: 400, description: '잘못된 요청 (이미 미지정 상태)' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음 (ADMIN만 접근 가능)' })
  @ApiResponse({ status: 404, description: '회원을 찾을 수 없음' })
  async unassignCenter(
    @Param('id', ParseIntPipe) memberId: number,
    @CurrentUser('id') adminId: number,
  ) {
    return this.membersService.unassignCenter(memberId, adminId);
  }

  /**
   * 내 프로필 조회 (GET /api/v1/members/me)
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '내 프로필 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async getMyProfile(@CurrentUser('id') userId: number) {
    return this.membersService.getMyProfile(userId);
  }

  /**
   * 내 프로필 수정 (PATCH /api/v1/members/me)
   */
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '내 프로필 수정' })
  @ApiResponse({ status: 200, description: '수정됨' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async updateMyProfile(@CurrentUser('id') userId: number, @Body() dto: UpdateProfileDto) {
    return this.membersService.updateMyProfile(userId, dto);
  }

  /**
   * 내 실적 조회 (GET /api/v1/members/me/performance)
   */
  @Get('me/performance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '내 실적 조회 (판매, 수당)' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async getMyPerformance(@CurrentUser('id') userId: number) {
    return this.membersService.getMyPerformance(userId);
  }

  /**
   * 내 조직 조회 (GET /api/v1/members/me/organization)
   */
  @Get('me/organization')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '내 조직 조회 (하위 멤버)' })
  @ApiQuery({ name: 'depth', required: false, type: Number, example: 3, description: '조회 깊이' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async getMyOrganization(
    @CurrentUser('id') userId: number,
    @Query('depth', new DefaultValuePipe(100), ParseIntPipe) depth: number,
  ) {
    return this.membersService.getMyOrganization(userId, depth);
  }

  /**
   * 회원 상세 조회 (GET /api/v1/members/:id)
   */
  @Public()
  @Get(':id')
  @ApiOperation({ summary: '회원 상세 조회' })
  @ApiResponse({ status: 200, description: '성공', type: MemberResponseDto })
  @ApiResponse({ status: 404, description: '회원을 찾을 수 없음' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.membersService.findOne(id);
  }

  /**
   * 회원 생성 (POST /api/v1/members)
   * ADMIN 전용: 회원을 생성하고 Activity Log에 기록
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(MemberGrade.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '회원 생성 (ADMIN 전용)' })
  @ApiResponse({ status: 201, description: '생성됨', type: MemberResponseDto })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음 (ADMIN만 접근 가능)' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDto: CreateMemberDto,
    @CurrentUser('id') adminId: number,
  ) {
    return this.membersService.create(createDto, adminId);
  }

  /**
   * 회원 정보 수정 (PATCH /api/v1/members/:id)
   * ADMIN 전용: 회원 정보를 수정 (변경 이력 기록됨)
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(MemberGrade.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '회원 정보 수정 (ADMIN 전용)' })
  @ApiResponse({ status: 200, description: '수정됨', type: MemberResponseDto })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음 (ADMIN만 접근 가능)' })
  @ApiResponse({ status: 404, description: '회원을 찾을 수 없음' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateMemberDto,
    @CurrentUser('id') adminId: number,
  ) {
    return this.membersService.update(id, updateDto, adminId);
  }

  /**
   * 회원 삭제 영향도 조회 (GET /api/v1/members/:id/delete-impact)
   * ADMIN 전용: 회원 삭제 전 영향도 분석
   */
  @Get(':id/delete-impact')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Roles(MemberGrade.ADMIN)
  @ApiOperation({ summary: '회원 삭제 영향도 조회 (ADMIN 전용)' })
  @ApiResponse({ status: 200, description: '성공', type: DeleteImpactResponseDto })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '회원을 찾을 수 없음' })
  async getDeleteImpact(@Param('id', ParseIntPipe) id: number): Promise<DeleteImpactResponseDto> {
    return this.membersService.getDeleteImpact(id);
  }

  /**
   * 회원 삭제 (DELETE /api/v1/members/:id)
   * ADMIN 전용: 회원 소프트 삭제 (하위 회원 처리 전략 포함)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Roles(MemberGrade.ADMIN)
  @ApiOperation({ summary: '회원 삭제 (ADMIN 전용, 소프트 삭제)' })
  @ApiBody({ type: DeleteMemberDto })
  @ApiResponse({ status: 200, description: '삭제됨', type: DeleteMemberResponseDto })
  @ApiResponse({ status: 400, description: '하위 회원이 있어 삭제 불가' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '회원을 찾을 수 없음' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Body() deleteDto: DeleteMemberDto,
    @CurrentUser('id') adminId: number,
  ): Promise<DeleteMemberResponseDto> {
    return this.membersService.remove(id, deleteDto, adminId);
  }

  /**
   * 하위 회원 조회 - 후원계보 (GET /api/v1/members/:id/downline)
   */
  @Public()
  @Get(':id/downline')
  @ApiOperation({ summary: '하위 회원 조회 (후원계보)' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 404, description: '회원을 찾을 수 없음' })
  async getDownline(@Param('id', ParseIntPipe) id: number) {
    return this.membersService.getDownline(id);
  }

  /**
   * 추천 회원 조회 - 추천계보 (GET /api/v1/members/:id/recommendees)
   */
  @Public()
  @Get(':id/recommendees')
  @ApiOperation({ summary: '추천 회원 조회 (추천계보)' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 404, description: '회원을 찾을 수 없음' })
  async getRecommendees(@Param('id', ParseIntPipe) id: number) {
    return this.membersService.getRecommendees(id);
  }

  /**
   * 승급 가능 여부 확인 (GET /api/v1/members/:id/promotion-check)
   */
  @Public()
  @Get(':id/promotion-check')
  @ApiOperation({ summary: '승급 가능 여부 확인' })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiResponse({ status: 404, description: '회원을 찾을 수 없음' })
  async checkPromotionEligibility(@Param('id', ParseIntPipe) id: number) {
    return this.promotionService.checkPromotionEligibility(id);
  }

  /**
   * 승급 처리 (POST /api/v1/members/:id/promote)
   */
  @Post(':id/promote')
  @ApiOperation({ summary: '승급 조건 확인 및 자동 승급 처리' })
  @ApiResponse({ status: 200, description: '승급 처리 완료' })
  @ApiResponse({ status: 400, description: '승급 조건 미달' })
  @ApiResponse({ status: 404, description: '회원을 찾을 수 없음' })
  async promoteIfEligible(@Param('id', ParseIntPipe) id: number) {
    return this.promotionService.promoteIfEligible(id);
  }

  /**
   * 일괄 승급 처리 (POST /api/v1/members/batch-promote)
   * ADMIN 전용: 전체 회원 일괄 승급 처리
   */
  @Post('batch-promote')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(MemberGrade.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '전체 회원 일괄 승급 처리 (ADMIN 전용)' })
  @ApiResponse({ status: 200, description: '일괄 승급 처리 완료' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  async processBatchPromotion() {
    return this.promotionService.processBatchPromotion();
  }

  /**
   * 팀 통계 조회 (GET /api/v1/members/:id/team-stats)
   */
  @Public()
  @Get(':id/team-stats')
  @ApiOperation({ summary: '후원계보 팀별 통계 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  async getTeamStatistics(@Param('id', ParseIntPipe) id: number) {
    return this.genealogyService.getTeamStatistics(id);
  }

  /**
   * 추천계보 통계 조회 (GET /api/v1/members/:id/recommender-stats)
   */
  @Public()
  @Get(':id/recommender-stats')
  @ApiOperation({ summary: '추천계보 통계 조회' })
  @ApiResponse({ status: 200, description: '성공' })
  async getRecommenderStatistics(@Param('id', ParseIntPipe) id: number) {
    return this.genealogyService.getRecommenderStatistics(id);
  }

  /**
   * 제한된 계보도 조회 (GET /api/v1/members/:id/limited-genealogy)
   * 마이페이지 프리뷰용 (1단계 위/아래만)
   */
  @Public()
  @Get(':id/limited-genealogy')
  @ApiOperation({ summary: '제한된 계보도 조회 (1단계 위/아래만)' })
  @ApiQuery({ name: 'type', required: false, enum: ['sponsor', 'recommender'], example: 'sponsor' })
  @ApiResponse({ status: 200, description: '성공' })
  async getLimitedGenealogy(
    @Param('id', ParseIntPipe) id: number,
    @Query('type') type: 'sponsor' | 'recommender' = 'sponsor',
  ) {
    return this.genealogyService.getLimitedGenealogy(id, type);
  }

  /**
   * 계보 트리 조회 (GET /api/v1/members/:id/genealogy-tree)
   */
  @Public()
  @Get(':id/genealogy-tree')
  @ApiOperation({ summary: '계보 트리 조회 (재귀)' })
  @ApiQuery({ name: 'depth', required: false, type: Number, example: 3, description: '조회 깊이' })
  @ApiQuery({ name: 'type', required: false, enum: ['sponsor', 'recommender'], example: 'sponsor' })
  @ApiResponse({ status: 200, description: '성공' })
  async getGenealogyTree(
    @Param('id', ParseIntPipe) id: number,
    @Query('depth') depth: number = 100,
    @Query('type') type: 'sponsor' | 'recommender' = 'sponsor',
  ) {
    return this.genealogyService.getGenealogyTree(id, depth, type);
  }

  /**
   * ADMIN 전용: 전체 조직 계보 조회 (GET /api/v1/members/genealogy/all-trees)
   */
  @Get('genealogy/all-trees')
  @Roles(MemberGrade.ADMIN)
  @ApiOperation({ summary: 'ADMIN 전용: 전체 조직 계보 조회' })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['sponsor', 'recommender'],
    example: 'sponsor',
    description: '트리 타입',
  })
  @ApiQuery({ name: 'depth', required: false, type: Number, example: 10, description: '조회 깊이' })
  @ApiResponse({ status: 200, description: '성공' })
  async getAllOrganizationTrees(
    @Query('type') type: 'sponsor' | 'recommender' = 'sponsor',
    @Query('depth') depth: number = 100,
  ) {
    const trees = await this.genealogyService.getAllOrganizationTrees(type, depth);

    return {
      treeType: type,
      totalRoots: trees.length,
      trees,
    };
  }

  /**
   * 상위 라인 조회 (GET /api/v1/members/:id/upline)
   */
  @Public()
  @Get(':id/upline')
  @ApiOperation({ summary: '상위 라인 조회 (부모 → 조부모 → ...)' })
  @ApiQuery({ name: 'depth', required: false, type: Number, example: 5 })
  @ApiQuery({ name: 'type', required: false, enum: ['sponsor', 'recommender'], example: 'sponsor' })
  @ApiResponse({ status: 200, description: '성공' })
  async getUpline(
    @Param('id', ParseIntPipe) id: number,
    @Query('depth') depth: number = 100,
    @Query('type') type: 'sponsor' | 'recommender' = 'sponsor',
  ) {
    return this.genealogyService.getUpline(id, depth, type);
  }

  /**
   * 팀 라인 추천 (POST /api/v1/members/:id/suggest-team-line)
   */
  @Post(':id/suggest-team-line')
  @ApiOperation({ summary: '후원인의 최적 팀 라인 추천' })
  @ApiResponse({ status: 200, description: '성공' })
  async suggestTeamLine(@Param('id', ParseIntPipe) sponsorId: number) {
    const teamLine = await this.genealogyService.suggestTeamLine(sponsorId);
    return { sponsorId, suggestedTeamLine: teamLine };
  }

  /**
   * 팀 균형 재조정 (POST /api/v1/members/:id/rebalance-teams)
   * ADMIN 전용: 팀 균형 재조정
   */
  @Post(':id/rebalance-teams')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(MemberGrade.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '팀 균형 재조정 (ADMIN 전용)' })
  @ApiResponse({ status: 200, description: '재조정 완료' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  async rebalanceTeams(@Param('id', ParseIntPipe) sponsorId: number) {
    return this.genealogyService.rebalanceTeams(sponsorId);
  }

  /**
   * 회원 등급 수동 변경 (PATCH /api/v1/members/:id/grade)
   * ADMIN 전용: 회원 등급을 수동으로 변경
   */
  @Patch(':id/grade')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(MemberGrade.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '회원 등급 수동 변경 (ADMIN 전용)' })
  @ApiResponse({ status: 200, description: '등급 변경됨' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '회원을 찾을 수 없음' })
  async changeGrade(
    @Param('id', ParseIntPipe) memberId: number,
    @Body('grade') newGrade: MemberGrade,
    @CurrentUser('id') adminId: number,
  ) {
    return this.membersService.changeGrade(memberId, newGrade, adminId);
  }

  /**
   * 회원 비밀번호 초기화 (PATCH /api/v1/members/:id/reset-password)
   * ADMIN 전용: 회원의 비밀번호를 임시 비밀번호로 초기화
   */
  @Patch(':id/reset-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Roles(MemberGrade.ADMIN)
  @ApiOperation({ summary: '회원 비밀번호 초기화 (ADMIN 전용)' })
  @ApiResponse({
    status: 200,
    description: '비밀번호 초기화됨',
    schema: {
      example: {
        message: '비밀번호가 초기화되었습니다',
        tempPassword: 'abc123!@',
        memberId: 1,
        memberName: '홍길동',
      },
    },
  })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '회원을 찾을 수 없음' })
  async resetPassword(
    @Param('id', ParseIntPipe) memberId: number,
    @CurrentUser('id') adminId: number,
  ) {
    return this.membersService.resetPassword(memberId, adminId);
  }

  // ============================================
  // 회원 정보 롤백 API
  // ============================================

  /**
   * 회원 변경 이력 조회 (GET /api/v1/members/:id/change-history)
   * ADMIN 전용: 롤백을 위한 변경 이력 조회 (최대 5건)
   */
  @Get(':id/change-history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(MemberGrade.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '회원 변경 이력 조회 (ADMIN 전용)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 5,
    description: '조회할 이력 수 (기본: 5, 최대: 5)',
  })
  @ApiResponse({
    status: 200,
    description: '변경 이력 조회 성공',
    schema: {
      example: {
        memberId: 123,
        memberName: '홍길동',
        currentValues: {
          name: 'Jane',
          phone: '010-3333-4444',
          grade: 'TEAM_LEADER',
        },
        changeHistory: [
          {
            logId: 456,
            changedAt: '2026-01-16T12:00:00.000Z',
            changedBy: { id: 1, name: '관리자' },
            changedFields: ['name', 'phone'],
            changes: [
              { field: 'name', before: 'John', after: 'Jane' },
              { field: 'phone', before: '010-1111-2222', after: '010-3333-4444' },
            ],
            canRollback: true,
          },
        ],
        maxRollbackDepth: 5,
      },
    },
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음 (ADMIN만 접근 가능)' })
  @ApiResponse({ status: 404, description: '회원을 찾을 수 없음' })
  async getChangeHistory(
    @Param('id', ParseIntPipe) memberId: number,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
  ): Promise<ChangeHistoryResponse> {
    return this.membersService.getChangeHistory(memberId, Math.min(limit, 5));
  }

  /**
   * 회원 정보 롤백 (POST /api/v1/members/:id/rollback)
   * ADMIN 전용: 선택한 변경 이력의 이전 값으로 회원 정보 롤백
   */
  @Post(':id/rollback')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(MemberGrade.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '회원 정보 롤백 (ADMIN 전용)' })
  @ApiBody({ type: RollbackMemberDto })
  @ApiResponse({
    status: 200,
    description: '롤백 성공',
    schema: {
      example: {
        success: true,
        message: '회원 정보가 성공적으로 롤백되었습니다',
        memberId: 123,
        memberName: '홍길동',
        rollbackLogId: 456,
        restoredFields: ['phone', 'name'],
        changes: [
          { field: 'phone', before: '010-3333-4444', after: '010-1111-2222' },
          { field: 'name', before: 'Jane', after: 'John' },
        ],
        rollbackReason: 'INPUT_ERROR',
        rollbackReasonLabel: '입력 오류 수정',
        notificationSent: false,
      },
    },
  })
  @ApiResponse({ status: 400, description: '잘못된 요청 (롤백 불가)' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음 (ADMIN만 접근 가능)' })
  @ApiResponse({ status: 404, description: '회원 또는 변경 이력을 찾을 수 없음' })
  async rollbackMember(
    @Param('id', ParseIntPipe) memberId: number,
    @Body() rollbackDto: RollbackMemberDto,
    @CurrentUser('id') adminId: number,
  ): Promise<RollbackResultResponse> {
    return this.membersService.rollbackMember(memberId, rollbackDto, adminId);
  }
}
