import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { NhanVien } from 'src/nhanvien/entities/nhanvien.entity';

@Entity('nghiPhep')
@Index(['ngayBatDau', 'ngayKetThuc'])
@Index(['trangThai'])
export class NghiPhep {
  @PrimaryGeneratedColumn()
  maDon: number;

  @ManyToOne(() => NhanVien, (nv) => nv.nghiPhep)
  @JoinColumn({ name: 'maNV' })
  nhanVien: NhanVien;

  @Column({ type: 'date' })
  ngayBatDau: Date;

  @Column({ type: 'date' })
  ngayKetThuc: Date;

  @Column()
  lyDo: string;

  @Column({ default: 'cho-duyet' }) // cho-duyet | da-duyet | tu-choi
  trangThai: string;

  @CreateDateColumn()
  ngayTao: Date;
}
