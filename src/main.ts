import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express'; // Import NestExpressApplication
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter'; // Import the filter
import * as cookieParser from 'cookie-parser'; // Import cookie-parser
import { CustomLoggerService } from './common/logger/custom-logger.service'; // Import CustomLoggerService

async function bootstrap() {
  console.log('--- DATABASE_URL:', process.env.DATABASE_URL); // Diagnostic log
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
  const allowedOrigins = corsOrigin.split(',');

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });
  app.set('trust proxy', 1); // For rate limiting behind a proxy
  app.useGlobalFilters(new HttpExceptionFilter()); // Apply the global filter
  app.use(cookieParser()); // Enable cookie parsing
  app.useLogger(app.get(CustomLoggerService)); // Use custom logger
  await app.listen(process.env.PORT ?? 3002);
}
bootstrap().catch(err => {
  console.error('Unhandled error during application bootstrap:', err);
  process.exit(1);
});
