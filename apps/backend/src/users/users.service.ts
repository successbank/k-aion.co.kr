import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: any) {
    const { page = 1, limit = 20, grade, search, recommenderId } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (grade) where.grade = grade;
    if (recommenderId) where.recommenderId = Number(recommenderId);
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [members, total] = await Promise.all([
      this.prisma.member.findMany({
        where,
        skip,
        take: Number(limit),
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          grade: true,
          isActive: true,
          createdAt: true,
          recommender: { select: { id: true, name: true, grade: true } },
          sponsor: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.member.count({ where }),
    ]);

    return {
      data: members,
      meta: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: number) {
    const member = await this.prisma.member.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        grade: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        recommender: { select: { id: true, name: true, grade: true } },
        sponsor: { select: { id: true, name: true } },
        recommendees: { select: { id: true, name: true, grade: true } },
      },
    });

    if (!member) throw new NotFoundException(`Member with ID ${id} not found`);
    return member;
  }

  async create(dto: any) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.member.create({
      data: {
        ...dto,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        grade: true,
        createdAt: true,
      },
    });
  }

  async getOrganizationTree(memberId: number) {
    // 재귀 CTE로 조직도 조회 (추천계보)
    const tree = await this.prisma.$queryRaw`
      WITH RECURSIVE org_tree AS (
        SELECT id, name, email, grade, recommender_id, 1 as level
        FROM members
        WHERE id = ${memberId}

        UNION ALL

        SELECT m.id, m.name, m.email, m.grade, m.recommender_id, ot.level + 1
        FROM members m
        INNER JOIN org_tree ot ON m.recommender_id = ot.id
        WHERE ot.level < 10
      )
      SELECT * FROM org_tree ORDER BY level, name
    `;

    return tree;
  }
}
