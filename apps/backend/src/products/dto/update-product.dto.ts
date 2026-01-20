import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateProductDto } from './create-product.dto';
import { IsBoolean, IsOptional } from 'class-validator';

/**
 * 제품 수정 DTO
 * CreateProductDto의 모든 필드를 선택적으로 만듦
 */
export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiPropertyOptional({
    description: '제품 활성화 상태',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
