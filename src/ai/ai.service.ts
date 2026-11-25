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
      select: ['maNV', 'hoTen'],
    });

    const matchedEmp = allEmployees.find((nv) =>
      question.toLowerCase().includes(nv.hoTen.toLowerCase()),
    );
    const targetMaNV = matchedEmp ? matchedEmp.maNV : employeeId;

    const [nhanVien, tongChamCong, tongNghiPhep, chamCongGanNhat, nghiPhepGanNhat] =
      await Promise.all([
        this.nhanVienRepo.findOne({
          where: { maNV: targetMaNV },
          relations: ['phongBan'],
          select: {
            maNV: true,
            hoTen: true,
            phongBan: { maPB: true, tenPhong: true },
          },
        }),
        this.chamCongRepo.count({
          where: { nhanVien: { maNV: targetMaNV } },
        }),
        this.nghiPhepRepo.count({
          where: { nhanVien: { maNV: targetMaNV } },
        }),
        this.chamCongRepo.findOne({
          where: { nhanVien: { maNV: targetMaNV } },
          select: ['maCC', 'ngayTao', 'trangThai'],
          order: { ngayTao: 'DESC' },
        }),
        this.nghiPhepRepo.findOne({
          where: { nhanVien: { maNV: targetMaNV } },
          select: ['maDon', 'ngayTao', 'trangThai', 'ngayBatDau', 'ngayKetThuc'],
          order: { ngayTao: 'DESC' },
        }),
      ]);

    if (!nhanVien) {
      return `❌ Không tìm thấy thông tin về ${
        matchedEmp?.hoTen || 'nhân viên'
      } trong hệ thống.`;
    }

    const context = `
Thông tin nhân viên:
- Họ tên: ${nhanVien.hoTen}
- Phòng ban: ${nhanVien.phongBan?.tenPhong || 'Chưa có'}
- Tổng số lần chấm công: ${tongChamCong}
- Tổng số đơn nghỉ phép: ${tongNghiPhep}
- Lần chấm công gần nhất: ${
      chamCongGanNhat
        ? new Date(chamCongGanNhat.ngayTao).toLocaleString('vi-VN')
        : 'Không có'
    }
- Trạng thái chấm công gần nhất: ${
      chamCongGanNhat?.trangThai || 'Không có dữ liệu'
    }
- Nghỉ phép gần nhất: ${
      nghiPhepGanNhat
        ? `${nghiPhepGanNhat.trangThai} (từ ${new Date(
            nghiPhepGanNhat.ngayBatDau,
          ).toLocaleDateString('vi-VN')} đến ${new Date(
            nghiPhepGanNhat.ngayKetThuc,
          ).toLocaleDateString('vi-VN')})`
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
    const [allEmployees, ccCounts, npCounts] = await Promise.all([
      this.nhanVienRepo.find({
        relations: ['phongBan'],
        select: {
          maNV: true,
          hoTen: true,
          phongBan: { maPB: true, tenPhong: true },
        },
      }),
      this.chamCongRepo
        .createQueryBuilder('cc')
        .select('cc.maNV', 'maNV')
        .addSelect('COUNT(cc.maCC)', 'cnt')
        .groupBy('cc.maNV')
        .getRawMany<{ maNV: number; cnt: string }>(),
      this.nghiPhepRepo
        .createQueryBuilder('np')
        .select('np.maNV', 'maNV')
        .addSelect('COUNT(np.maDon)', 'cnt')
        .groupBy('np.maNV')
        .getRawMany<{ maNV: number; cnt: string }>(),
    ]);

    const ccMap = new Map(ccCounts.map((r) => [Number(r.maNV), Number(r.cnt)]));
    const npMap = new Map(npCounts.map((r) => [Number(r.maNV), Number(r.cnt)]));

    const context = allEmployees
      .map(
        (nv) => `
