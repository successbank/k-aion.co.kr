import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { TempMembersService } from './temp-members.service';
import { CreateTempMemberDto } from './dto/create-temp-member.dto';
import { VerifyPhoneDto } from './dto/verify-phone.dto';
import { TempMemberResponseDto } from './dto/temp-member-response.dto';

@ApiTags('임시회원')
@Controller('v1/temp-members')
@Public()
export class TempMembersController {
  constructor(private readonly tempMembersService: TempMembersService) {}

  @Post()
  @ApiOperation({ summary: '임시 회원 등록' })
  @ApiResponse({ status: 201, description: '회원가입 성공', type: TempMemberResponseDto })
  @ApiResponse({ status: 409, description: '아이디 중복' })
  async create(@Body() createTempMemberDto: CreateTempMemberDto) {
    return this.tempMembersService.create(createTempMemberDto);
  }

  @Get('check-username/:username')
  @ApiOperation({ summary: '아이디 중복 체크' })
  @ApiResponse({ status: 200, description: '중복 체크 완료' })
  async checkUsername(@Param('username') username: string) {
    return this.tempMembersService.checkUsername(username);
  }

  @Post('verify-phone')
  @ApiOperation({ summary: '추천인/후원인 전화번호 검증' })
  @ApiResponse({ status: 200, description: '검증 완료' })
  async verifyPhone(@Body() verifyPhoneDto: VerifyPhoneDto) {
    return this.tempMembersService.verifyPhone(verifyPhoneDto);
  }

  @Get()
  @ApiOperation({ summary: '임시 회원 목록 조회 (관리자용)' })
  @ApiResponse({ status: 200, description: '목록 조회 성공', type: [TempMemberResponseDto] })
  async findAll(@Query('isMigrated') isMigrated?: string) {
    const filter = isMigrated !== undefined ? isMigrated === 'true' : undefined;
    return this.tempMembersService.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: '임시 회원 상세 조회 (관리자용)' })
  @ApiResponse({ status: 200, description: '상세 조회 성공', type: TempMemberResponseDto })
  @ApiResponse({ status: 404, description: '회원을 찾을 수 없음' })
  async findOne(@Param('id') id: string) {
    return this.tempMembersService.findOne(+id);
  }
}
