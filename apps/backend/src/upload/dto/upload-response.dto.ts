import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty({
    description: '업로드된 파일의 URL',
    example: 'http://211.248.112.67:5659/uploads/products/1704528000000-product.jpg',
  })
  url: string;

  @ApiProperty({
    description: '저장된 파일명',
    example: '1704528000000-product.jpg',
  })
  filename: string;

  @ApiProperty({
    description: '파일 크기 (bytes)',
    example: 102400,
  })
  size: number;

  @ApiProperty({
    description: '파일 MIME 타입',
    example: 'image/jpeg',
  })
  mimeType: string;
}
