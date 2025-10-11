import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ 
    summary: 'Health check',
    description: 'Check if the API is running and responsive',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'API is healthy',
    schema: {
      example: { status: 'ok', timestamp: '2025-10-11T14:11:20.616Z' },
    },
  })
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}

