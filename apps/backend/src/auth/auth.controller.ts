import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CheckUsernameDto } from './dto/check-username.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '로그인',
    description: '이메일과 비밀번호로 로그인하여 JWT 토큰을 발급받습니다.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: '로그인 성공',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패 (이메일 또는 비밀번호 오류, 비활성화된 계정)',
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '회원가입',
    description: '새로운 회원을 등록합니다. 추천인/후원인 정보를 선택적으로 포함할 수 있습니다.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: '회원가입 성공',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (유효성 검증 실패, 존재하지 않는 추천인/후원인)',
  })
  @ApiResponse({
    status: 409,
    description: '아이디 또는 이메일 중복',
  })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('check-username')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '아이디 중복 확인',
    description: '회원가입 시 아이디 사용 가능 여부를 확인합니다.',
  })
  @ApiBody({ type: CheckUsernameDto })
  @ApiResponse({
    status: 200,
    description: '중복 확인 완료',
    schema: {
      example: {
        available: true,
        message: '사용 가능한 아이디입니다',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청 (유효성 검증 실패)',
  })
  async checkUsername(@Body() dto: CheckUsernameDto) {
    const exists = await this.authService.checkUsernameExists(dto.username);
    return {
      available: !exists,
      message: exists ? '이미 사용 중인 아이디입니다' : '사용 가능한 아이디입니다',
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '내 정보 조회',
    description: 'JWT 토큰으로 현재 로그인한 사용자의 상세 정보를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '사용자 정보 조회 성공',
    schema: {
      example: {
        id: 1,
        email: 'admin@kaion.com',
        name: '최고관리자',
        phone: '010-1234-5678',
        grade: 'ADMIN',
        isActive: true,
        createdAt: '2024-12-28T12:00:00.000Z',
        updatedAt: '2024-12-28T12:00:00.000Z',
        address: '서울특별시 강남구',
        addressDetail: '테헤란로 123',
        zipCode: '06234',
        recommender: null,
        sponsor: null,
        team: null,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패 (토큰 없음, 만료, 유효하지 않음)',
  })
  async getProfile(@CurrentUser('id') userId: number) {
    return this.authService.getProfile(userId);
  }

  @Get('test-protected')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: '인증 테스트',
    description: 'JWT 인증이 제대로 작동하는지 테스트하는 엔드포인트입니다.',
  })
  @ApiResponse({
    status: 200,
    description: '인증 성공',
    schema: {
      example: {
        message: '인증된 사용자입니다',
        user: {
          id: 1,
          email: 'admin@kaion.com',
          name: '최고관리자',
          grade: 'ADMIN',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  async testProtected(@CurrentUser() user: any) {
    return {
      message: '인증된 사용자입니다',
      user,
    };
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '비밀번호 변경',
    description: '현재 비밀번호를 확인하고 새 비밀번호로 변경합니다.',
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: '비밀번호 변경 성공',
    schema: {
      example: {
        message: '비밀번호가 성공적으로 변경되었습니다',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '현재 비밀번호 오류 또는 새 비밀번호 불일치',
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패',
  })
  async changePassword(@CurrentUser('id') userId: number, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(userId, dto);
  }
}
