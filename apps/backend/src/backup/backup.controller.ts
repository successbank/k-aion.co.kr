import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { Response } from 'express';
import { BackupService } from './backup.service';
import { RestoreDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MemberGrade } from '@prisma/client';

@ApiTags('backup')
@Controller('v1/admin/backup')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(MemberGrade.ADMIN)
@ApiBearerAuth('access-token')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  /**
   * 백업 목록 조회
   */
  @Get()
  @ApiOperation({ summary: '백업 목록 조회 (ADMIN 전용)' })
  @ApiResponse({ status: 200, description: '성공' })
  async getBackupList() {
    const data = await this.backupService.getBackupList();
    return {
      success: true,
      message: '백업 목록을 조회했습니다',
      data,
    };
  }

  /**
   * 백업 상태 대시보드 조회
   */
  @Get('status')
  @ApiOperation({ summary: '백업 상태 대시보드 조회 (ADMIN 전용)' })
  @ApiResponse({ status: 200, description: '성공' })
  async getStatus() {
    const data = await this.backupService.getStatus();
    return {
      success: true,
      message: '백업 상태를 조회했습니다',
      data,
    };
  }

  /**
   * 작업 로그 조회
   */
  @Get('logs')
  @ApiOperation({ summary: '백업 작업 로그 조회 (ADMIN 전용)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: 200, description: '성공' })
  async getLogs(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const result = await this.backupService.getLogs(page, limit);
    return {
      success: true,
      message: '작업 로그를 조회했습니다',
      ...result,
    };
  }

  /**
   * 수동 백업 생성
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '수동 백업 생성 (ADMIN 전용)' })
  @ApiResponse({ status: 201, description: '백업 생성 성공' })
  async createBackup(@CurrentUser() user: { id: number }) {
    const result = await this.backupService.createBackup(user.id);
    return {
      success: true,
      message: '백업이 성공적으로 생성되었습니다',
      filename: result.filename,
      sizeDisplay: result.sizeDisplay,
    };
  }

  /**
   * 백업 복구
   */
  @Post('restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '백업 복구 (ADMIN 전용)' })
  @ApiResponse({ status: 200, description: '복구 성공' })
  async restore(
    @Body() restoreDto: RestoreDto,
    @CurrentUser() user: { id: number },
  ) {
    const result = await this.backupService.restore(restoreDto.filename, user.id);
    return {
      success: true,
      message: '데이터베이스가 성공적으로 복구되었습니다',
      safetyBackupFilename: result.safetyBackupFilename,
    };
  }

  /**
   * 백업 파일 다운로드
   */
  @Get('download/:filename')
  @ApiOperation({ summary: '백업 파일 다운로드 (ADMIN 전용)' })
  @ApiParam({ name: 'filename', description: '백업 파일명' })
  @ApiResponse({ status: 200, description: '파일 다운로드' })
  async download(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const filePath = this.backupService.getBackupFilePath(filename);
    res.download(filePath, filename);
  }

  /**
   * 백업 파일 삭제
   */
  @Delete(':filename')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '백업 파일 삭제 (ADMIN 전용)' })
  @ApiParam({ name: 'filename', description: '백업 파일명' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  async deleteBackup(
    @Param('filename') filename: string,
    @CurrentUser() user: { id: number },
  ) {
    await this.backupService.deleteBackup(filename, user.id);
    return {
      success: true,
      message: '백업 파일이 삭제되었습니다',
    };
  }
}
