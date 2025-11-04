import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /**
   * Chat trực tiếp với AI (hỏi tự do)
   * POST /ai/chat
   */
  @Post('chat')
  async chat(@Body() body: { employeeId: number; question: string }) {
    return {
      reply: await this.aiService.askAI(body.employeeId, body.question),
    };
  }

  /**
   * Tóm tắt tình trạng làm việc / chấm công / nghỉ phép
   * POST /ai/summarize
   */
  @Post('summarize')
  async summarize(@Body() body: { employeeId: number }) {
    return {
      summary: await this.aiService.summarizeEmployee(body.employeeId),
    };
  }
}
