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

  // 📄 Lấy danh sách lương (chỉ lấy các cột cần thiết của nhân viên)
  async findAll(): Promise<Luong[]> {
    return this.luongRepository.find({
      relations: ['nhanVien'],
      select: {
        maLuong: true,
        thang: true,
        tongGioLam: true,
        luongCoBan: true,
        thuong: true,
        phat: true,
        lamThem: true,
        tongLuong: true,
        trangThai: true,
        ngayTao: true,
        nhanVien: {
          maNV: true,
          hoTen: true,
          email: true,
          luongCoBan: true,
          luongTheoGio: true,
        },
      },
      order: {
        nhanVien: {
          maNV: 'ASC',
        },
      },
    });
  }

  // 📄 Lấy lương của 1 nhân viên cụ thể
  async findByNhanVien(maNV: number): Promise<Luong[]> {
    return this.luongRepository.find({
      where: { nhanVien: { maNV } },
      relations: ['nhanVien'],
      select: {
        maLuong: true,
        thang: true,
        tongGioLam: true,
        luongCoBan: true,
        thuong: true,
        phat: true,
        lamThem: true,
        tongLuong: true,
        trangThai: true,
        ngayTao: true,
        nhanVien: {
          maNV: true,
          hoTen: true,
        },
      },
      order: {
        thang: 'DESC',
      },
    });
  }

  // ⚙️ Tính lương tự động dựa trên chấm công (tối ưu truy vấn theo tháng + batch save)
  async tinhLuongTuDong(thang: string) {
    const [yearStr, monthStr] = (thang || '').split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const [nhanVienList, chamCongList, existingLuongList] = await Promise.all([
      this.nhanVienRepository.find({
        select: ['maNV', 'hoTen', 'luongCoBan', 'luongTheoGio'],
      }),
      this.chamCongRepository
        .createQueryBuilder('cc')
        .leftJoin('cc.nhanVien', 'nv')
        .select(['cc.maCC', 'cc.gioVao', 'cc.gioRa', 'cc.soGioLam', 'nv.maNV'])
        .where('cc.gioVao >= :startDate AND cc.gioVao <= :endDate', {
          startDate,
          endDate,
        })
        .andWhere('cc.gioRa IS NOT NULL')
        .getMany(),
      this.luongRepository.find({
        where: { thang },
        relations: ['nhanVien'],
        select: {
          maLuong: true,
          thang: true,
          tongGioLam: true,
          luongCoBan: true,
          thuong: true,
          phat: true,
          lamThem: true,
          tongLuong: true,
          trangThai: true,
          nhanVien: {
            maNV: true,
          },
        },
      }),
    ]);

    const hoursByEmployee = new Map<number, number>();
    for (const cc of chamCongList) {
      const maNV = cc.nhanVien?.maNV;
      if (!maNV) continue;
      hoursByEmployee.set(
        maNV,
        (hoursByEmployee.get(maNV) || 0) + (cc.soGioLam || 0),
      );
    }

    const existingLuongMap = new Map<number, Luong>();
    for (const l of existingLuongList) {
      if (l.nhanVien?.maNV) {
        existingLuongMap.set(l.nhanVien.maNV, l);
      }
    }

    let tongLuongHeThong = 0;
    const recordsToSave: Luong[] = [];

    for (const nv of nhanVienList) {
      const tongGio = hoursByEmployee.get(nv.maNV) || 0;
      const luongCoBan = nv.luongCoBan || 10000000;
      const luongTheoGio = nv.luongTheoGio || 30000;

      const thuong = tongGio > 160 ? 500000 : 0;
      const phat = tongGio < 150 ? 300000 : 0;
      const lamThem = 0;

      const tongLuong =
        luongCoBan + tongGio * luongTheoGio + thuong - phat + lamThem;

      tongLuongHeThong += tongLuong;

      const existingLuong = existingLuongMap.get(nv.maNV);

      if (existingLuong) {
        existingLuong.tongGioLam = tongGio;
        existingLuong.luongCoBan = luongCoBan;
        existingLuong.thuong = thuong;
        existingLuong.phat = phat;
        existingLuong.lamThem = lamThem;
        existingLuong.tongLuong = tongLuong;
        recordsToSave.push(existingLuong);
      } else {
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
        recordsToSave.push(luong);
      }
    }

    if (recordsToSave.length > 0) {
      await this.luongRepository.save(recordsToSave);
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
