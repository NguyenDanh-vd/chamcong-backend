import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /**
   * 💬 Chat trực tiếp với AI (tự do hoặc theo nhân viên)
   * POST /ai/chat
   */
  @Post('chat')
  async chat(
    @Body()
    body: {
      employeeId?: number;
      question: string;
      role: string; // 👈 Phân quyền: 'quantrivien' hoặc 'nhanvien'
      targetId?: number; // 👈 Quản trị viên có thể hỏi về nhân viên khác
    },
  ) {
    const { employeeId, question, role, targetId } = body;

    if (!question?.trim()) {
      throw new BadRequestException('Thiếu nội dung câu hỏi');
    }

    // 👑 Quản trị viên hỏi về 1 nhân viên cụ thể
    if (role === 'quantrivien' && targetId) {
      return {
        reply: await this.aiService.askAI(targetId, question),
      };
    }

    // 👑 Quản trị viên hỏi tổng quát (không target cụ thể)
    if (role === 'quantrivien' && !targetId) {
      return {
        reply: await this.aiService.askAIOverview(question),
      };
    }

    // 👤 Nhân viên thường chỉ hỏi về bản thân
    if (employeeId) {
      return {
        reply: await this.aiService.askAI(employeeId, question),
      };
    }

    throw new BadRequestException('Thiếu thông tin nhân viên hoặc quyền truy cập không hợp lệ');
  }

  /**
   * 📊 Tóm tắt tình trạng chấm công / nghỉ phép
   * POST /ai/summarize
   */
  @Post('summarize')
  async summarize(
    @Body()
    body: {
      employeeId?: number;
      role: string;
      targetId?: number;
    },
  ) {
    const { employeeId, role, targetId } = body;

    // 👑 Quản trị viên xem toàn bộ nhân viên
    if (role === 'quantrivien' && !targetId) {
      return {
        summary: await this.aiService.summarizeAllEmployees(),
      };
    }

    // 👑 Quản trị viên tóm tắt 1 nhân viên cụ thể
    if (role === 'quantrivien' && targetId) {
      return {
        summary: await this.aiService.summarizeEmployee(targetId),
      };
    }

    // 👤 Nhân viên thường xem bản thân
    if (employeeId) {
      return {
        summary: await this.aiService.summarizeEmployee(employeeId),
      };
    }

    throw new BadRequestException('Thiếu thông tin nhân viên để tóm tắt');
  }
}
