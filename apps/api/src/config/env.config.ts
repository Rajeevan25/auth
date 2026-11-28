import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('5000').transform(Number),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/auth_db?schema=public'),
  JWT_ACCESS_SECRET: z.string().min(16).default('dev_jwt_access_secret_key_super_secure_random_string_12345'),
  JWT_REFRESH_SECRET: z.string().min(16).default('dev_jwt_refresh_secret_key_super_secure_random_string_67890'),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION_DAYS: z.string().default('7').transform(Number),
  JWT_REFRESH_REMEMBER_ME_DAYS: z.string().default('30').transform(Number),
  PASSWORD_RESET_EXPIRATION_MINUTES: z.string().default('60').transform(Number),
  MAIL_HOST: z.string().optional(),
  MAIL_PORT: z.string().default('587').transform(Number),
  MAIL_USERNAME: z.string().optional(),
  MAIL_PASSWORD: z.string().optional(),
  MAIL_FROM: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  throw new Error('Invalid environment configuration');
}

export const env = parsed.data;

