import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { authService } from '../services/auth.service';
import { tokenService, REFRESH_COOKIE_NAME } from '../services/token.service';
import { AuthGuard, AuthenticatedRequest } from './auth.guard';

@Controller('auth')
export class AuthController {
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: { email: string; password: string; rememberMe?: boolean },
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const result = await authService.login({
      email: body.email,
      password: body.password,
      rememberMe: body.rememberMe ?? false,
    });
    tokenService.setAuthCookies(res as any, result.tokens);

    return {
      success: true,
      message: 'Logged in successfully',
      user: result.user,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    await authService.logout(rawRefreshToken);
    tokenService.clearAuthCookies(res as any);

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    try {
      const result = await authService.refresh(rawRefreshToken);
      tokenService.setAuthCookies(res as any, result.newTokens);

      return {
        success: true,
        message: 'Session refreshed successfully',
        user: result.user,
      };
    } catch (error) {
      tokenService.clearAuthCookies(res as any);
      throw error;
    }
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getMe(@Req() req: AuthenticatedRequest) {
    if (!req.user?.userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    const user = await authService.getMe(req.user.userId);
    return {
      success: true,
      user,
    };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: { email: string }) {
    const result = await authService.forgotPassword(body.email);
    return {
      success: true,
      message: result.message,
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: { token: string; password: string }) {
    const result = await authService.resetPassword(body.token, body.password);
    return {
      success: true,
      message: result.message,
    };
  }

  @Get('oauth/google')
  oauthGoogleStub() {
    return {
      success: false,
      message: 'Google OAuth is not configured yet.',
    };
  }

  @Get('oauth/github')
  oauthGithubStub() {
    return {
      success: false,
      message: 'GitHub OAuth is not configured yet.',
    };
  }
}
