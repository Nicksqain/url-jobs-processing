import { ApiProperty } from '@nestjs/swagger';

export class UrlResultDto {
  @ApiProperty({ example: 'https://google.com', description: 'Проверяемый URL-адрес' })
  url!: string;

  @ApiProperty({ 
    example: 'success', 
    enum: ['pending', 'in_progress', 'success', 'error', 'cancelled'],
    description: 'Текущий статус обработки конкретного URL'
  })
  status!: string;

  @ApiProperty({ example: 200, required: false, description: 'HTTP статус-код ответа сервера' })
  httpStatus?: number;

  @ApiProperty({ example: 'Timeout error', required: false, description: 'Текст ошибки, если запрос упал' })
  error?: string;

  @ApiProperty({ example: 450, required: false, description: 'Время ответа сервера в миллисекундах' })
  duration?: number;

  @ApiProperty({ example: '2026-06-25T02:01:33.000Z', required: false, description: 'Время начала проверки URL' })
  startedAt?: string;

  @ApiProperty({ example: '2026-06-25T02:01:35.000Z', required: false, description: 'Время завершения проверки URL' })
  finishedAt?: string;
}