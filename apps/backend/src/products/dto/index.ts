export class CreateProductDto {
  code?: string;
  name: string;
  description?: string;
  price: number;
  pv: number;
  categoryId: string;
  images?: string[];
  stock?: number;
  status?: string;
}

export class UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  pv?: number;
  categoryId?: string;
  images?: string[];
  stock?: number;
  status?: string;
}
