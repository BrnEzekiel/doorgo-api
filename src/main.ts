import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter'; // Import the filter

async function bootstrap() {
  console.log('--- DATABASE_URL:', process.env.DATABASE_URL); // Diagnostic log
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalFilters(new HttpExceptionFilter()); // Apply the global filter
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
