import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { NhanVien } from 'src/nhanvien/entities/nhanvien.entity';

@Entity('lamThem')
export class LamThem {
  @PrimaryGeneratedColumn()
  maLT: number;

  @ManyToOne(() => NhanVien, (nv) => nv.lamThem)
  @JoinColumn({ name: 'maNV' })
  nhanVien: NhanVien;

  @Column({ type: 'date' })
  ngayLT: Date;

  @Column({ type: 'time' })
  gioBatDau: string;

  @Column({ type: 'time' })
  gioKetThuc: string;

  @Column({ type: 'int' })
  soGio: number;

  @Column({ nullable: true })
  ghiChu: string;

  @Column({ default: 'cho-duyet' }) // cho-duyet | da-duyet | tu-choi
  trangThai: string;

  @CreateDateColumn()
  ngayTao: Date;
}