👤 ${nv.hoTen} (${nv.phongBan?.tenPhong || 'Chưa có phòng ban'}):
- Số lần chấm công: ${ccMap.get(nv.maNV) || 0}
- Số đơn nghỉ phép: ${npMap.get(nv.maNV) || 0}`,
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
    const [nhanVien, tongChamCong, tongNghi, chamCongGanNhat, nghiPhepGanNhat] =
      await Promise.all([
        this.nhanVienRepo.findOne({
          where: { maNV: employeeId },
          relations: ['phongBan'],
          select: {
            maNV: true,
            hoTen: true,
            phongBan: { maPB: true, tenPhong: true },
          },
        }),
        this.chamCongRepo.count({
          where: { nhanVien: { maNV: employeeId } },
        }),
        this.nghiPhepRepo.count({
          where: { nhanVien: { maNV: employeeId } },
        }),
        this.chamCongRepo.findOne({
          where: { nhanVien: { maNV: employeeId } },
          select: ['maCC', 'ngayTao', 'trangThai'],
          order: { ngayTao: 'DESC' },
        }),
        this.nghiPhepRepo.findOne({
          where: { nhanVien: { maNV: employeeId } },
          select: ['maDon', 'ngayTao', 'trangThai', 'ngayBatDau', 'ngayKetThuc'],
          order: { ngayTao: 'DESC' },
        }),
      ]);

    if (!nhanVien) {
      return `Không tìm thấy nhân viên có mã ${employeeId}`;
    }

    const context = `
Tóm tắt dữ liệu nhân viên:
- Họ tên: ${nhanVien.hoTen}
- Phòng ban: ${nhanVien.phongBan?.tenPhong || 'Chưa có'}
- Tổng số lần chấm công: ${tongChamCong}
- Tổng số đơn nghỉ phép: ${tongNghi}
- Lần chấm công gần nhất: ${
      chamCongGanNhat
        ? new Date(chamCongGanNhat.ngayTao).toLocaleString('vi-VN')
        : 'Không có'
    }
- Trạng thái chấm công gần nhất: ${chamCongGanNhat?.trangThai || 'Không có'}
- Nghỉ phép gần nhất: ${
      nghiPhepGanNhat
        ? `${nghiPhepGanNhat.trangThai} (từ ${new Date(
            nghiPhepGanNhat.ngayBatDau,
          ).toLocaleDateString('vi-VN')} đến ${new Date(
            nghiPhepGanNhat.ngayKetThuc,
          ).toLocaleDateString('vi-VN')})`
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
    const [employees, ccCounts, npCounts] = await Promise.all([
      this.nhanVienRepo.find({
        relations: ['phongBan'],
        select: {
          maNV: true,
          hoTen: true,
          phongBan: { maPB: true, tenPhong: true },
        },
      }),
      this.chamCongRepo
        .createQueryBuilder('cc')
        .select('cc.maNV', 'maNV')
        .addSelect('COUNT(cc.maCC)', 'cnt')
        .groupBy('cc.maNV')
        .getRawMany<{ maNV: number; cnt: string }>(),
      this.nghiPhepRepo
        .createQueryBuilder('np')
        .select('np.maNV', 'maNV')
        .addSelect('COUNT(np.maDon)', 'cnt')
        .groupBy('np.maNV')
        .getRawMany<{ maNV: number; cnt: string }>(),
    ]);

    if (employees.length === 0) return 'Không có nhân viên nào trong hệ thống.';

    const ccMap = new Map(ccCounts.map((r) => [Number(r.maNV), Number(r.cnt)]));
    const npMap = new Map(npCounts.map((r) => [Number(r.maNV), Number(r.cnt)]));

    const summaryText = employees
      .map(
        (nv) => `
👤 ${nv.hoTen} (${nv.phongBan?.tenPhong || 'Không rõ'}):
- Chấm công: ${ccMap.get(nv.maNV) || 0} lần
- Nghỉ phép: ${npMap.get(nv.maNV) || 0} đơn`,
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
