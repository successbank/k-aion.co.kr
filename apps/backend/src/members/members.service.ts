import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GenealogyService } from './genealogy.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto, DownlineStrategy } from './dto/update-member.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SearchMemberDto } from './dto/search-member.dto';
import {
  DeleteMemberDto,
  DeleteMemberResponseDto,
  DownlineHandlingStrategy,
} from './dto/delete-member.dto';
import { DeleteImpactResponseDto } from './dto/delete-impact.dto';
import {
  RollbackMemberDto,
  RollbackReason,
  RollbackReasonLabels,
  ChangeHistoryResponse,
  ChangeHistoryItem,
  RollbackResultResponse,
  DebugInfo,
  ROLLBACKABLE_FIELDS,
  NON_ROLLBACKABLE_FIELDS,
} from './dto/rollback-member.dto';
import { MemberGrade } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class MembersService {
  private readonly logger = new Logger(MembersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly genealogyService: GenealogyService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * 회원 목록 조회 (페이지네이션)
   */
  async findAll(params: { page?: number; limit?: number; grade?: MemberGrade; search?: string }) {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };
    if (params.grade) {
      where.grade = params.grade;
    }

    // 검색 조건 추가
    if (params.search && params.search.trim()) {
      const searchTerm = params.search.trim();
      const isNumeric = /^\d+$/.test(searchTerm);

      if (isNumeric) {
        // 숫자면 ID로 검색
        where.id = parseInt(searchTerm, 10);
      } else {
        // 문자면 이름 OR 아이디로 검색
        where.OR = [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { username: { contains: searchTerm, mode: 'insensitive' } },
        ];
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.member.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          phone: true,
          birthDate: true,
          grade: true,
          recommenderId: true,
          sponsorId: true,
          teamLine: true,
          cumulativePv: true,
          agentPromotedAt: true,
          isActive: true,
          emailVerified: true,
          centerName: true,
          createdAt: true,
          updatedAt: true,
          // 비밀번호 제외
        },
      }),
      this.prisma.member.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 회원 검색 (이름, 아이디, ID)
   */
  async search(searchDto: SearchMemberDto) {
    const { q, limit = 20, grade, isActive = true } = searchDto;

    const where: any = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (grade) {
      where.grade = grade;
    }

    if (q && q.trim()) {
      const searchTerm = q.trim();
      const isNumeric = /^\d+$/.test(searchTerm);

      if (isNumeric) {
        // 숫자면 ID로 검색
        where.id = parseInt(searchTerm, 10);
      } else {
        // 문자면 이름 OR 아이디로 검색
        where.OR = [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { username: { contains: searchTerm, mode: 'insensitive' } },
        ];
      }
    }

    const members = await this.prisma.member.findMany({
      where,
      take: limit,
      orderBy: [{ grade: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        grade: true,
        isActive: true,
        cumulativePv: true,
        _count: {
          select: { sponsorees: true },
        },
      },
    });

    // sponsoreeCount를 flat하게 변환
    const mappedMembers = members.map((m) => ({
      id: m.id,
      username: m.username,
      name: m.name,
      email: m.email,
      grade: m.grade,
      isActive: m.isActive,
      cumulativePv: m.cumulativePv,
      sponsoreeCount: m._count.sponsorees,
    }));

    return { data: mappedMembers, total: mappedMembers.length };
  }

  /**
   * 회원 상세 조회
   */
  async findOne(id: number) {
    const member = await this.prisma.member.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        birthDate: true,
        grade: true,
        recommenderId: true,
        sponsorId: true,
        teamLine: true,
        cumulativePv: true,
        agentPromotedAt: true,
        bankName: true,
        accountNumber: true,
        accountHolder: true,
        postalCode: true,
        address: true,
        addressDetail: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        recommender: {
          select: { id: true, name: true, email: true, grade: true },
        },
        sponsor: {
          select: { id: true, name: true, email: true, grade: true },
        },
        // 직속 하위 목록 (후원계보)
        sponsorees: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            email: true,
            grade: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!member) {
      throw new NotFoundException(`회원 ID ${id}를 찾을 수 없습니다`);
    }

    return member;
  }

  /**
   * 회원 생성 (ADMIN 전용)
   * ✅ 전체 트랜잭션 + 동시성 안전 + Activity Log 기록
   *
   * Race Condition 방지:
   * - username 중복 체크가 트랜잭션 내부에서 수행
   * - email 중복 체크가 트랜잭션 내부에서 수행
   * - Sponsor/Recommender 검증이 트랜잭션 내부에서 수행
   */
  async create(dto: CreateMemberDto, adminId?: number) {
    // 비밀번호 해싱 (트랜잭션 외부에서 수행 - CPU 집약적 작업)
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.$transaction(async (tx) => {
      // 1. 트랜잭션 내에서 username 중복 체크 (Race Condition 방지)
      const existingUsername = await tx.member.findUnique({
        where: { username: dto.username },
        select: { id: true },
      });

      if (existingUsername) {
        throw new BadRequestException('이미 사용 중인 아이디입니다');
      }

      // 2. 트랜잭션 내에서 email 중복 체크 (선택적 - email이 제공된 경우)
      if (dto.email) {
        const existingEmail = await tx.member.findFirst({
          where: { email: dto.email },
          select: { id: true },
        });

        if (existingEmail) {
          throw new BadRequestException('이미 사용 중인 이메일입니다');
        }
      }

      // ✅ CENTER 등급은 후원/추천 관계 없음 (계보도에 영향 미치지 않음)
      const isCenter = dto.grade === MemberGrade.CENTER;
      let recommenderId: number | null = null;
      let sponsorId: number | null = null;
      let teamLine: number | null = null;

      if (isCenter) {
        // 센터는 후원인/추천인 없이 독립적으로 존재
        this.logger.log(`센터 생성: 후원/추천 관계 없이 생성됩니다.`);
      } else {
        // 일반 회원: 후원계보만 사용 (추천계보 제거됨)
        recommenderId = null; // 추천계보 미사용 - 항상 null
        sponsorId = dto.sponsorId ?? null;
        teamLine = dto.teamLine ?? null;

        // 추천인 검증 제거 (후원계보로 전환됨)
        // if (recommenderId) {
        //   await this.validateMemberExistsInTx(tx, recommenderId);
        // }

        // 4. 트랜잭션 내에서 후원인 검증 + TeamLine 자동 배분
        if (sponsorId) {
          await this.validateMemberExistsInTx(tx, sponsorId);

          // 후원계보는 3팀만 가능 (1:3 규칙)
          if (teamLine) {
            await this.validateTeamLineAvailable(teamLine);
          } else {
            // team_line 미지정 시 자동 배분 (가장 인원이 적은 팀)
            const suggestedLine = await this.genealogyService.suggestTeamLine(sponsorId);
            // 자동 배분 결과 검증 (1-3 범위)
            if (suggestedLine < 1 || suggestedLine > 3) {
              throw new BadRequestException(
                `유효하지 않은 팀라인입니다: ${suggestedLine}. 팀라인은 1, 2, 3 중 하나여야 합니다.`,
              );
            }
            teamLine = suggestedLine;
          }
        }
      }

      // 5. 회원 생성
      const member = await tx.member.create({
        data: {
          username: dto.username,
          email: dto.email || null,
          password: hashedPassword,
          name: dto.name,
          phone: dto.phone,
          birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
          grade: dto.grade || MemberGrade.SALESPERSON,
          recommenderId, // CENTER는 null, 일반 회원은 dto에서 가져옴
          sponsorId, // CENTER는 null, 일반 회원은 dto에서 가져옴
          teamLine, // CENTER는 null, 일반 회원은 자동 배분
          bankName: dto.bankName,
          accountNumber: dto.accountNumber,
          accountHolder: dto.accountHolder,
          postalCode: dto.postalCode,
          address: dto.address,
          addressDetail: dto.addressDetail,
          centerName: dto.centerName,
        },
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          phone: true,
          birthDate: true,
          grade: true,
          recommenderId: true,
          sponsorId: true,
          teamLine: true,
          cumulativePv: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // 6. Activity Log 기록 (adminId가 있는 경우)
      if (adminId) {
        await tx.activityLog.create({
          data: {
            memberId: adminId,
            action: 'MEMBER_CREATED',
            targetType: 'MEMBER',
            targetId: member.id,
            details: {
              createdMemberId: member.id,
              createdMemberName: member.name,
              username: member.username,
              grade: member.grade,
              sponsorId: member.sponsorId,
              recommenderId: member.recommenderId,
              teamLine: member.teamLine,
              createdAt: new Date().toISOString(),
              createdBy: adminId,
            },
          },
        });

        this.logger.log(
          `회원 생성 완료: ${member.username} (ID: ${member.id}) | 생성자: ${adminId}`,
        );
      } else {
        this.logger.log(`회원 생성 완료: ${member.username} (ID: ${member.id})`);
      }

      return member;
    });
  }

  /**
   * 회원 정보 수정 (ADMIN 전용)
   * ✅ 트랜잭션 + 변경 이력 로깅 (Audit Trail)
   */
  async update(id: number, dto: UpdateMemberDto, adminId?: number) {
    return this.prisma.$transaction(async (tx) => {
      // 트랜잭션 내에서 기존 데이터 조회 (변경 전 값 저장)
      const existing = await tx.member.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          phone: true,
          birthDate: true,
          grade: true,
          recommenderId: true,
          sponsorId: true,
          teamLine: true,
          bankName: true,
          accountNumber: true,
          accountHolder: true,
          postalCode: true,
          address: true,
          addressDetail: true,
          isActive: true,
        },
      });

      if (!existing) {
        throw new NotFoundException(`회원 ID ${id}를 찾을 수 없습니다`);
      }

      // 추천인 변경 비활성화 (후원계보로 전환됨)
      // if (dto.recommenderId !== undefined) {
      //   await this.validateMemberExistsInTx(tx, dto.recommenderId);
      //   await this.validateNoCircularReference(id, dto.recommenderId, 'recommender');
      // }

      // 후원인 검증
      if (dto.sponsorId !== undefined) {
        await this.validateMemberExistsInTx(tx, dto.sponsorId);
        // 순환 참조 검증: 새 후원인이 현재 회원의 하위 조직이면 안됨
        await this.validateNoCircularReference(id, dto.sponsorId, 'sponsor');
      }

      // 후원인(sponsorId) 변경 시 하위 조직 처리
      let downlineHandling: {
        strategy: DownlineStrategy;
        affectedCount: number;
        oldSponsorId: number | null;
        newSponsorId: number;
      } | null = null;

      if (dto.sponsorId !== undefined && dto.sponsorId !== existing.sponsorId) {
        const strategy = dto.downlineStrategy || DownlineStrategy.MOVE_WITH;
        let affectedCount = 0;

        switch (strategy) {
          case DownlineStrategy.MOVE_WITH:
            // 기본 동작: 하위 조직은 자동으로 따라감 (트리 구조상 자연스럽게 이동됨)
            // 별도 처리 불필요 - 영향받는 회원 수만 조회
            const moveWithCount = await tx.member.count({
              where: { sponsorId: id, isActive: true },
            });
            affectedCount = moveWithCount;
            this.logger.log(
              `회원 ID ${id}: 하위 조직 ${affectedCount}명과 함께 이동 (기본) - 후원인 ${existing.sponsorId} → ${dto.sponsorId}`,
            );
            break;

          case DownlineStrategy.REASSIGN:
            // 직속 하위 회원들을 기존 상위자에게 재배치
            const reassignResult = await tx.member.updateMany({
              where: { sponsorId: id, isActive: true },
              data: { sponsorId: existing.sponsorId },
            });
            affectedCount = reassignResult.count;
            this.logger.log(
              `회원 ID ${id}: ${affectedCount}명 하위 회원을 기존 상위자(${existing.sponsorId})에게 재배치`,
            );
            break;

          case DownlineStrategy.DETACH:
            // 직속 하위 회원들의 sponsorId를 null로 설정 (최상위로 분리)
            const detachResult = await tx.member.updateMany({
              where: { sponsorId: id, isActive: true },
              data: { sponsorId: null, teamLine: null },
            });
            affectedCount = detachResult.count;
            this.logger.log(
              `회원 ID ${id}: ${affectedCount}명 하위 회원을 최상위로 분리`,
            );
            break;
        }

        downlineHandling = {
          strategy,
          affectedCount,
          oldSponsorId: existing.sponsorId,
          newSponsorId: dto.sponsorId,
        };
      }

      // 팀라인 유효성 검증 (1:3 규칙)
      if (dto.teamLine !== undefined) {
        await this.validateTeamLineAvailable(dto.teamLine);
      }

      const updated = await tx.member.update({
        where: { id },
        data: {
          name: dto.name,
          phone: dto.phone,
          birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
          grade: dto.grade, // ADMIN 권한 체크는 Controller에서 수행
          // recommenderId 변경 비활성화 (후원계보로 전환됨)
          // recommenderId: dto.recommenderId,
          sponsorId: dto.sponsorId,
          teamLine: dto.teamLine,
          bankName: dto.bankName,
          accountNumber: dto.accountNumber,
          accountHolder: dto.accountHolder,
          postalCode: dto.postalCode,
          address: dto.address,
          addressDetail: dto.addressDetail,
          isActive: dto.isActive,
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          birthDate: true,
          grade: true,
          recommenderId: true,
          sponsorId: true,
          teamLine: true,
          cumulativePv: true,
          isActive: true,
          updatedAt: true,
        },
      });

      // ✅ 변경된 필드 감지 및 로깅
      const changedFields = this.detectChangedFields(existing, dto);

      if (changedFields.length > 0 && adminId) {
        const changesDetail = changedFields.map((field) => ({
          field,
          before: existing[field as keyof typeof existing],
          after: dto[field as keyof typeof dto],
        }));

        this.logger.log(
          `회원 정보 변경: ID ${id} | 변경자: ${adminId} | 변경항목: ${changedFields.join(', ')}`,
        );

        // Activity Log에 상세 변경 이력 기록
        await tx.activityLog.create({
          data: {
            memberId: adminId,
            action: 'MEMBER_UPDATED',
            targetType: 'MEMBER',
            targetId: id,
            details: {
              targetMemberId: id,
              targetMemberName: existing.name,
              changedFields,
              changes: changesDetail,
              changedAt: new Date().toISOString(),
              changedBy: adminId,
              // 하위 조직 처리 정보 (후원인 변경 시에만 포함)
              ...(downlineHandling && {
                downlineHandling: {
                  strategy: downlineHandling.strategy,
                  affectedCount: downlineHandling.affectedCount,
                  oldSponsorId: downlineHandling.oldSponsorId,
                  newSponsorId: downlineHandling.newSponsorId,
                },
              }),
            },
          },
        });
      }

      return updated;
    });
  }

  /**
   * 변경된 필드 감지 (Private)
   */
  private detectChangedFields(existing: any, dto: any): string[] {
    const trackableFields = [
      'name',
      'phone',
      'birthDate',
      'grade',
      'recommenderId',
      'sponsorId',
      'teamLine',
      'bankName',
      'accountNumber',
      'accountHolder',
      'postalCode',
      'address',
      'addressDetail',
      'isActive',
    ];

    const changedFields: string[] = [];

    for (const field of trackableFields) {
      if (dto[field] !== undefined) {
        let existingValue = existing[field];
        let newValue = dto[field];

        // Date 비교 처리
        if (field === 'birthDate') {
          existingValue = existingValue ? new Date(existingValue).toISOString().split('T')[0] : null;
          newValue = newValue ? newValue : null;
        }

        if (existingValue !== newValue) {
          changedFields.push(field);
        }
      }
    }

    return changedFields;
  }

  /**
   * 회원 삭제 영향도 조회
   */
  async getDeleteImpact(id: number): Promise<DeleteImpactResponseDto> {
    const member = await this.findOne(id);

    // 직속 후원 하위 회원
    const directSponsorees = await this.prisma.member.findMany({
      where: { sponsorId: id, isActive: true },
      select: { id: true, name: true, grade: true, teamLine: true },
      take: 10,
    });

    // 직속 추천 하위 회원
    const directRecommendees = await this.prisma.member.findMany({
      where: { recommenderId: id, isActive: true },
      select: { id: true, name: true, grade: true },
      take: 10,
    });

    // 전체 하위 회원 수 (재귀)
    const totalSponsorDescendants = await this.getAllDescendantIds(id, 'sponsor');
    const totalRecommenderDescendants = await this.getAllDescendantIds(id, 'recommender');

    // 직속 하위 회원 수
    const [directSponsoreeCount, directRecommendeeCount] = await Promise.all([
      this.prisma.member.count({ where: { sponsorId: id, isActive: true } }),
      this.prisma.member.count({ where: { recommenderId: id, isActive: true } }),
    ]);

    // 관련 데이터 수
    const [salesCount, bonusCount, seminarCount] = await Promise.all([
      this.prisma.sale.count({ where: { sellerId: id } }),
      this.prisma.bonus.count({ where: { memberId: id } }),
      this.prisma.seminar.count({ where: { hostId: id } }),
    ]);

    // 상위 후원인 정보 조회
    let sponsorName: string | undefined;
    if (member.sponsorId) {
      const sponsor = await this.prisma.member.findUnique({
        where: { id: member.sponsorId },
        select: { name: true },
      });
      sponsorName = sponsor?.name;
    }

    // 삭제 가능 여부 판단 (ADMIN은 삭제 불가)
    const isAdmin = member.grade === MemberGrade.ADMIN;

    let canDelete = true;
    let blockReason: string | undefined;

    if (isAdmin) {
      canDelete = false;
      blockReason = 'ADMIN 등급 회원은 삭제할 수 없습니다';
    }

    return {
      memberId: id,
      memberName: member.name,
      memberGrade: member.grade,
      canDelete,
      blockReason,
      directSponsoreeCount,
      directRecommendeeCount,
      totalSponsorDescendantCount: totalSponsorDescendants.length,
      totalRecommenderDescendantCount: totalRecommenderDescendants.length,
      salesCount,
      bonusCount,
      seminarCount,
      sponsorId: member.sponsorId ?? undefined,
      sponsorName,
      directSponsorees: directSponsorees.map((s) => ({
        id: s.id,
        name: s.name,
        grade: s.grade,
        teamLine: s.teamLine ?? undefined,
      })),
      directRecommendees: directRecommendees.map((r) => ({
        id: r.id,
        name: r.name,
        grade: r.grade,
      })),
    };
  }

  /**
   * 회원 삭제 (소프트 삭제) - 하위 회원 처리 전략 포함
   */
  async remove(
    id: number,
    dto: DeleteMemberDto,
    adminId: number,
  ): Promise<DeleteMemberResponseDto> {
    const member = await this.findOne(id);

    // ADMIN 삭제 방지
    if (member.grade === MemberGrade.ADMIN) {
      throw new BadRequestException('ADMIN 등급 회원은 삭제할 수 없습니다');
    }

    // 자기 자신 삭제 방지
    if (id === adminId) {
      throw new BadRequestException('자기 자신은 삭제할 수 없습니다');
    }

    // 하위 회원 확인
    const directSponsorees = await this.prisma.member.findMany({
      where: { sponsorId: id, isActive: true },
      select: { id: true, teamLine: true },
    });

    const directRecommendees = await this.prisma.member.findMany({
      where: { recommenderId: id, isActive: true },
      select: { id: true },
    });

    const downlineCount = directSponsorees.length + directRecommendees.length;
    const hasDownline = downlineCount > 0;

    return this.prisma.$transaction(async (tx) => {
      // 전략에 따른 하위 회원 처리
      if (hasDownline) {
        switch (dto.downlineStrategy) {
          case DownlineHandlingStrategy.BLOCK:
            throw new BadRequestException(
              `하위 회원이 ${downlineCount}명 있어 삭제할 수 없습니다. ` +
                `삭제하려면 하위 회원 처리 전략을 변경하세요.`,
            );

          case DownlineHandlingStrategy.REASSIGN:
            // 재할당 대상 결정
            const reassignSponsorTarget = dto.reassignToId || member.sponsorId;
            const reassignRecommenderTarget = dto.reassignToId || member.recommenderId;

            if (directSponsorees.length > 0 && !reassignSponsorTarget) {
              throw new BadRequestException(
                '재할당할 상위 후원인이 없습니다. 재할당 대상을 지정해주세요.',
              );
            }

            // 재할당 대상 유효성 확인
            if (dto.reassignToId) {
              const targetExists = await tx.member.findUnique({
                where: { id: dto.reassignToId, isActive: true },
                select: { id: true },
              });
              if (!targetExists) {
                throw new BadRequestException(
                  `재할당 대상 회원 ID ${dto.reassignToId}를 찾을 수 없습니다`,
                );
              }
            }

            // 후원계보 재할당
            if (directSponsorees.length > 0 && reassignSponsorTarget) {
              await tx.member.updateMany({
                where: { sponsorId: id, isActive: true },
                data: { sponsorId: reassignSponsorTarget },
              });
            }

            // 추천계보 재할당
            if (directRecommendees.length > 0 && reassignRecommenderTarget) {
              await tx.member.updateMany({
                where: { recommenderId: id, isActive: true },
                data: { recommenderId: reassignRecommenderTarget },
              });
            }

            this.logger.log(
              `회원 ID ${id} 삭제: 하위 회원 ${downlineCount}명 ` +
                `재할당됨 (후원→${reassignSponsorTarget}, 추천→${reassignRecommenderTarget}) (관리자: ${adminId})`,
            );
            break;

          case DownlineHandlingStrategy.ORPHAN:
            // 후원인/추천인 연결 해제
            await tx.member.updateMany({
              where: { sponsorId: id, isActive: true },
              data: { sponsorId: null, teamLine: null },
            });

            await tx.member.updateMany({
              where: { recommenderId: id, isActive: true },
              data: { recommenderId: null },
            });

            this.logger.warn(
              `회원 ID ${id} 삭제: 하위 회원 ${downlineCount}명 ` +
                `고아 상태로 전환됨 (관리자: ${adminId})`,
            );
            break;
        }
      }

      // 소프트 삭제 수행
      await tx.member.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          isActive: false,
        },
      });

      this.logger.log(
        `회원 ID ${id} (${member.name}) 삭제됨 ` +
          `(사유: ${dto.reason || '없음'}, 관리자: ${adminId})`,
      );

      return {
        message: '회원이 삭제되었습니다',
        deletedMemberId: id,
        deletedMemberName: member.name,
        handledDownlineCount: downlineCount,
        strategy: dto.downlineStrategy,
      };
    });
  }

  /**
   * PV 누적 및 자동 승급 체크
   * ✅ 트랜잭션 + atomic increment로 동시성 문제 해결
   */
  async accumulatePv(
    memberId: number,
    pvAmount: number,
  ): Promise<{ promoted: boolean; newGrade?: MemberGrade }> {
    return this.prisma.$transaction(async (tx) => {
      // 트랜잭션 내에서 회원 조회 (락 획득)
      const member = await tx.member.findUnique({
        where: { id: memberId },
        select: { id: true, grade: true, cumulativePv: true, agentPromotedAt: true },
      });

      if (!member) {
        throw new NotFoundException(`회원 ID ${memberId}를 찾을 수 없습니다`);
      }

      // ✅ Atomic increment로 PV 누적 (Race Condition 방지)
      const updated = await tx.member.update({
        where: { id: memberId },
        data: {
          cumulativePv: { increment: pvAmount },
        },
        select: { cumulativePv: true },
      });

      const newCumulativePv = updated.cumulativePv;

      // 신규 등급 체계: 자동 승급 조건 제거 (PV 기반 승급 없음)
      // 승급은 추천 인원 기준으로 PromotionService에서 별도 처리

      return { promoted: false };
    });
  }

  /**
   * PV 누적 (트랜잭션 컨텍스트 전용)
   * 외부 트랜잭션 내에서 호출 시 사용
   */
  async accumulatePvInTx(
    tx: Parameters<Parameters<typeof this.prisma.$transaction>[0]>[0],
    memberId: number,
    pvAmount: number,
  ): Promise<{ promoted: boolean; newGrade?: MemberGrade }> {
    const member = await tx.member.findUnique({
      where: { id: memberId },
      select: { id: true, grade: true, cumulativePv: true, agentPromotedAt: true },
    });

    if (!member) {
      throw new NotFoundException(`회원 ID ${memberId}를 찾을 수 없습니다`);
    }

    // Atomic increment로 PV 누적
    const updated = await tx.member.update({
      where: { id: memberId },
      data: {
        cumulativePv: { increment: pvAmount },
      },
      select: { cumulativePv: true },
    });

    const newCumulativePv = updated.cumulativePv;

    // 신규 등급 체계: 자동 승급 조건 제거 (PV 기반 승급 없음)
    // 승급은 추천 인원 기준으로 PromotionService에서 별도 처리

    return { promoted: false };
  }

  /**
   * 등급 수동 변경 (ADMIN 전용)
   * 트랜잭션으로 감싸서 동시 요청 시 레이스 컨디션 방지
   */
  async changeGrade(memberId: number, newGrade: MemberGrade, adminId: number) {
    return this.prisma.$transaction(async (tx) => {
      const member = await tx.member.findUnique({
        where: { id: memberId },
        select: { id: true, grade: true, name: true, isActive: true },
      });

      if (!member) {
        throw new NotFoundException(`회원 ID ${memberId}를 찾을 수 없습니다`);
      }

      if (!member.isActive) {
        throw new BadRequestException('비활성 회원의 등급은 변경할 수 없습니다');
      }

      if (member.grade === newGrade) {
        throw new BadRequestException('이미 해당 등급입니다');
      }

      const updated = await tx.member.update({
        where: { id: memberId },
        data: { grade: newGrade },
        select: {
          id: true,
          email: true,
          name: true,
          grade: true,
          updatedAt: true,
        },
      });

      this.logger.log(
        `회원 ID ${memberId} 등급 변경: ${member.grade} → ${newGrade} (관리자: ${adminId})`,
      );

      return updated;
    });
  }

  /**
   * 하위 회원 조회 (후원계보)
   */
  async getDownline(memberId: number) {
    const member = await this.findOne(memberId);

    const downline = await this.prisma.member.findMany({
      where: { sponsorId: memberId, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        grade: true,
        teamLine: true,
        cumulativePv: true,
        createdAt: true,
      },
      orderBy: [{ teamLine: 'asc' }, { createdAt: 'asc' }],
    });

    return {
      member: {
        id: member.id,
        name: member.name,
        email: member.email,
        grade: member.grade,
      },
      downline,
      totalCount: downline.length,
    };
  }

  /**
   * 하위 회원 조회 (추천계보)
   */
  async getRecommendees(memberId: number) {
    const member = await this.findOne(memberId);

    const recommendees = await this.prisma.member.findMany({
      where: { recommenderId: memberId, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        grade: true,
        cumulativePv: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      member: {
        id: member.id,
        name: member.name,
        email: member.email,
        grade: member.grade,
      },
      recommendees,
      totalCount: recommendees.length,
    };
  }

  /**
   * 내 프로필 상세 조회
   */
  async getMyProfile(userId: number) {
    const member = await this.prisma.member.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        phone: true,
        birthDate: true,
        grade: true,
        cumulativePv: true,
        agentPromotedAt: true,
        bankName: true,
        accountNumber: true,
        accountHolder: true,
        postalCode: true,
        address: true,
        addressDetail: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        recommender: {
          select: { id: true, username: true, name: true, grade: true },
        },
        sponsor: {
          select: { id: true, username: true, name: true, grade: true },
        },
        teamLine: true,
      },
    });

    if (!member) {
      throw new NotFoundException('회원 정보를 찾을 수 없습니다');
    }

    return member;
  }

  /**
   * 내 프로필 수정
   */
  async updateMyProfile(userId: number, dto: UpdateProfileDto) {
    // 존재 여부 확인
    await this.getMyProfile(userId);

    // 이메일 중복 확인 (변경하는 경우)
    if (dto.email) {
      const existingEmail = await this.prisma.member.findFirst({
        where: {
          email: dto.email,
          id: { not: userId },
        },
      });

      if (existingEmail) {
        throw new BadRequestException('이미 사용 중인 이메일입니다');
      }
    }

    return this.prisma.member.update({
      where: { id: userId },
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        postalCode: dto.postalCode,
        address: dto.address,
        addressDetail: dto.addressDetail,
        bankName: dto.bankName,
        accountNumber: dto.accountNumber,
        accountHolder: dto.accountHolder,
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        phone: true,
        grade: true,
        postalCode: true,
        address: true,
        addressDetail: true,
        bankName: true,
        accountNumber: true,
        accountHolder: true,
        updatedAt: true,
      },
    });
  }

  /**
   * 내 실적 조회 (판매, 수당)
   */
  async getMyPerformance(userId: number) {
    const member = await this.prisma.member.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        grade: true,
        cumulativePv: true,
        agentPromotedAt: true,
      },
    });

    if (!member) {
      throw new NotFoundException('회원 정보를 찾을 수 없습니다');
    }

    // 이번 달 시작/끝 날짜 계산
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // 이번 달 판매 실적
    const monthlySales = await this.prisma.sale.aggregate({
      where: {
        sellerId: userId,
        soldAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        totalPrice: true,
        totalPv: true,
      },
      _count: true,
    });

    // 이번 달 수당 내역
    const monthlyBonuses = await this.prisma.bonus.aggregate({
      where: {
        memberId: userId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // 수당 유형별 집계
    const bonusByType = await this.prisma.bonus.groupBy({
      by: ['bonusType'],
      where: {
        memberId: userId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // 최근 판매 내역 (최근 10건)
    const recentSales = await this.prisma.sale.findMany({
      where: { sellerId: userId },
      orderBy: { soldAt: 'desc' },
      take: 10,
      select: {
        id: true,
        soldAt: true,
        totalPrice: true,
        totalPv: true,
        product: {
          select: { id: true, name: true },
        },
      },
    });

    // 최근 수당 내역 (최근 10건)
    const recentBonuses = await this.prisma.bonus.findMany({
      where: { memberId: userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        bonusType: true,
        amount: true,
        weekCode: true,
        createdAt: true,
      },
    });

    return {
      member: {
        id: member.id,
        name: member.name,
        grade: member.grade,
        cumulativePv: member.cumulativePv,
        agentPromotedAt: member.agentPromotedAt,
      },
      monthly: {
        period: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
        sales: {
          totalAmount: monthlySales._sum.totalPrice || 0,
          totalPv: monthlySales._sum.totalPv || 0,
          count: monthlySales._count || 0,
        },
        bonuses: {
          totalAmount: monthlyBonuses._sum.amount || 0,
          byType: bonusByType.map((b) => ({
            type: b.bonusType,
            amount: b._sum.amount || 0,
          })),
        },
      },
      recentSales,
      recentBonuses,
    };
  }

  /**
   * 내 조직 조회 (하위 멤버)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getMyOrganization(userId: number, _depth: number = 3) {
    const member = await this.prisma.member.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        grade: true,
        cumulativePv: true,
      },
    });

    if (!member) {
      throw new NotFoundException('회원 정보를 찾을 수 없습니다');
    }

    // 직속 하위 멤버 (후원계보)
    const directDownline = await this.prisma.member.findMany({
      where: { sponsorId: userId, isActive: true },
      select: {
        id: true,
        username: true,
        name: true,
        grade: true,
        teamLine: true,
        cumulativePv: true,
        createdAt: true,
      },
      orderBy: [{ teamLine: 'asc' }, { createdAt: 'asc' }],
    });

    // 팀별 통계
    const teamStats = [1, 2, 3].map((teamLine) => {
      const teamMembers = directDownline.filter((m) => m.teamLine === teamLine);
      return {
        teamLine,
        count: teamMembers.length,
        totalPv: teamMembers.reduce((sum, m) => sum + m.cumulativePv, 0),
        grades: {
          ADMIN: teamMembers.filter((m) => m.grade === 'ADMIN').length,
          CENTER: teamMembers.filter((m) => m.grade === 'CENTER').length,
          BRANCH_MANAGER: teamMembers.filter((m) => m.grade === 'BRANCH_MANAGER').length,
          TEAM_LEADER: teamMembers.filter((m) => m.grade === 'TEAM_LEADER').length,
          SALESPERSON: teamMembers.filter((m) => m.grade === 'SALESPERSON').length,
        },
      };
    });

    // 추천계보는 더 이상 사용하지 않음 - 빈 배열 반환 (후원계보로 전환됨)
    // 기존 코드 주석 처리:
    // const recommendees = await this.prisma.member.findMany({
    //   where: { recommenderId: userId, isActive: true },
    //   ...
    // });

    return {
      member: {
        id: member.id,
        username: member.username,
        name: member.name,
        grade: member.grade,
        cumulativePv: member.cumulativePv,
      },
      sponsorTree: {
        directDownline,
        totalCount: directDownline.length,
        teamStats,
      },
      // 추천계보는 더 이상 사용하지 않음 - 빈 배열 반환
      recommenderTree: {
        recommendees: [],
        totalCount: 0,
      },
    };
  }

  /**
   * 관리자용 비밀번호 초기화
   */
  async resetPassword(memberId: number, adminId: number) {
    const member = await this.findOne(memberId);

    // 임시 비밀번호 생성 (영문 + 숫자 + 특수문자 8자)
    const tempPassword = this.generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await this.prisma.member.update({
      where: { id: memberId },
      data: { password: hashedPassword },
    });

    this.logger.log(`회원 ID ${memberId} 비밀번호 초기화 (관리자: ${adminId})`);

    return {
      message: '비밀번호가 초기화되었습니다',
      tempPassword,
      memberId,
      memberName: member.name,
    };
  }

  /**
   * 임시 비밀번호 생성 (Private)
   */
  private generateTempPassword(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const nums = '0123456789';
    const specials = '@$!%*#?&';

    let password = '';
    // 최소 2개의 영문
    for (let i = 0; i < 3; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // 최소 2개의 숫자
    for (let i = 0; i < 3; i++) {
      password += nums.charAt(Math.floor(Math.random() * nums.length));
    }
    // 최소 1개의 특수문자
    for (let i = 0; i < 2; i++) {
      password += specials.charAt(Math.floor(Math.random() * specials.length));
    }

    // 섞기
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }

  /**
   * 회원 존재 여부 확인 (Private)
   * isActive가 true인 회원만 유효한 것으로 판단
   */
  private async validateMemberExists(memberId: number) {
    const member = await this.prisma.member.findUnique({
      where: {
        id: memberId,
        isActive: true,
      },
      select: { id: true, isActive: true },
    });

    if (!member) {
      throw new BadRequestException(`회원 ID ${memberId}를 찾을 수 없거나 비활성 상태입니다`);
    }
  }

  /**
   * 회원 존재 여부 확인 - 트랜잭션 컨텍스트 전용 (Private)
   * isActive가 true인 회원만 유효한 것으로 판단
   */
  private async validateMemberExistsInTx(
    tx: Parameters<Parameters<typeof this.prisma.$transaction>[0]>[0],
    memberId: number,
  ) {
    const member = await tx.member.findUnique({
      where: {
        id: memberId,
        isActive: true,
      },
      select: { id: true, isActive: true },
    });

    if (!member) {
      throw new BadRequestException(`회원 ID ${memberId}를 찾을 수 없거나 비활성 상태입니다`);
    }
  }

  /**
   * 팀 라인 유효성 검증 (Private)
   * teamLine은 반드시 1, 2, 3 중 하나여야 함 (1:3 규칙)
   */
  private async validateTeamLineAvailable(teamLine?: number) {
    if (teamLine === undefined || teamLine === null) {
      return true;
    }

    if (teamLine < 1 || teamLine > 3) {
      throw new BadRequestException(
        `유효하지 않은 팀라인입니다: ${teamLine}. 팀라인은 1, 2, 3 중 하나여야 합니다.`,
      );
    }

    return true;
  }

  /**
   * 순환 참조 검증 (Private)
   * 새 부모(newParentId)가 현재 회원(memberId)의 하위 조직에 있으면 순환 참조 발생
   */
  private async validateNoCircularReference(
    memberId: number,
    newParentId: number,
    treeType: 'sponsor' | 'recommender',
  ) {
    // 자기 자신을 부모로 설정하면 안됨
    if (memberId === newParentId) {
      throw new BadRequestException('자기 자신을 상위로 설정할 수 없습니다');
    }

    // 현재 회원의 모든 하위 회원 ID 조회
    const allDescendantIds = await this.getAllDescendantIds(memberId, treeType);

    // 새 부모가 하위 조직에 있으면 순환 참조
    if (allDescendantIds.includes(newParentId)) {
      const treeTypeName = treeType === 'sponsor' ? '후원' : '추천';
      throw new BadRequestException(
        `순환 참조 오류: 선택한 회원은 현재 회원의 ${treeTypeName} 하위 조직에 있습니다`,
      );
    }
  }

  /**
   * 모든 하위 회원 ID 조회 (재귀) (Private)
   */
  private async getAllDescendantIds(
    memberId: number,
    treeType: 'sponsor' | 'recommender',
    visited: Set<number> = new Set(),
  ): Promise<number[]> {
    // 무한 루프 방지
    if (visited.has(memberId)) {
      return [];
    }
    visited.add(memberId);

    // 직계 하위 회원 조회
    const whereClause =
      treeType === 'sponsor' ? { sponsorId: memberId } : { recommenderId: memberId };

    const directChildren = await this.prisma.member.findMany({
      where: {
        ...whereClause,
        isActive: true,
      },
      select: { id: true },
    });

    let allDescendantIds: number[] = directChildren.map((c) => c.id);

    // 재귀적으로 하위의 하위 조회
    for (const child of directChildren) {
      const childDescendants = await this.getAllDescendantIds(child.id, treeType, visited);
      allDescendantIds = allDescendantIds.concat(childDescendants);
    }

    return allDescendantIds;
  }

  /**
   * ADMIN 대시보드 통계 조회
   * - 전체 회원 수
   * - 전체 제품 수
   * - 등급별 회원 분포
   */
  async getAdminStats() {
    // 병렬로 모든 통계 조회
    const [totalMembers, totalProducts, gradeDistribution] = await Promise.all([
      // 전체 활성 회원 수
      this.prisma.member.count({ where: { isActive: true } }),

      // 전체 활성 제품 수
      this.prisma.product.count({ where: { isActive: true } }),

      // 등급별 회원 분포
      this.prisma.member.groupBy({
        by: ['grade'],
        where: { isActive: true },
        _count: { grade: true },
      }),
    ]);

    // 등급별 분포를 객체로 변환
    const gradeCountMap: Record<string, number> = {};
    for (const item of gradeDistribution) {
      gradeCountMap[item.grade] = item._count.grade;
    }

    // 모든 등급에 대해 0으로 초기화 (신규 등급 체계)
    const allGrades: MemberGrade[] = [
      'SALESPERSON',
      'TEAM_LEADER',
      'BRANCH_MANAGER',
      'CENTER',
      'ADMIN',
    ];

    const distribution: Record<string, number> = {};
    for (const grade of allGrades) {
      distribution[grade] = gradeCountMap[grade] || 0;
    }

    return {
      totalMembers,
      totalProducts,
      gradeDistribution: distribution,
    };
  }

  // ============================================
  // 회원 정보 롤백 관련 메서드
  // ============================================

  /**
   * 롤백용 최대 이력 조회 건수
   */
  private readonly MAX_ROLLBACK_DEPTH = 5;

  /**
   * 롤백 가능 최대 일수 (30일)
   */
  private readonly MAX_ROLLBACK_DAYS = 30;

  /**
   * 회원 변경 이력 조회
   * 최근 5건의 변경 이력을 조회하여 롤백 가능 여부와 함께 반환
   */
  async getChangeHistory(memberId: number, limit?: number): Promise<ChangeHistoryResponse> {
    const maxLimit = limit ?? this.MAX_ROLLBACK_DEPTH;

    // 회원 존재 여부 확인
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        name: true,
        phone: true,
        birthDate: true,
        grade: true,
        email: true,
        recommenderId: true,
        sponsorId: true,
        teamLine: true,
        bankName: true,
        accountNumber: true,
        accountHolder: true,
        postalCode: true,
        address: true,
        addressDetail: true,
        isActive: true,
      },
    });

    if (!member) {
      throw new NotFoundException(`회원 ID ${memberId}를 찾을 수 없습니다`);
    }

    // 30일 전 날짜 계산
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - this.MAX_ROLLBACK_DAYS);

    // MEMBER_UPDATED 액션 로그 조회 (최근 N건)
    const logs = await this.prisma.activityLog.findMany({
      where: {
        targetType: 'MEMBER',
        targetId: memberId,
        action: 'MEMBER_UPDATED',
      },
      orderBy: { createdAt: 'desc' },
      take: maxLimit,
      include: {
        member: {
          select: { id: true, name: true },
        },
      },
    });

    // 변경 이력 생성
    const changeHistory: ChangeHistoryItem[] = logs.map((log, index) => {
      const details = log.details as Record<string, any> | null;
      const changes = details?.changes || [];
      const changedFields = details?.changedFields || [];
      const logDate = new Date(log.createdAt);

      // 롤백 가능 여부 체크
      let canRollback = true;
      let rollbackBlockReason: string | undefined;

      // 30일 이상 지난 이력은 롤백 불가
      if (logDate < thirtyDaysAgo) {
        canRollback = false;
        rollbackBlockReason = '30일 이상 지난 변경 이력은 롤백할 수 없습니다';
      }

      // 롤백 불가 필드만 포함된 경우
      const rollbackableChanges = changedFields.filter(
        (field: string) => ROLLBACKABLE_FIELDS.includes(field),
      );
      if (rollbackableChanges.length === 0) {
        canRollback = false;
        rollbackBlockReason = '롤백 가능한 필드가 없습니다';
      }

      return {
        logId: log.id,
        changedAt: log.createdAt.toISOString(),
        changedBy: log.member
          ? {
              id: log.member.id,
              name: log.member.name,
            }
          : null,
        changedFields,
        changes: changes.map((c: any) => ({
          field: c.field,
          before: this.maskSensitiveField(c.field, c.before),
          after: this.maskSensitiveField(c.field, c.after),
        })),
        canRollback,
        rollbackBlockReason,
      };
    });

    return {
      memberId,
      memberName: member.name,
      currentValues: {
        name: member.name,
        phone: member.phone,
        birthDate: member.birthDate?.toISOString().split('T')[0] || null,
        grade: member.grade,
        email: member.email,
        recommenderId: member.recommenderId,
        sponsorId: member.sponsorId,
        teamLine: member.teamLine,
        bankName: member.bankName,
        accountNumber: this.maskSensitiveField('accountNumber', member.accountNumber),
        accountHolder: member.accountHolder,
        postalCode: member.postalCode,
        address: member.address,
        addressDetail: member.addressDetail,
        isActive: member.isActive,
      },
      changeHistory,
      maxRollbackDepth: this.MAX_ROLLBACK_DEPTH,
    };
  }

  /**
   * 회원 정보 롤백 실행
   * 선택한 변경 이력의 before 값으로 회원 정보를 복원
   */
  async rollbackMember(
    memberId: number,
    dto: RollbackMemberDto,
    adminId: number,
  ): Promise<RollbackResultResponse> {
    return this.prisma.$transaction(async (tx) => {
      // 1. 회원 존재 여부 확인
      const member = await tx.member.findUnique({
        where: { id: memberId },
        select: {
          id: true,
          name: true,
          phone: true,
          birthDate: true,
          grade: true,
          email: true,
          recommenderId: true,
          sponsorId: true,
          teamLine: true,
          bankName: true,
          accountNumber: true,
          accountHolder: true,
          postalCode: true,
          address: true,
          addressDetail: true,
          isActive: true,
        },
      });

      if (!member) {
        throw new NotFoundException(`회원 ID ${memberId}를 찾을 수 없습니다`);
      }

      // 2. 대상 ActivityLog 조회
      const targetLog = await tx.activityLog.findUnique({
        where: { id: dto.rollbackToLogId },
      });

      if (!targetLog) {
        throw new NotFoundException(`ActivityLog ID ${dto.rollbackToLogId}를 찾을 수 없습니다`);
      }

      // 3. 대상 로그 검증
      if (targetLog.targetId !== memberId || targetLog.targetType !== 'MEMBER') {
        throw new BadRequestException('선택한 변경 이력이 해당 회원의 것이 아닙니다');
      }

      if (targetLog.action !== 'MEMBER_UPDATED') {
        throw new BadRequestException('롤백 가능한 변경 이력이 아닙니다');
      }

      // 4. 30일 이상 지난 이력 체크
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - this.MAX_ROLLBACK_DAYS);
      if (targetLog.createdAt < thirtyDaysAgo) {
        throw new BadRequestException('30일 이상 지난 변경 이력은 롤백할 수 없습니다');
      }

      // 5. details에서 changes 추출
      const details = targetLog.details as Record<string, any> | null;
      const changes = details?.changes || [];

      if (changes.length === 0) {
        throw new BadRequestException('롤백할 변경 내역이 없습니다');
      }

      // 6. 롤백할 필드 결정
      let fieldsToRollback: string[];
      if (!dto.fieldsToRollback || dto.fieldsToRollback.length === 0) {
        // 전체 롤백 (롤백 가능한 필드만)
        fieldsToRollback = changes
          .map((c: any) => c.field)
          .filter((field: string) => ROLLBACKABLE_FIELDS.includes(field));
      } else {
        // 선택된 필드 중 롤백 가능한 필드만 필터링
        fieldsToRollback = dto.fieldsToRollback.filter((field) =>
          ROLLBACKABLE_FIELDS.includes(field),
        );
      }

      if (fieldsToRollback.length === 0) {
        throw new BadRequestException('롤백 가능한 필드가 없습니다');
      }

      // 7. 롤백 데이터 준비
      const rollbackData: Record<string, any> = {};
      const rollbackChanges: Array<{ field: string; before: any; after: any }> = [];

      for (const change of changes) {
        if (fieldsToRollback.includes(change.field)) {
          const beforeValue = change.before;
          const currentValue = (member as any)[change.field];

          // birthDate 처리
          if (change.field === 'birthDate' && beforeValue) {
            rollbackData[change.field] = new Date(beforeValue);
          } else {
            rollbackData[change.field] = beforeValue;
          }

          rollbackChanges.push({
            field: change.field,
            before: currentValue, // 현재 값 (롤백 전)
            after: beforeValue, // 롤백될 값 (과거 값)
          });
        }
      }

      // 8. 회원 정보 업데이트
      await tx.member.update({
        where: { id: memberId },
        data: rollbackData,
      });

      // 9. 시스템 오류 롤백 시 디버깅 정보 수집
      let debugInfo: DebugInfo | undefined;
      if (dto.reason === RollbackReason.SYSTEM_ERROR) {
        // 최근 관련 로그 5건 조회
        const relatedLogs = await tx.activityLog.findMany({
          where: {
            targetType: 'MEMBER',
            targetId: memberId,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            action: true,
            createdAt: true,
          },
        });

        debugInfo = {
          originalErrorLogId: dto.rollbackToLogId,
          systemInfo: {
            timestamp: new Date().toISOString(),
            serverVersion: process.env.npm_package_version || 'unknown',
            nodeEnv: process.env.NODE_ENV || 'development',
          },
          relatedLogs: relatedLogs.map((log) => ({
            logId: log.id,
            action: log.action,
            createdAt: log.createdAt.toISOString(),
          })),
        };
      }

      // 10. MEMBER_ROLLBACK 로그 기록
      await tx.activityLog.create({
        data: {
          memberId: adminId,
          action: 'MEMBER_ROLLBACK',
          targetType: 'MEMBER',
          targetId: memberId,
          details: {
            targetMemberId: memberId,
            targetMemberName: member.name,
            rollbackToLogId: dto.rollbackToLogId,
            rollbackReason: dto.reason,
            rollbackReasonDetail: dto.reasonDetail || null,
            restoredFields: fieldsToRollback,
            changes: rollbackChanges,
            rolledBackBy: adminId,
            rolledBackAt: new Date().toISOString(),
            debugInfo: debugInfo ? JSON.parse(JSON.stringify(debugInfo)) : null,
          },
        },
      });

      this.logger.log(
        `회원 정보 롤백 완료: ID ${memberId} | 롤백 필드: ${fieldsToRollback.join(', ')} | ` +
          `사유: ${RollbackReasonLabels[dto.reason]} | 관리자: ${adminId}`,
      );

      // 11. 시스템 오류 롤백 시 Slack 알림 발송
      let notificationSent = false;
      if (dto.reason === RollbackReason.SYSTEM_ERROR) {
        try {
          notificationSent = await this.notificationService.sendSystemErrorRollbackNotification({
            memberId,
            memberName: member.name,
            rollbackTime: new Date().toISOString(),
            adminId,
            restoredFields: fieldsToRollback,
            changes: rollbackChanges,
            rollbackReason: dto.reason,
            rollbackReasonDetail: dto.reasonDetail,
            debugInfo,
          });
        } catch (notifyError) {
          this.logger.error(
            `시스템 오류 롤백 알림 발송 실패: ${notifyError instanceof Error ? notifyError.message : 'Unknown error'}`,
          );
        }
      }

      return {
        success: true,
        message: '회원 정보가 성공적으로 롤백되었습니다',
        memberId,
        memberName: member.name,
        rollbackLogId: dto.rollbackToLogId,
        restoredFields: fieldsToRollback,
        changes: rollbackChanges.map((c) => ({
          field: c.field,
          before: this.maskSensitiveField(c.field, c.before),
          after: this.maskSensitiveField(c.field, c.after),
        })),
        rollbackReason: dto.reason,
        rollbackReasonLabel: RollbackReasonLabels[dto.reason],
        notificationSent,
      };
    });
  }

  /**
   * 민감 정보 마스킹 (계좌번호)
   * @private
   */
  private maskSensitiveField(field: string, value: any): any {
    if (field === 'accountNumber' && value && typeof value === 'string') {
      // 계좌번호 마스킹: 뒤 4자리만 표시
      if (value.length > 4) {
        return '*'.repeat(value.length - 4) + value.slice(-4);
      }
    }
    return value;
  }

  // ============================================
  // 전체 롤백 이력 조회 (ADMIN용)
  // ============================================

  /**
   * 전체 회원 롤백 이력 조회
   * ADMIN용: 전체 회원의 롤백 이력을 페이지네이션으로 조회
   */
  async getRollbackHistory(params: {
    page?: number;
    limit?: number;
    reason?: RollbackReason;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    // 기본 쿼리 조건: MEMBER_ROLLBACK 액션만
    const where: any = {
      action: 'MEMBER_ROLLBACK',
      targetType: 'MEMBER',
    };

    // 기간 필터
    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) {
        where.createdAt.gte = new Date(params.startDate);
      }
      if (params.endDate) {
        // endDate는 해당 날짜의 끝까지 포함
        const endDate = new Date(params.endDate);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    // 롤백 이력 조회
    const [logs, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          member: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    // 롤백 사유 필터 및 검색어 필터 (details는 JSON이므로 메모리에서 처리)
    let filteredLogs = logs;

    // 롤백 사유 필터
    if (params.reason) {
      filteredLogs = filteredLogs.filter((log) => {
        const details = log.details as Record<string, any> | null;
        return details?.rollbackReason === params.reason;
      });
    }

    // 검색어 필터 (회원명 또는 ID)
    if (params.search && params.search.trim()) {
      const searchTerm = params.search.trim().toLowerCase();
      const isNumeric = /^\d+$/.test(searchTerm);

      filteredLogs = filteredLogs.filter((log) => {
        const details = log.details as Record<string, any> | null;
        if (isNumeric) {
          return details?.targetMemberId === parseInt(searchTerm, 10);
        }
        return details?.targetMemberName?.toLowerCase().includes(searchTerm);
      });
    }

    // 응답 데이터 매핑
    const data = filteredLogs.map((log) => {
      const details = log.details as Record<string, any> | null;
      return {
        id: log.id,
        memberId: log.memberId,
        memberName: log.member?.name || '알 수 없음',
        targetMemberId: details?.targetMemberId || log.targetId,
        targetMemberName: details?.targetMemberName || '알 수 없음',
        rollbackReason: details?.rollbackReason || 'OTHER',
        rollbackReasonLabel:
          RollbackReasonLabels[details?.rollbackReason as RollbackReason] || '기타',
        rollbackReasonDetail: details?.rollbackReasonDetail || null,
        restoredFields: details?.restoredFields || [],
        changes: (details?.changes || []).map((c: any) => ({
          field: c.field,
          before: this.maskSensitiveField(c.field, c.before),
          after: this.maskSensitiveField(c.field, c.after),
        })),
        createdAt: log.createdAt.toISOString(),
      };
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ============================================
  // 센터별 회원 관리 API
  // ============================================

  /**
   * 센터별 회원 수 통계 조회
   * 각 센터(CENTER 등급 회원)별 소속 회원 수와 미지정 회원 수 반환
   */
  async getCenterStats() {
    // 1. 모든 활성 센터 조회
    const centers = await this.prisma.member.findMany({
      where: {
        grade: MemberGrade.CENTER,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    });

    // 2. 센터별 회원 수 집계
    const centerStats = await Promise.all(
      centers.map(async (center) => {
        const memberCount = await this.prisma.member.count({
          where: {
            centerName: center.name,
            isActive: true,
            grade: { notIn: [MemberGrade.ADMIN, MemberGrade.CENTER] },
          },
        });

        return {
          centerName: center.name,
          centerId: center.id,
          memberCount,
        };
      }),
    );

    // 3. 미지정 회원 수 (centerName이 null 또는 빈 문자열)
    const unassignedCount = await this.prisma.member.count({
      where: {
        isActive: true,
        grade: { notIn: [MemberGrade.ADMIN, MemberGrade.CENTER] },
        OR: [{ centerName: null }, { centerName: '' }],
      },
    });

    // 4. 전체 회원 수 (ADMIN, CENTER 제외)
    const totalMembers = await this.prisma.member.count({
      where: {
        isActive: true,
        grade: { notIn: [MemberGrade.ADMIN, MemberGrade.CENTER] },
      },
    });

    return {
      centers: centerStats,
      unassignedCount,
      totalMembers,
    };
  }

  /**
   * 센터별 회원 목록 조회
   * 특정 센터에 소속된 회원 목록을 페이지네이션으로 조회
   */
  async getMembersByCenter(
    centerName: string,
    params: { page?: number; limit?: number; search?: string },
  ) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      centerName,
      isActive: true,
      grade: { notIn: [MemberGrade.ADMIN, MemberGrade.CENTER] },
    };

    // 검색 조건 추가
    if (params.search && params.search.trim()) {
      const searchTerm = params.search.trim();
      const isNumeric = /^\d+$/.test(searchTerm);

      if (isNumeric) {
        where.id = parseInt(searchTerm, 10);
      } else {
        where.OR = [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { username: { contains: searchTerm, mode: 'insensitive' } },
        ];
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.member.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          username: true,
          name: true,
          phone: true,
          grade: true,
          cumulativePv: true,
          createdAt: true,
          centerName: true,
        },
      }),
      this.prisma.member.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        centerName,
      },
    };
  }

  /**
   * 센터 미지정 회원 목록 조회
   * centerName이 null 또는 빈 값인 회원 조회 (ADMIN, CENTER 등급 제외)
   */
  async getUnassignedMembers(params: { page?: number; limit?: number; search?: string }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
      grade: { notIn: [MemberGrade.ADMIN, MemberGrade.CENTER] },
      OR: [{ centerName: null }, { centerName: '' }],
    };

    // 검색 조건 추가
    if (params.search && params.search.trim()) {
      const searchTerm = params.search.trim();
      const isNumeric = /^\d+$/.test(searchTerm);

      if (isNumeric) {
        // OR 조건과 병합
        where.AND = [{ OR: where.OR }, { id: parseInt(searchTerm, 10) }];
        delete where.OR;
      } else {
        // 검색 조건과 null/빈값 조건 모두 만족해야 함
        where.AND = [
          { OR: where.OR },
          {
            OR: [
              { name: { contains: searchTerm, mode: 'insensitive' } },
              { username: { contains: searchTerm, mode: 'insensitive' } },
            ],
          },
        ];
        delete where.OR;
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.member.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          username: true,
          name: true,
          phone: true,
          grade: true,
          cumulativePv: true,
          createdAt: true,
          centerName: true,
        },
      }),
      this.prisma.member.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 일괄 센터 지정
   * 여러 회원에게 동일한 센터를 일괄 지정
   */
  async assignCenterBulk(memberIds: number[], centerName: string, adminId: number) {
    return this.prisma.$transaction(async (tx) => {
      // 1. 센터 존재 여부 확인 (CENTER 등급 회원 중 name이 일치하는지)
      const center = await tx.member.findFirst({
        where: {
          grade: MemberGrade.CENTER,
          name: centerName,
          isActive: true,
        },
        select: { id: true, name: true },
      });

      if (!center) {
        throw new BadRequestException(`센터 "${centerName}"을(를) 찾을 수 없습니다`);
      }

      // 2. 회원들 존재 여부 및 유효성 확인
      const members = await tx.member.findMany({
        where: {
          id: { in: memberIds },
          isActive: true,
          grade: { notIn: [MemberGrade.ADMIN, MemberGrade.CENTER] },
        },
        select: { id: true, name: true, centerName: true },
      });

      if (members.length === 0) {
        throw new BadRequestException('유효한 회원이 없습니다');
      }

      const validMemberIds = members.map((m) => m.id);
      const invalidIds = memberIds.filter((id) => !validMemberIds.includes(id));

      if (invalidIds.length > 0) {
        this.logger.warn(
          `센터 지정 시 유효하지 않은 회원 ID: ${invalidIds.join(', ')} (관리자: ${adminId})`,
        );
      }

      // 3. 일괄 업데이트
      const updateResult = await tx.member.updateMany({
        where: { id: { in: validMemberIds } },
        data: { centerName },
      });

      // 4. Activity Log 기록
      await tx.activityLog.create({
        data: {
          memberId: adminId,
          action: 'CENTER_ASSIGNED',
          targetType: 'MEMBER',
          targetId: center.id,
          details: {
            centerName,
            centerId: center.id,
            assignedMemberIds: validMemberIds,
            assignedCount: updateResult.count,
            memberDetails: members.map((m) => ({
              id: m.id,
              name: m.name,
              previousCenter: m.centerName || null,
            })),
            assignedAt: new Date().toISOString(),
            assignedBy: adminId,
          },
        },
      });

      this.logger.log(
        `센터 일괄 지정 완료: ${updateResult.count}명 → ${centerName} (관리자: ${adminId})`,
      );

      return {
        success: true,
        message: `${updateResult.count}명의 회원이 ${centerName}로 지정되었습니다`,
        centerName,
        assignedCount: updateResult.count,
        memberIds: validMemberIds,
      };
    });
  }

  // ============================================
  // 전체 회원 비밀번호 일괄 초기화 API
  // ============================================

  /**
   * 전체 회원 비밀번호 일괄 초기화 (ADMIN 전용)
   * ADMIN을 제외한 모든 활성 회원의 비밀번호를 "12341234"로 초기화
   */
  async bulkResetPasswords(confirmationText: string, adminId: number, reason?: string) {
    // 확인 문자열 검증
    if (confirmationText !== 'RESET_ALL_PASSWORDS') {
      throw new BadRequestException(
        '확인 문자열이 일치하지 않습니다. RESET_ALL_PASSWORDS를 입력해주세요.',
      );
    }

    // 새 비밀번호 해시 생성 (트랜잭션 외부에서 수행 - CPU 집약적 작업)
    const newPassword = '12341234';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    return this.prisma.$transaction(async (tx) => {
      // 1. 초기화 대상 회원 수 조회 (ADMIN 제외)
      const targetMembers = await tx.member.findMany({
        where: {
          isActive: true,
          grade: { not: MemberGrade.ADMIN },
        },
        select: { id: true, name: true, username: true, grade: true },
      });

      // 2. ADMIN 회원 수 조회
      const adminCount = await tx.member.count({
        where: {
          isActive: true,
          grade: MemberGrade.ADMIN,
        },
      });

      if (targetMembers.length === 0) {
        throw new BadRequestException('초기화 대상 회원이 없습니다');
      }

      // 3. 일괄 비밀번호 업데이트
      const updateResult = await tx.member.updateMany({
        where: {
          isActive: true,
          grade: { not: MemberGrade.ADMIN },
        },
        data: { password: hashedPassword },
      });

      // 4. Activity Log 기록
      const executedAt = new Date();
      await tx.activityLog.create({
        data: {
          memberId: adminId,
          action: 'BULK_PASSWORD_RESET',
          targetType: 'MEMBER',
          targetId: adminId, // 관리자 ID (전체 대상이므로)
          details: {
            action: 'BULK_PASSWORD_RESET',
            resetCount: updateResult.count,
            excludedAdminCount: adminCount,
            newPassword,
            reason: reason || '사유 없음',
            affectedMembers: targetMembers.map((m) => ({
              id: m.id,
              name: m.name,
              username: m.username,
              grade: m.grade,
            })),
            executedAt: executedAt.toISOString(),
            executedBy: adminId,
          },
        },
      });

      this.logger.warn(
        `전체 회원 비밀번호 초기화 실행: ${updateResult.count}명 | ` +
          `제외된 ADMIN: ${adminCount}명 | 사유: ${reason || '없음'} | 관리자: ${adminId}`,
      );

      return {
        success: true,
        message: `${updateResult.count}명의 회원 비밀번호가 초기화되었습니다`,
        resetCount: updateResult.count,
        excludedAdminCount: adminCount,
        newPassword,
        executedAt: executedAt.toISOString(),
      };
    });
  }

  /**
   * 비밀번호 초기화 대상 회원 수 조회 (ADMIN 제외)
   * 모달에서 영향 범위를 표시하기 위해 사용
   */
  async getBulkResetTargetCount(): Promise<{
    targetCount: number;
    adminCount: number;
  }> {
    const [targetCount, adminCount] = await Promise.all([
      this.prisma.member.count({
        where: {
          isActive: true,
          grade: { not: MemberGrade.ADMIN },
        },
      }),
      this.prisma.member.count({
        where: {
          isActive: true,
          grade: MemberGrade.ADMIN,
        },
      }),
    ]);

    return { targetCount, adminCount };
  }

  /**
   * 회원의 센터 해제 (개별)
   * 특정 회원의 centerName을 null로 설정
   */
  async unassignCenter(memberId: number, adminId: number) {
    return this.prisma.$transaction(async (tx) => {
      // 1. 회원 존재 여부 확인
      const member = await tx.member.findUnique({
        where: { id: memberId },
        select: { id: true, name: true, centerName: true, grade: true, isActive: true },
      });

      if (!member) {
        throw new NotFoundException(`회원 ID ${memberId}를 찾을 수 없습니다`);
      }

      if (!member.isActive) {
        throw new BadRequestException('비활성 회원의 센터를 변경할 수 없습니다');
      }

      if (member.grade === MemberGrade.ADMIN || member.grade === MemberGrade.CENTER) {
        throw new BadRequestException('ADMIN 또는 CENTER 등급 회원의 센터를 변경할 수 없습니다');
      }

      const previousCenter = member.centerName;

      if (!previousCenter) {
        throw new BadRequestException('이미 센터가 지정되지 않은 회원입니다');
      }

      // 2. 센터 해제
      await tx.member.update({
        where: { id: memberId },
        data: { centerName: null },
      });

      // 3. Activity Log 기록
      await tx.activityLog.create({
        data: {
          memberId: adminId,
          action: 'CENTER_UNASSIGNED',
          targetType: 'MEMBER',
          targetId: memberId,
          details: {
            memberId,
            memberName: member.name,
            previousCenter,
            unassignedAt: new Date().toISOString(),
            unassignedBy: adminId,
          },
        },
      });

      this.logger.log(
        `센터 해제 완료: 회원 ${memberId} (${member.name}) - 이전 센터: ${previousCenter} (관리자: ${adminId})`,
      );

      return {
        success: true,
        message: `${member.name}님의 센터 지정이 해제되었습니다`,
        memberId,
        memberName: member.name,
        previousCenter,
      };
    });
  }
}
