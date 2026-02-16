import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { NhanVien } from 'src/nhanvien/entities/nhanvien.entity';

@Entity('luong')
@Unique(['nhanVien', 'thang']) // 🔹 Ràng buộc: 1 nhân viên chỉ có 1 bản lương mỗi tháng
export class Luong {
  @PrimaryGeneratedColumn()
  maLuong: number;

  @ManyToOne(() => NhanVien, (nv) => nv.luong, {
    eager: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'maNV' })
  nhanVien: NhanVien;

  @Column({ type: 'varchar', length: 10 })
  thang: string; // Ví dụ: "2025-11"

  @Column({ type: 'float', default: 0 })
  tongGioLam: number;

  @Column({ type: 'float', default: 0 })
  luongCoBan: number;

  @Column({ type: 'float', default: 0 })
  thuong: number;

  @Column({ type: 'float', default: 0 })
  phat: number;

  @Column({ type: 'float', default: 0 })
  lamThem: number;

  @Column({ type: 'float', default: 0 })
  tongLuong: number;

  @Column({ default: 'chua-tra' }) // chua-tra | da-tra
  trangThai: string;

  @CreateDateColumn()
  ngayTao: Date;
}
