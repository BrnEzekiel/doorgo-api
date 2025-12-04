import { Module } from '@nestjs/common';
import { HostelService } from './hostel.service';
import { HostelController } from './hostel.controller';
import { UserModule } from '../user/user.module'; // Import UserModule

@Module({
  imports: [UserModule], // Import UserModule here
  providers: [HostelService],
  controllers: [HostelController],
  exports: [HostelService] // Export HostelService
})
export class HostelModule {}
