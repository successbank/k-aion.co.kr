import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class UploadService {
  constructor(private configService: ConfigService) {}

  /**
   * 파일명 sanitize (특수문자 제거, 공백은 하이픈으로 변환)
   */
  private sanitizeFilename(filename: string): string {
    const ext = path.extname(filename);
    const name = path.basename(filename, ext);

    // 특수문자 제거, 공백은 하이픈으로
    const sanitized = name
      .replace(/[^a-zA-Z0-9가-힣\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase();

    return `${sanitized}${ext.toLowerCase()}`;
  }

  /**
   * 제품 이미지 업로드 처리
   */
  async uploadProductImage(file: Express.Multer.File): Promise<{
    url: string;
    filename: string;
    size: number;
    mimeType: string;
  }> {
    if (!file) {
      throw new BadRequestException('파일이 제공되지 않았습니다.');
    }

    // 파일 형식 검증
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(
        '허용되지 않는 파일 형식입니다. (jpg, jpeg, png, gif, webp만 허용)',
      );
    }

    // 파일 크기 검증 (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('파일 크기는 5MB를 초과할 수 없습니다.');
    }

    // 타임스탬프 + sanitized 원본파일명
    const timestamp = Date.now();
    const sanitizedName = this.sanitizeFilename(file.originalname);
    const filename = `${timestamp}-${sanitizedName}`;

    // 파일 저장 경로
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
    const filepath = path.join(uploadDir, filename);

    // 디렉토리 확인 및 생성
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 파일 저장
    fs.writeFileSync(filepath, file.buffer);

    // URL 생성
    const baseUrl = this.configService.get<string>('BASE_URL') || 'http://localhost:3001';
    const url = `${baseUrl}/uploads/products/${filename}`;

    return {
      url,
      filename,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  /**
   * 제품 이미지 삭제
   */
  async deleteProductImage(filename: string): Promise<void> {
    const filepath = path.join(process.cwd(), 'public', 'uploads', 'products', filename);

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }
}
