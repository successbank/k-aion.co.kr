import { IsArray, IsNotEmpty, IsNumber, IsString, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 일괄 센터 지정 요청 DTO
 * 여러 회원에게 동일한 센터를 일괄 지정
 */
export class AssignCenterDto {
  @ApiProperty({
    description: '센터를 지정할 회원 ID 목록',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(1, { message: '최소 1명의 회원을 선택해주세요' })
  @IsNumber({}, { each: true, message: '회원 ID는 숫자여야 합니다' })
  memberIds: number[];

  @ApiProperty({
    description: '지정할 센터명 (CENTER 등급 회원의 name 필드)',
    example: '강남센터',
  })
  @IsString()
  @IsNotEmpty({ message: '센터명을 입력해주세요' })
  centerName: string;
}

/**
 * 일괄 센터 지정 결과 응답 DTO
 */
export class AssignCenterResponseDto {
  @ApiProperty({ description: '성공 여부', example: true })
  success: boolean;

  @ApiProperty({ description: '결과 메시지', example: '3명의 회원이 강남센터로 지정되었습니다' })
  message: string;

  @ApiProperty({ description: '지정된 센터명', example: '강남센터' })
  centerName: string;

  @ApiProperty({ description: '지정된 회원 수', example: 3 })
  assignedCount: number;

  @ApiProperty({
    description: '지정된 회원 ID 목록',
    example: [1, 2, 3],
    type: [Number],
  })
  memberIds: number[];
}

/**
 * 센터별 회원 수 통계 DTO
 */
export class CenterStatsDto {
  @ApiProperty({ description: '센터명', example: '강남센터' })
  centerName: string;

  @ApiProperty({ description: '소속 회원 수', example: 25 })
  memberCount: number;

  @ApiProperty({ description: '센터 ID (CENTER 등급 회원)', example: 5, required: false })
  centerId?: number;
}

/**
 * 센터 통계 응답 DTO
 */
export class CenterStatsResponseDto {
  @ApiProperty({
    description: '센터별 회원 수 목록',
    type: [CenterStatsDto],
  })
  centers: CenterStatsDto[];

  @ApiProperty({ description: '센터 미지정 회원 수', example: 10 })
  unassignedCount: number;

  @ApiProperty({ description: '전체 회원 수 (ADMIN, CENTER 제외)', example: 200 })
  totalMembers: number;
}

/**
 * 센터별 회원 조회 쿼리 파라미터 DTO
 */
export class GetMembersByCenterDto {
  @ApiProperty({ description: '페이지 번호', example: 1, required: false })
  page?: number;

  @ApiProperty({ description: '페이지당 항목 수', example: 20, required: false })
  limit?: number;

  @ApiProperty({ description: '검색어 (이름, 아이디)', required: false })
  search?: string;
}

/**
 * 센터 미지정 회원 조회 쿼리 파라미터 DTO
 */
export class GetUnassignedMembersDto {
  @ApiProperty({ description: '페이지 번호', example: 1, required: false })
  page?: number;

  @ApiProperty({ description: '페이지당 항목 수', example: 20, required: false })
  limit?: number;

  @ApiProperty({ description: '검색어 (이름, 아이디)', required: false })
  search?: string;
}
