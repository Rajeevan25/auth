import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { UserRepository } from './user.repository';
import { TokenRepository } from './token.repository';

@Module({
  controllers: [AuthController],
  providers: [
    AuthGuard,
    AuthService,
    TokenService,
    UserRepository,
    TokenRepository,
  ],
  exports: [AuthGuard, AuthService, TokenService, UserRepository],
})
export class AuthModule {}
