import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix untuk semua REST endpoint
  app.setGlobalPrefix('api/v1');

  // Validasi DTO otomatis
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip field yang tidak ada di DTO
      forbidNonWhitelisted: true,
      transform: true, // auto-cast type dari query/param
    }),
  );

  // CORS untuk frontend Next.js
  app.enableCors({
    origin: process.env.WS_CORS_ORIGIN,
    methods: ['GET', 'POST'],
  });

  await app.listen(process.env.PORT ?? 3001);
  console.log(`Backend running on port ${process.env.PORT ?? 3001}`);
}
bootstrap();
