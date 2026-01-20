import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 주문 코드 생성 (ORD-YYYYMMDD-XXXX)
   */
  private async generateOrderCode(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `ORD-${dateStr}-`;

    // 오늘 생성된 주문 중 마지막 번호 조회
    const lastOrder = await this.prisma.order.findFirst({
      where: {
        orderCode: { startsWith: prefix },
      },
      orderBy: { orderCode: 'desc' },
    });

    let sequence = 1;
    if (lastOrder) {
      const lastSeq = parseInt(lastOrder.orderCode.split('-')[2], 10);
      sequence = lastSeq + 1;
    }

    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }

  /**
   * 주문 생성 (재구매)
   */
  async create(createOrderDto: CreateOrderDto) {
    const { memberId, items, note } = createOrderDto;

    // 회원 존재 확인
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
    });
    if (!member) {
      throw new NotFoundException('회원을 찾을 수 없습니다.');
    }

    // 상품 정보 조회 및 검증
    const productIds = items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
        deletedAt: null,
      },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('일부 상품을 찾을 수 없거나 판매 중지된 상품입니다.');
    }

    // 총 금액/PV 계산
    let totalPrice = 0;
    let totalPv = 0;
    const orderItems = items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        throw new BadRequestException(`상품 ID ${item.productId}를 찾을 수 없습니다.`);
      }
      const itemPrice = product.price * item.quantity;
      const itemPv = product.pv * item.quantity;
      totalPrice += itemPrice;
      totalPv += itemPv;

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
        unitPv: product.pv,
      };
    });

    // 주문 코드 생성
    const orderCode = await this.generateOrderCode();

    // 주문 및 아이템 생성
    const order = await this.prisma.order.create({
      data: {
        orderCode,
        memberId,
        totalPrice,
        totalPv,
        status: OrderStatus.PENDING,
        paymentMethod: 'BANK_TRANSFER',
        note,
        items: {
          create: orderItems,
        },
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            username: true,
            grade: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    return order;
  }

  /**
   * 회원별 주문 목록 조회
   */
  async findByMember(memberId: number, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { memberId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.order.count({ where: { memberId } }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 전체 주문 목록 조회 (관리자용)
   */
  async findAll(params: { page?: number; limit?: number; status?: OrderStatus }) {
    const { page = 1, limit = 20, status } = params;
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          member: {
            select: {
              id: true,
              name: true,
              username: true,
              phone: true,
              grade: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 주문 상세 조회
   */
  async findOne(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            username: true,
            phone: true,
            grade: true,
            address: true,
            addressDetail: true,
            postalCode: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                code: true,
                price: true,
                pv: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('주문을 찾을 수 없습니다.');
    }

    return order;
  }

  /**
   * 주문 상태 변경
   */
  async updateStatus(id: number, updateDto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });

    if (!order) {
      throw new NotFoundException('주문을 찾을 수 없습니다.');
    }

    const data: any = { status: updateDto.status };

    // 입금 확인 시 confirmedAt 설정
    if (updateDto.status === OrderStatus.CONFIRMED) {
      data.confirmedAt = new Date();
    }

    return this.prisma.order.update({
      where: { id },
      data,
      include: {
        member: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * 주문 통계 (회원별)
   */
  async getMemberOrderStats(memberId: number) {
    const stats = await this.prisma.order.groupBy({
      by: ['status'],
      where: { memberId },
      _count: true,
      _sum: {
        totalPrice: true,
        totalPv: true,
      },
    });

    const totalOrders = await this.prisma.order.count({ where: { memberId } });

    return {
      totalOrders,
      byStatus: stats.map((s) => ({
        status: s.status,
        count: s._count,
        totalPrice: s._sum.totalPrice || 0,
        totalPv: s._sum.totalPv || 0,
      })),
    };
  }
}
