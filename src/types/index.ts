// 창업 상담 신청 타입
export interface ConsultationRequest {
  id?: string;
  name: string;
  phone: string;
  preferredRegion: string;
  message?: string;
  privacyAgreed: boolean;
  createdAt?: string;
  status?: ConsultationStatus;
}

export type ConsultationStatus = 'pending' | 'contacted' | 'completed' | 'cancelled';

// 매장 정보 타입
export interface Store {
  id: string;
  name: string;
  address: string;
  phone?: string;
  latitude: number;
  longitude: number;
  operatingHours?: OperatingHours;
  regionCode: string;
  districtCode: string;
  isActive: boolean;
}

export interface OperatingHours {
  weekday: string;
  weekend: string;
  holiday?: string;
}

// 제품 타입
export interface Product {
  id: string;
  name: string;
  slug: string;
  category: ProductCategory;
  description: string;
  shortDescription: string;
  features: string[];
  specifications?: Record<string, string>;
  images: ProductImage[];
  price?: number;
}

export type ProductCategory = 'low-frequency' | 'ultrasound' | 'patch' | 'gel';

export interface ProductImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

// FAQ 타입
export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: FAQCategory;
  order: number;
}

export type FAQCategory = 'franchise' | 'product' | 'store' | 'general';

// 공지사항 타입
export interface Notice {
  id: string;
  title: string;
  content: string;
  category: NoticeCategory;
  isPinned: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type NoticeCategory = 'general' | 'event' | 'update';

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 지역 타입
export interface Region {
  code: string;
  name: string;
  districts: District[];
}

export interface District {
  code: string;
  name: string;
}

// 창업 비용 정보
export interface FranchiseCost {
  startupCost: number;
  productSupport: number;
  settlementSupport: number;
  recruitmentBonus: number;
  educationCount: number;
  minimumArea: number;
}

// 네비게이션 메뉴 타입
export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

// SEO 메타데이터 타입
export interface PageMeta {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: 'website' | 'article';
}
