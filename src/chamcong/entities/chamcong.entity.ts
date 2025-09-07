import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { NhanVien } from 'src/nhanvien/entities/nhanvien.entity';
import { CaLamViec } from 'src/calamviec/entities/calamviec.entity';

@Entity('chamCong')
export class ChamCong {
  @PrimaryGeneratedColumn()
  maCC: number;

  @ManyToOne(() => NhanVien, (nv) => nv.chamCong)
  @JoinColumn({ name: 'maNV' })
  nhanVien: NhanVien;

  @ManyToOne(() => CaLamViec, (ca) => ca.chamCong)
  @JoinColumn({ name: 'maCa' })
  caLamViec: CaLamViec;

  @Column({ type: 'datetime', nullable: true })
  gioVao: Date;

  @Column({ type: 'datetime', nullable: true })
  gioRa: Date;

  @Column({ type: 'float', nullable: true, default: null })
  soGioLam: number | null;

  /**
   * hop-le | tre | ve-som | tre-va-ve-som
   */
  @Column({ default: 'chua-xac-nhan' })
  trangThai: string;

  @Column({ default: 'faceid' }) // faceid | manual
  hinhThuc: string;

  @CreateDateColumn()
  ngayTao: Date;

  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  latitude?: number;

  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  longitude?: number;

}
