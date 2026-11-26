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
import { AuthService } from './auth.service';
import { TokenService, REFRESH_COOKIE_NAME } from './token.service';
import { AuthGuard, AuthenticatedRequest } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: { email: string; password: string; rememberMe?: boolean },
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const result = await this.authService.login({
      email: body.email,
      password: body.password,
      rememberMe: body.rememberMe ?? false,
    });
    this.tokenService.setAuthCookies(res, result.tokens);

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
    await this.authService.logout(rawRefreshToken);
    this.tokenService.clearAuthCookies(res);

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
      const result = await this.authService.refresh(rawRefreshToken);
      this.tokenService.setAuthCookies(res, result.newTokens);

      return {
        success: true,
        message: 'Session refreshed successfully',
        user: result.user,
      };
    } catch (error) {
      this.tokenService.clearAuthCookies(res);
      throw error;
    }
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getMe(@Req() req: AuthenticatedRequest) {
    if (!req.user?.userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    const user = await this.authService.getMe(req.user.userId);
    return {
      success: true,
      user,
    };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: { email: string }) {
    const result = await this.authService.forgotPassword(body.email);
    return {
      success: true,
      message: result.message,
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: { token: string; password: string }) {
    const result = await this.authService.resetPassword(body.token, body.password);
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
