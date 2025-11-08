import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Luong } from './entities/luong.entity';
import { ChamCong } from 'src/chamcong/entities/chamcong.entity';
import { NhanVien } from 'src/nhanvien/entities/nhanvien.entity';
import { UpdateLuongDto } from './dto/update-luong.dto';

@Injectable()
export class LuongService {
  constructor(
    @InjectRepository(Luong)
    private luongRepository: Repository<Luong>,

    @InjectRepository(ChamCong)
    private chamCongRepository: Repository<ChamCong>,

    @InjectRepository(NhanVien)
    private nhanVienRepository: Repository<NhanVien>,
  ) {}

  // 📄 Lấy danh sách lương
  async findAll(): Promise<Luong[]> {
    return this.luongRepository.find({
      relations: ['nhanVien'],
      order: {
        nhanVien: {
          maNV: 'ASC', // 🔹 sắp xếp theo mã nhân viên
        },
      },
    });
  }

  // ⚙️ Tính lương tự động dựa trên chấm công (chỉ tạo 1 bản/tháng/nhân viên)
  async tinhLuongTuDong(thang: string) {
    const nhanVienList = await this.nhanVienRepository.find({
      relations: ['luong'],
    });
    const chamCongList = await this.chamCongRepository.find({
      relations: ['nhanVien'],
    });

    let tongLuongHeThong = 0;

    for (const nv of nhanVienList) {
      // ✅ Lọc chấm công đúng tháng
      const chamCongNV = chamCongList.filter(
        (c) =>
          c.nhanVien.maNV === nv.maNV &&
          c.gioVao &&
          c.gioRa &&
          c.gioVao.getMonth() + 1 === Number(thang.split('-')[1]) &&
          c.gioVao.getFullYear() === Number(thang.split('-')[0]),
      );

      const tongGio = chamCongNV.reduce(
        (tong, item) => tong + (item.soGioLam || 0),
        0,
      );

      const luongCoBan = nv.luongCoBan || 10000000;
      const luongTheoGio = nv.luongTheoGio || 30000;

      const thuong = tongGio > 160 ? 500000 : 0;
      const phat = tongGio < 150 ? 300000 : 0;
      const lamThem = 0;

      const tongLuong =
        luongCoBan + tongGio * luongTheoGio + thuong - phat + lamThem;

      tongLuongHeThong += tongLuong;

      // ✅ Kiểm tra xem đã có lương tháng này chưa
      const existingLuong = await this.luongRepository.findOne({
        where: {
          nhanVien: { maNV: nv.maNV },
          thang,
        },
        relations: ['nhanVien'],
      });

      if (existingLuong) {
        // 🔹 Cập nhật lương cũ
        existingLuong.tongGioLam = tongGio;
        existingLuong.luongCoBan = luongCoBan;
        existingLuong.thuong = thuong;
        existingLuong.phat = phat;
        existingLuong.lamThem = lamThem;
        existingLuong.tongLuong = tongLuong;

        await this.luongRepository.save(existingLuong);
      } else {
        // 🔹 Tạo mới nếu chưa có
        const luong = this.luongRepository.create({
          nhanVien: nv,
          thang,
          tongGioLam: tongGio,
          luongCoBan,
          thuong,
          phat,
          lamThem,
          tongLuong,
          trangThai: 'chua-tra',
        });

        await this.luongRepository.save(luong);
      }
    }

    return {
      message: 'Đã tính hoặc cập nhật lương tháng thành công',
      tongLuongHeThong,
    };
  }

  // 🟡 Cập nhật trạng thái lương
  async capNhatTrangThai(maLuong: number, trangThai: string) {
    await this.luongRepository.update(maLuong, { trangThai });
    return { message: 'Cập nhật trạng thái thành công' };
  }

  // ✅ Đánh dấu “ĐÃ TRẢ LƯƠNG”
  async updateDaTra(maLuong: number) {
    const luong = await this.luongRepository.findOne({ where: { maLuong } });
    if (!luong) throw new NotFoundException('Không tìm thấy bản ghi lương');

    luong.trangThai = 'da-tra';
    return this.luongRepository.save(luong);
  }

  // ✏️ Chỉnh sửa lương (lương cơ bản, thưởng, phạt, làm thêm, trạng thái)
  async chinhSuaLuong(maLuong: number, data: UpdateLuongDto) {
    const luong = await this.luongRepository.findOne({
      where: { maLuong },
      relations: ['nhanVien'], // ✅ Cần load để tính lại đúng
    });

    if (!luong) throw new NotFoundException('Không tìm thấy bản ghi lương');

    // ✅ Cập nhật dữ liệu có trong request
    if (data.luongCoBan !== undefined) luong.luongCoBan = data.luongCoBan;
    if (data.thuong !== undefined) luong.thuong = data.thuong;
    if (data.phat !== undefined) luong.phat = data.phat;
    if (data.lamThem !== undefined) luong.lamThem = data.lamThem;
    if (data.trangThai !== undefined) luong.trangThai = data.trangThai;

    // 🔹 Tự động tính lại tổng lương
    const luongTheoGio = luong.nhanVien?.luongTheoGio || 30000;

    luong.tongLuong =
      (luong.luongCoBan || 0) +
      (luong.tongGioLam || 0) * luongTheoGio +
      (luong.thuong || 0) -
      (luong.phat || 0) +
      (luong.lamThem || 0);

    await this.luongRepository.save(luong);

    return { message: 'Cập nhật lương thành công', luong };
  }
}
