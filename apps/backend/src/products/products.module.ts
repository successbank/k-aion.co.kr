import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { ProductCommissionRatesController } from './product-commission-rates.controller';
import { ProductCommissionRatesService } from './product-commission-rates.service';

/**
 * 제품 및 카테고리 관리 모듈
 */
@Module({
  imports: [PrismaModule],
  controllers: [
    ProductsController,
    CategoriesController,
    ProductCommissionRatesController,
  ],
  providers: [
    ProductsService,
    CategoriesService,
    ProductCommissionRatesService,
  ],
  exports: [ProductsService, CategoriesService, ProductCommissionRatesService],
})
export class ProductsModule {}
