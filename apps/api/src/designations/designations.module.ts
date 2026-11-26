import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DesignationsController } from './designations.controller';
import { DesignationsRepository } from './designations.repository';
import { DesignationsService } from './designations.service';

@Module({
  imports: [AuthModule],
  controllers: [DesignationsController],
  providers: [DesignationsService, DesignationsRepository],
  exports: [DesignationsService, DesignationsRepository],
})
export class DesignationsModule {}
