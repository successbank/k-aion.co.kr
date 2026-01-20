import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 개별 설정 항목 DTO
 */
export class ConfigItemDto {
  @ApiProperty({ description: '설정 키', example: 'sales.recognizedGrade.visible' })
  @IsString()
  key: string;

  @ApiProperty({ description: '설정 값', example: 'true' })
  @IsString()
  value: string;

  @ApiPropertyOptional({ description: '설정 설명', example: '인정매출 탭 표시 여부' })
  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * 시스템 설정 일괄 업데이트 DTO
 */
export class UpdateSystemConfigDto {
  @ApiProperty({
    description: '업데이트할 설정 목록',
    type: [ConfigItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfigItemDto)
  configs: ConfigItemDto[];
}
