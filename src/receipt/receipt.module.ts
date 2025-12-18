import { Module } from '@nestjs/common';
import { ReceiptService } from './receipt.service';
import { PrismaModule } from '../prisma/prisma.module'; // Import PrismaModule
import { CloudinaryModule } from '../cloudinary/cloudinary.module'; // Import CloudinaryModule

@Module({
  imports: [PrismaModule, CloudinaryModule], // Import PrismaModule and CloudinaryModule
  providers: [ReceiptService],
  exports: [ReceiptService], // Export ReceiptService to be used in other modules
})
export class ReceiptModule {}
