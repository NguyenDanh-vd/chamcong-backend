import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NhanVien } from './entities/nhanvien.entity';
import { PhongBan } from 'src/phongban/entities/phongban.entity';
import * as bcrypt from 'bcryptjs';
import { CreateNhanVienDto } from './dto/create-nhanvien.dto';
import { UpdateNhanvienDto } from './dto/update-nhanvien.dto';
import { VaiTro } from 'src/nhanvien/enums/vai-tro.enum';

@Injectable()
export class NhanvienService {
  constructor(
    @InjectRepository(NhanVien)
    private nvRepo: Repository<NhanVien>,
    @InjectRepository(PhongBan)
    private pbRepo: Repository<PhongBan>,
  ) {}

  async findAll(maPB?: number): Promise<NhanVien[]> {
    const query = this.nvRepo.createQueryBuilder('nv')
      .leftJoinAndSelect('nv.phongBan', 'phongBan')
      .orderBy('nv.maNV', 'ASC');

    if (maPB) {
      query.where('phongBan.maPB = :maPB', { maPB });
    }

    return query.getMany();
  }

  // --- Lấy entity đầy đủ (có mật khẩu) ---
  async findOneEntity(id: number): Promise<NhanVien> {
    const nv = await this.nvRepo.findOne({
      where: { maNV: id },
      relations: ['phongBan'],
    });
    if (!nv) throw new NotFoundException(`Không tìm thấy nhân viên id=${id}`);
    return nv;
  }

  // --- Lấy entity an toàn (ẩn mật khẩu) ---
  async findOne(id: number): Promise<Omit<NhanVien, 'matKhau'>> {
    const nv = await this.findOneEntity(id);
    const { matKhau, ...safeNv } = nv;
    return safeNv;
  }

  async findAllBasic(): Promise<{ maNV: number; hoTen: string }[]> {
    return this.nvRepo.find({
      select: ['maNV', 'hoTen'],
      order: { hoTen: 'ASC' },
    });
  }

  async create(data: CreateNhanVienDto): Promise<NhanVien> {
    const existingNhanVien = await this.nvRepo.findOne({ where: { email: data.email } });
    if (existingNhanVien) {
      throw new BadRequestException('Email đã tồn tại trong hệ thống.');
    }

    if (data.matKhau) data.matKhau = await bcrypt.hash(data.matKhau, 10);
    if (!data.vaiTro) data.vaiTro = VaiTro.NHANVIEN;

    let phongBan: PhongBan | undefined = undefined;
    if (data.maPB) {
      const pb = await this.pbRepo.findOne({ where: { maPB: data.maPB } });
      if (!pb) throw new NotFoundException(`Phòng ban id=${data.maPB} không tồn tại`);
      phongBan = pb;
    }

    const nv = this.nvRepo.create({ ...data, phongBan });
    return this.nvRepo.save(nv);
  }

  async update(id: number, data: UpdateNhanvienDto, currentUser?: any): Promise<NhanVien> {
    if (!data || typeof data !== 'object') {
      throw new BadRequestException('Dữ liệu cập nhật không hợp lệ');
    }

    const nv = await this.findOneEntity(id);

    // Kiểm tra quyền
    if (currentUser && currentUser.vaiTro !== VaiTro.QUANTRIVIEN) {
      if (currentUser.maNV !== id) {
        throw new ForbiddenException('Bạn không có quyền sửa thông tin của người khác.');
      }
      delete data.vaiTro;
      delete data.maPB;
    }

    if (data.matKhau) data.matKhau = await bcrypt.hash(data.matKhau, 10);

    if (data.maPB) {
      const pb = await this.pbRepo.findOne({ where: { maPB: data.maPB } });
      if (!pb) throw new NotFoundException(`Phòng ban id=${data.maPB} không tồn tại`);
      nv.phongBan = pb;
    }

    Object.assign(nv, data);
    return this.nvRepo.save(nv);
  }

  async updatePassword(maNV: number, oldPassword: string | undefined, newPassword: string, requestingUser: any) {
    const nv = await this.findOneEntity(maNV);
    if (!newPassword) throw new BadRequestException('Mật khẩu mới không được để trống');
    if (newPassword.length < 6) throw new BadRequestException('Mật khẩu mới ít nhất 6 ký tự');

    if (requestingUser.vaiTro !== VaiTro.QUANTRIVIEN) {
      if (requestingUser.maNV !== maNV) throw new ForbiddenException('Bạn không có quyền đổi mật khẩu cho người khác.');
      if (!oldPassword) throw new BadRequestException('Bạn phải nhập mật khẩu cũ');
      const isMatch = await bcrypt.compare(oldPassword, nv.matKhau);
      if (!isMatch) throw new BadRequestException('Mật khẩu cũ không chính xác');
    }

    nv.matKhau = await bcrypt.hash(newPassword, 10);
    await this.nvRepo.save(nv);

    return { message: 'Đổi mật khẩu thành công', maNV };
  }
  
  async resetPasswordByAdmin(id: number, newPassword: string) {
    // Dùng lại hàm có sẵn để tìm nhân viên, nếu không thấy sẽ tự báo lỗi
    const nv = await this.findOneEntity(id);

    // Băm mật khẩu mới và gán cho nhân viên
    nv.matKhau = await bcrypt.hash(newPassword, 10);

    // Lưu lại vào database
    await this.nvRepo.save(nv);

    return { message: `Đặt lại mật khẩu cho nhân viên ID ${id} thành công` };
  }

  async updateAvatar(id: number, filename: string) {
    const nv = await this.findOneEntity(id);

    if (!filename) {
      throw new BadRequestException('Không tìm thấy file upload');
    }

    nv.avatar = filename;
    await this.nvRepo.save(nv);

    return { 
      message: 'Cập nhật avatar thành công',
      // Trả về URL đầy đủ để frontend load ảnh
      avatar: `${process.env.BASE_URL || 'http://localhost:3000'}/uploads/avatars/${filename}`
    };
  }

  async remove(id: number): Promise<{ message: string }> {
    const nv = await this.findOneEntity(id);
    await this.nvRepo.remove(nv);
    return { message: `Đã xóa nhân viên id=${id}` };
  }

  async getProfile(email: string) {
  const nv = await this.nvRepo.findOne({
    where: { email },
    relations: ['phongBan'],
  });
  if (!nv) throw new NotFoundException('Không tìm thấy nhân viên');

  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const avatarUrl = nv.avatar
    ? `${baseUrl}/uploads/avatars/${nv.avatar}`
    : null;

  const { matKhau, ...safeNv } = nv;
  return { ...safeNv, avatarUrl };
}

}