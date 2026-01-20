import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ActivityLogsService } from './activity-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { MemberGrade } from '@prisma/client';

@ApiTags('activity-logs')
@Controller('v1/activity-logs')
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  /**
   * 전체 활동 로그 목록 조회 (관리자용)
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(MemberGrade.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '전체 활동 로그 목록 조회 (관리자용)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'action', required: false, type: String, description: '활동 유형 필터' })
  @ApiQuery({ name: 'memberId', required: false, type: Number, description: '회원 ID 필터' })
  @ApiQuery({ name: 'search', required: false, type: String, description: '회원명 검색' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: '시작일 (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: '종료일 (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: '성공' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('action') action?: string,
    @Query('memberId') memberId?: string,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.activityLogsService.findAll({
      page,
      limit,
      action,
      memberId: memberId ? parseInt(memberId, 10) : undefined,
      search,
      startDate,
      endDate,
    });
  }

  /**
   * 활동 로그 통계 (관리자용)
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(MemberGrade.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '활동 로그 통계 (관리자용)' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: '시작일 (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: '종료일 (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: '성공' })
  async getStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.activityLogsService.getStats({ startDate, endDate });
  }

  /**
   * 회원별 활동 이력 조회
   */
  @Get('member/:memberId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '회원별 활동 이력 조회' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, description: '성공' })
  async findByMember(
    @Param('memberId', ParseIntPipe) memberId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.activityLogsService.findByMember(memberId, page, limit);
  }

  /**
   * 회원별 종합 활동 이력 (연관 데이터 포함)
   */
  @Get('member/:memberId/history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '회원별 종합 활동 이력 (연관 데이터 포함)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, description: '성공' })
  async getMemberActivityHistory(
    @Param('memberId', ParseIntPipe) memberId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.activityLogsService.getMemberActivityHistory(memberId, page, limit);
  }

  /**
   * 회원 활동 통계
   */
  @Get('member/:memberId/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '회원 활동 통계' })
  @ApiResponse({ status: 200, description: '성공' })
  async getMemberStats(@Param('memberId', ParseIntPipe) memberId: number) {
    return this.activityLogsService.getMemberActivityStats(memberId);
  }

  /**
   * 최근 로그인 기록
   */
  @Get('member/:memberId/recent-logins')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '최근 로그인 기록' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 5 })
  @ApiResponse({ status: 200, description: '성공' })
  async getRecentLogins(
    @Param('memberId', ParseIntPipe) memberId: number,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
  ) {
    return this.activityLogsService.getRecentLogins(memberId, limit);
  }
}
