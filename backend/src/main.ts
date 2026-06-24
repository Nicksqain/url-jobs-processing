import * as fs from 'fs';
import * as path from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors();

  // * Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('URL Checker API')
    .setVersion('1.0')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  fs.writeFileSync(
    path.join(__dirname, '../../swagger.json'),
    JSON.stringify(document, null, 2)
  );
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
