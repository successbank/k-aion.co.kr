import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateRecognizedSalesDto } from './create-recognized-sales.dto';

export class UpdateRecognizedSalesDto extends PartialType(CreateRecognizedSalesDto) {
  @ApiPropertyOptional({ description: '종료일 (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: '인정 사유' })
  @IsOptional()
  @IsString()
  reason?: string;
}
