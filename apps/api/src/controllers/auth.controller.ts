import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { tokenService, REFRESH_COOKIE_NAME } from '../services/token.service';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, name, password } = req.body;
      const result = await authService.register({ email, name, password });

      tokenService.setAuthCookies(res, result.tokens);

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, rememberMe } = req.body;
      const result = await authService.login({ email, password, rememberMe });

      tokenService.setAuthCookies(res, result.tokens);

      res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
      await authService.logout(rawRefreshToken);
      tokenService.clearAuthCookies(res);

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
      const result = await authService.refresh(rawRefreshToken);

      tokenService.setAuthCookies(res, result.newTokens);

      res.status(200).json({
        success: true,
        message: 'Session refreshed successfully',
        user: result.user,
      });
    } catch (error) {
      // Clear cookies if refresh fails so client is in clean state
      tokenService.clearAuthCookies(res);
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const user = await authService.getMe(req.user.userId);

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password } = req.body;
      const result = await authService.resetPassword(token, password);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  // OAuth stubs (Google / GitHub)
  async oauthGoogleStub(_req: Request, res: Response): Promise<void> {
    res.status(501).json({
      success: false,
      message: 'OAuth Google route is a stub ready for passport or Arctic integration.',
      todo: 'Configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, handle callback redirect',
    });
  }

  async oauthGithubStub(_req: Request, res: Response): Promise<void> {
    res.status(501).json({
      success: false,
      message: 'OAuth GitHub route is a stub ready for passport or Arctic integration.',
      todo: 'Configure GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET, handle callback redirect',
    });
  }
}

export const authController = new AuthController();

