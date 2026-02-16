import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChamCong } from 'src/chamcong/entities/chamcong.entity';
import { NghiPhep } from 'src/nghi-phep/entities/nghi-phep.entity';
import { NhanVien } from 'src/nhanvien/entities/nhanvien.entity';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor(
    @InjectRepository(ChamCong)
    private chamCongRepo: Repository<ChamCong>,

    @InjectRepository(NghiPhep)
    private nghiPhepRepo: Repository<NghiPhep>,

    @InjectRepository(NhanVien)
    private nhanVienRepo: Repository<NhanVien>,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  // ============================================================
  // 🧠 HỎI AI — có thể hỏi về bản thân hoặc nhân viên khác
  // ============================================================
  async askAI(employeeId: number, question: string): Promise<string> {
    const allEmployees = await this.nhanVienRepo.find({
      relations: ['phongBan', 'chamCong', 'nghiPhep'],
    });

    const namesList = allEmployees.map((nv) => nv.hoTen);
    const matchedName = namesList.find((name) =>
      question.toLowerCase().includes(name.toLowerCase()),
    );

    let nhanVien: NhanVien | null = null;

    if (matchedName) {
      nhanVien =
        allEmployees.find(
          (nv) => nv.hoTen.toLowerCase() === matchedName.toLowerCase(),
        ) ?? null;
    } else {
      nhanVien =
        (await this.nhanVienRepo.findOne({
          where: { maNV: employeeId },
          relations: ['phongBan', 'chamCong', 'nghiPhep'],
        })) ?? null;
    }

    if (!nhanVien) {
      return `❌ Không tìm thấy thông tin về ${
        matchedName || 'nhân viên'
      } trong hệ thống.`;
    }

    // Lấy dữ liệu gần nhất
    const chamCongGanNhat = await this.chamCongRepo.findOne({
      where: { nhanVien: { maNV: nhanVien.maNV } },
      order: { ngayTao: 'DESC' },
    });

    const nghiPhepGanNhat = await this.nghiPhepRepo.findOne({
      where: { nhanVien: { maNV: nhanVien.maNV } },
      order: { ngayTao: 'DESC' },
    });

    const context = `
Thông tin nhân viên:
- Họ tên: ${nhanVien.hoTen}
- Phòng ban: ${nhanVien.phongBan?.tenPhong || 'Chưa có'}
- Tổng số lần chấm công: ${nhanVien.chamCong?.length || 0}
- Tổng số đơn nghỉ phép: ${nhanVien.nghiPhep?.length || 0}
- Lần chấm công gần nhất: ${
      chamCongGanNhat
        ? chamCongGanNhat.ngayTao.toLocaleString('vi-VN')
        : 'Không có'
    }
- Trạng thái chấm công gần nhất: ${
      chamCongGanNhat?.trangThai || 'Không có dữ liệu'
    }
- Nghỉ phép gần nhất: ${
      nghiPhepGanNhat
        ? `${nghiPhepGanNhat.trangThai} (từ ${nghiPhepGanNhat.ngayBatDau?.toLocaleDateString(
            'vi-VN',
          )} đến ${nghiPhepGanNhat.ngayKetThuc?.toLocaleDateString('vi-VN')})`
        : 'Không có đơn nghỉ'
    }
`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Bạn là trợ lý AI của hệ thống chấm công ITGlobal+. Hãy trả lời bằng tiếng Việt thân thiện, rõ ràng và súc tích.',
        },
        { role: 'user', content: `${context}\n\nCâu hỏi: ${question}` },
      ],
      temperature: 0.4,
    });

    return response.choices[0].message.content || 'Không có phản hồi từ AI.';
  }

  // ============================================================
  // 🌐 HỎI AI — tổng quan toàn hệ thống (quản trị viên)
  // ============================================================
  async askAIOverview(question: string): Promise<string> {
    const allEmployees = await this.nhanVienRepo.find({
      relations: ['phongBan', 'chamCong', 'nghiPhep'],
    });

    const context = allEmployees
      .map(
        (nv) => `
👤 ${nv.hoTen} (${nv.phongBan?.tenPhong || 'Chưa có phòng ban'}):
- Số lần chấm công: ${nv.chamCong?.length || 0}
- Số đơn nghỉ phép: ${nv.nghiPhep?.length || 0}`,
      )
      .join('\n');

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Bạn là trợ lý AI của hệ thống chấm công ITGlobal+. Hãy trả lời tổng hợp về toàn bộ nhân viên bằng tiếng Việt, súc tích và chuyên nghiệp.',
        },
        { role: 'user', content: `${context}\n\nCâu hỏi: ${question}` },
      ],
      temperature: 0.5,
    });

    return response.choices[0].message.content || 'Không có dữ liệu tổng hợp.';
  }

  // ============================================================
  // 📊 TÓM TẮT TRẠNG THÁI — từng nhân viên
  // ============================================================
  async summarizeEmployee(employeeId: number): Promise<string> {
    const nhanVien = await this.nhanVienRepo.findOne({
      where: { maNV: employeeId },
      relations: ['chamCong', 'nghiPhep', 'phongBan'],
    });

    if (!nhanVien) {
      return `Không tìm thấy nhân viên có mã ${employeeId}`;
    }

    const tongChamCong = nhanVien.chamCong.length;
    const tongNghi = nhanVien.nghiPhep.length;

    const chamCongGanNhat = nhanVien.chamCong.sort(
      (a, b) => +new Date(b.ngayTao) - +new Date(a.ngayTao),
    )[0];

    const nghiPhepGanNhat = nhanVien.nghiPhep.sort(
      (a, b) => +new Date(b.ngayTao) - +new Date(a.ngayTao),
    )[0];

    const context = `
Tóm tắt dữ liệu nhân viên:
- Họ tên: ${nhanVien.hoTen}
- Phòng ban: ${nhanVien.phongBan?.tenPhong || 'Chưa có'}
- Tổng số lần chấm công: ${tongChamCong}
- Tổng số đơn nghỉ phép: ${tongNghi}
- Lần chấm công gần nhất: ${
      chamCongGanNhat
        ? chamCongGanNhat.ngayTao.toLocaleString('vi-VN')
        : 'Không có'
    }
- Trạng thái chấm công gần nhất: ${chamCongGanNhat?.trangThai || 'Không có'}
- Nghỉ phép gần nhất: ${
      nghiPhepGanNhat
        ? `${nghiPhepGanNhat.trangThai} (từ ${nghiPhepGanNhat.ngayBatDau?.toLocaleDateString(
            'vi-VN',
          )} đến ${nghiPhepGanNhat.ngayKetThuc?.toLocaleDateString('vi-VN')})`
        : 'Không có'
    }
`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Bạn là trợ lý AI của hệ thống chấm công ITGlobal+. Hãy tóm tắt tình trạng làm việc của nhân viên ngắn gọn, thân thiện bằng tiếng Việt.',
        },
        { role: 'user', content: context },
      ],
      temperature: 0.3,
    });

    return response.choices[0].message.content || 'Không có dữ liệu.';
  }

  // ============================================================
  // 📈 TÓM TẮT TOÀN BỘ NHÂN VIÊN (cho quản trị viên)
  // ============================================================
  async summarizeAllEmployees(): Promise<string> {
    const employees = await this.nhanVienRepo.find({
      relations: ['chamCong', 'nghiPhep', 'phongBan'],
    });

    if (employees.length === 0) return 'Không có nhân viên nào trong hệ thống.';

    const summaryText = employees
      .map(
        (nv) => `
👤 ${nv.hoTen} (${nv.phongBan?.tenPhong || 'Không rõ'}):
- Chấm công: ${nv.chamCong?.length || 0} lần
- Nghỉ phép: ${nv.nghiPhep?.length || 0} đơn`,
      )
      .join('\n');

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Bạn là trợ lý AI của hệ thống ITGlobal+. Hãy đưa ra bản tóm tắt tổng thể tình hình làm việc của toàn bộ nhân viên, rõ ràng, ngắn gọn, và thân thiện.',
        },
        { role: 'user', content: summaryText },
      ],
      temperature: 0.4,
    });

    return response.choices[0].message.content || 'Không có dữ liệu tổng hợp.';
  }
}
