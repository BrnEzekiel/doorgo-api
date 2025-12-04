import { Module } from '@nestjs/common';
import { ServiceCategoryService } from './service-category.service';
import { ServiceCategoryController } from './service-category.controller';

@Module({
  providers: [ServiceCategoryService],
  controllers: [ServiceCategoryController],
  exports: [ServiceCategoryService] // Export ServiceCategoryService
})
export class ServiceCategoryModule {}
