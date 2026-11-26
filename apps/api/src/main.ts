import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import { AppModule } from './app.module';
import { AppErrorFilter } from './common/filters/app-error.filter';
import { env } from './config/env.config';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  await app.register(helmet);
  await app.register(fastifyCookie);

  app.enableCors({
    origin: env.FRONTEND_URL,
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.useGlobalFilters(new AppErrorFilter());

  await app.listen(env.PORT, '0.0.0.0');
}

bootstrap();
