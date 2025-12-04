import { Module } from '@nestjs/common';
import { ServiceService } from './service.service';
import { ServiceController } from './service.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module'; // Import CloudinaryModule

@Module({
  imports: [CloudinaryModule], // Import CloudinaryModule here
  providers: [ServiceService],
  controllers: [ServiceController],
  exports: [ServiceService] // Export ServiceService
})
export class ServiceModule {}
