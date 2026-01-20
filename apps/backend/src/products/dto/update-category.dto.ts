import { PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';

/**
 * 카테고리 수정 DTO
 */
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
