import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigItemDto } from './dto/update-system-config.dto';

/**
 * 시스템 설정 서비스
 * 시스템 전반의 설정 값을 관리합니다.
 */
@Injectable()
export class SystemConfigService {
  private readonly logger = new Logger(SystemConfigService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 모든 설정 조회 또는 prefix로 필터링
   * @param prefix 설정 키 prefix (예: 'sales')
   */
  async findAll(prefix?: string) {
    const where = prefix ? { key: { startsWith: prefix } } : {};

    const configs = await this.prisma.systemConfig.findMany({
      where,
      orderBy: { key: 'asc' },
    });

    this.logger.log(`시스템 설정 조회: ${configs.length}건 (prefix: ${prefix || 'all'})`);
    return configs;
  }

  /**
   * 특정 키의 설정 조회
   * @param key 설정 키
   */
  async findByKey(key: string) {
    return this.prisma.systemConfig.findUnique({
      where: { key },
    });
  }

  /**
   * 여러 설정 일괄 upsert (트랜잭션)
   * @param configs 설정 목록
   */
  async bulkUpsert(configs: ConfigItemDto[]) {
    const results = await this.prisma.$transaction(
      configs.map((config) =>
        this.prisma.systemConfig.upsert({
          where: { key: config.key },
          update: {
            value: config.value,
            description: config.description,
          },
          create: {
            key: config.key,
            value: config.value,
            description: config.description,
          },
        }),
      ),
    );

    this.logger.log(`시스템 설정 저장: ${results.length}건`);
    return results;
  }

  /**
   * 특정 키의 설정 삭제
   * @param key 설정 키
   */
  async delete(key: string) {
    return this.prisma.systemConfig.delete({
      where: { key },
    });
  }
}
