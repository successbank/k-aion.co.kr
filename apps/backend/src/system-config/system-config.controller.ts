import {
  Controller,
  Get,
  Patch,
  Body,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SystemConfigService } from './system-config.service';
import { UpdateSystemConfigDto } from './dto/update-system-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MemberGrade } from '@prisma/client';

/**
 * 시스템 설정 컨트롤러
 * ADMIN 등급만 접근 가능
 */
@ApiTags('system-config')
@Controller('v1/system-config')
@ApiBearerAuth()
export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  /**
   * 시스템 설정 목록 조회
   * prefix로 필터링 가능 (예: 'sales')
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '시스템 설정 조회 (ADMIN 전용)' })
  @ApiQuery({
    name: 'prefix',
    required: false,
    type: String,
    description: '설정 키 prefix 필터 (예: sales)',
  })
  @ApiResponse({ status: 200, description: '설정 목록 조회 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 403, description: '권한 없음 (ADMIN만 가능)' })
  async findAll(
    @Request() req: any,
    @Query('prefix') prefix?: string,
  ) {
    // ADMIN 등급 확인
    const user = req.user;
    if (!user || user.grade !== MemberGrade.ADMIN) {
      throw new ForbiddenException('ADMIN 등급만 시스템 설정을 조회할 수 있습니다.');
    }

    return this.systemConfigService.findAll(prefix);
  }

  /**
   * 시스템 설정 일괄 업데이트
   */
  @Patch()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '시스템 설정 일괄 업데이트 (ADMIN 전용)' })
  @ApiResponse({ status: 200, description: '설정 업데이트 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 403, description: '권한 없음 (ADMIN만 가능)' })
  async bulkUpdate(
    @Request() req: any,
    @Body() dto: UpdateSystemConfigDto,
  ) {
    // ADMIN 등급 확인
    const user = req.user;
    if (!user || user.grade !== MemberGrade.ADMIN) {
      throw new ForbiddenException('ADMIN 등급만 시스템 설정을 변경할 수 있습니다.');
    }

    return this.systemConfigService.bulkUpsert(dto.configs);
  }
}
