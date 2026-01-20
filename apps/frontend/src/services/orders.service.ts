import { apiClient } from './api';

// 주문 상태 enum
export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// 주문 상태 한글 라벨
export const OrderStatusLabels: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: '입금대기',
  [OrderStatus.CONFIRMED]: '입금확인',
  [OrderStatus.COMPLETED]: '완료',
  [OrderStatus.CANCELLED]: '취소',
};

// 주문 상태 색상
export const OrderStatusColors: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'warning',
  [OrderStatus.CONFIRMED]: 'processing',
  [OrderStatus.COMPLETED]: 'success',
  [OrderStatus.CANCELLED]: 'default',
};

// 주문 아이템 인터페이스
export interface OrderItem {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  unitPv: number;
  product: {
    id: number;
    name: string;
    code: string;
    imageUrl?: string;
    price?: number;
    pv?: number;
  };
}

// 주문 인터페이스
export interface Order {
  id: number;
  orderCode: string;
  memberId: number;
  totalPrice: number;
  totalPv: number;
  status: OrderStatus;
  paymentMethod: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  member?: {
    id: number;
    name: string;
    username: string;
    phone?: string;
    grade: string;
    address?: string;
    addressDetail?: string;
    postalCode?: string;
  };
  items: OrderItem[];
}

// 주문 목록 응답
export interface OrdersListResponse {
  data: Order[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// 주문 생성 DTO
export interface CreateOrderDto {
  memberId: number;
  items: Array<{
    productId: number;
    quantity: number;
  }>;
  note?: string;
}

// 주문 통계
export interface OrderStats {
  totalOrders: number;
  byStatus: Array<{
    status: OrderStatus;
    count: number;
    totalPrice: number;
    totalPv: number;
  }>;
}

class OrdersService {
  /**
   * 주문 생성 (재구매)
   */
  async createOrder(dto: CreateOrderDto): Promise<Order> {
    return apiClient.post<Order>('/v1/orders', dto);
  }

  /**
   * 전체 주문 목록 조회 (관리자용)
   */
  async getOrders(params: {
    page?: number;
    limit?: number;
    status?: OrderStatus;
  }): Promise<OrdersListResponse> {
    const queryParams: Record<string, string> = {};
    if (params.page) queryParams.page = String(params.page);
    if (params.limit) queryParams.limit = String(params.limit);
    if (params.status) queryParams.status = params.status;

    return apiClient.get<OrdersListResponse>('/v1/orders', queryParams);
  }

  /**
   * 회원별 주문 목록 조회
   */
  async getOrdersByMember(
    memberId: number,
    params: { page?: number; limit?: number } = {},
  ): Promise<OrdersListResponse> {
    const queryParams: Record<string, string> = {};
    if (params.page) queryParams.page = String(params.page);
    if (params.limit) queryParams.limit = String(params.limit);

    return apiClient.get<OrdersListResponse>(`/v1/orders/member/${memberId}`, queryParams);
  }

  /**
   * 주문 상세 조회
   */
  async getOrder(id: number): Promise<Order> {
    return apiClient.get<Order>(`/v1/orders/${id}`);
  }

  /**
   * 주문 상태 변경
   */
  async updateOrderStatus(id: number, status: OrderStatus): Promise<Order> {
    return apiClient.patch<Order>(`/v1/orders/${id}/status`, { status });
  }

  /**
   * 회원 주문 통계
   */
  async getMemberOrderStats(memberId: number): Promise<OrderStats> {
    return apiClient.get<OrderStats>(`/v1/orders/member/${memberId}/stats`);
  }
}

export const ordersService = new OrdersService();
