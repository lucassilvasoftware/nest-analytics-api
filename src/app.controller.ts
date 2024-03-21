import { Controller, Get, HttpCode } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello(): string {
    return JSON.stringify({ message:"Welcome to API!", environment: process.env.NODE_ENV });
  }
}
