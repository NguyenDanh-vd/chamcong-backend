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

  // ===============================
  // HÀM CHÍNH: hỏi AI
  // ===============================
  async askAI(employeeId: number, question: string): Promise<string> {
    // Lấy thông tin nhân viên
    const nhanVien = await this.nhanVienRepo.findOne({
      where: { maNV: employeeId },
      relations: ['chamCong', 'nghiPhep'],
    });

    if (!nhanVien) {
      return `Không tìm thấy nhân viên có mã ${employeeId}`;
    }

    // Lấy dữ liệu chấm công & nghỉ phép mới nhất
    const chamCongGanNhat = await this.chamCongRepo.findOne({
      where: { nhanVien: { maNV: employeeId } },
      order: { ngayTao: 'DESC' },
    });

    const nghiPhepGanNhat = await this.nghiPhepRepo.findOne({
      where: { nhanVien: { maNV: employeeId } },
      order: { ngayTao: 'DESC' },
    });

    // Tạo ngữ cảnh để GPT hiểu
    const context = `
Thông tin nhân viên:
- Họ tên: ${nhanVien.hoTen}
- Email: ${nhanVien.email}
- Phòng ban: ${nhanVien.phongBan ? nhanVien.phongBan.tenPhong : 'Chưa có'}
- Trạng thái gần nhất:
    - Chấm công: ${chamCongGanNhat ? chamCongGanNhat.trangThai : 'Chưa có dữ liệu'}
    - Ngày chấm công: ${chamCongGanNhat ? chamCongGanNhat.ngayTao.toLocaleString('vi-VN') : 'Không có'}
    - Nghỉ phép gần nhất: ${nghiPhepGanNhat ? nghiPhepGanNhat.trangThai : 'Không có đơn nghỉ'}
    - Từ ${nghiPhepGanNhat?.ngayBatDau || ''} đến ${nghiPhepGanNhat?.ngayKetThuc || ''}
`;

    // Gửi lên GPT xử lý
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini', // nhẹ, nhanh, rẻ
      messages: [
        {
          role: 'system',
          content:
            'Bạn là trợ lý AI của hệ thống chấm công ITGlobal+. Trả lời ngắn gọn, chính xác, bằng tiếng Việt.',
        },
        { role: 'user', content: `${context}\n\nCâu hỏi: ${question}` },
      ],
      temperature: 0.4,
    });

    return response.choices[0].message.content || 'Không có phản hồi từ AI.';
  }
    // ===============================
   // HÀM TÓM TẮT TRẠNG THÁI NHÂN VIÊN
  // ===============================
   async summarizeEmployee(employeeId: number): Promise<string> {
     const nhanVien = await this.nhanVienRepo.findOne({
         where: { maNV: employeeId },
         relations: ['chamCong', 'nghiPhep'],
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
              - Phòng ban: ${nhanVien.phongBan ? nhanVien.phongBan.tenPhong : 'Chưa có'}
              - Tổng số lần chấm công: ${tongChamCong}
              - Tổng số đơn nghỉ phép: ${tongNghi}
              - Lần chấm công gần nhất: ${chamCongGanNhat ? chamCongGanNhat.ngayTao.toLocaleString('vi-VN') : 'Không có'}
              - Trạng thái chấm công gần nhất: ${chamCongGanNhat ? chamCongGanNhat.trangThai : 'Không có'}
              - Nghỉ phép gần nhất: ${nghiPhepGanNhat ? nghiPhepGanNhat.trangThai : 'Không có'}
            `;

            const response = await this.openai.chat.completions.create({
               model: 'gpt-4o-mini',
               messages: [
                    {
                       role: 'system',
                       content:
                       'Bạn là trợ lý AI của hệ thống chấm công ITGlobal+. Hãy tóm tắt dữ liệu nhân viên một cách ngắn gọn, thân thiện và dễ hiểu bằng tiếng Việt.',
                    },
                 { role: 'user', content: context },
                ],
               temperature: 0.3,
            });

            return response.choices[0].message.content || 'Không có dữ liệu.';
    }
}
