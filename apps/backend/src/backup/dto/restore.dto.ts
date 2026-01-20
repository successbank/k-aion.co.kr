import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches } from 'class-validator';

/**
 * 복구 요청 DTO
 */
export class RestoreDto {
  @ApiProperty({
    description: '복구할 백업 파일명',
    example: 'kaion_db_2026-01-17T02-00-00.sql.gz',
  })
  @IsString()
  @IsNotEmpty({ message: '파일명은 필수입니다' })
  @Matches(/^kaion_db_[\d\-T]+\.sql\.gz$/, {
    message: '유효하지 않은 백업 파일명입니다',
  })
  filename: string;
}

/**
 * 백업 파일명 파라미터 DTO
 */
export class BackupFileParamDto {
  @ApiProperty({
    description: '백업 파일명',
    example: 'kaion_db_2026-01-17T02-00-00.sql.gz',
  })
  @IsString()
  @IsNotEmpty({ message: '파일명은 필수입니다' })
  @Matches(/^kaion_db_[\d\-T]+\.sql\.gz$/, {
    message: '유효하지 않은 백업 파일명입니다',
  })
  filename: string;
}
