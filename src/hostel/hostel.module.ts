import { Module } from '@nestjs/common';
import { HostelService } from './hostel.service';
import { HostelController } from './hostel.controller';
import { UserModule } from '../user/user.module'; // Import UserModule
import { CacheConfigModule } from '../cache/cache.module'; // Import CacheConfigModule

@Module({
  imports: [UserModule, CacheConfigModule], // Import UserModule and CacheConfigModule
  providers: [HostelService],
  controllers: [HostelController],
  exports: [HostelService] // Export HostelService
})
export class HostelModule {}
