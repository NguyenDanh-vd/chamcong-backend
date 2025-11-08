import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { NghiPhep } from 'src/nghi-phep/entities/nghi-phep.entity';
import { ChamCong } from 'src/chamcong/entities/chamcong.entity';
import { LamThem } from 'src/lam-them/entities/lam-them.entity';
import { PhongBan } from 'src/phongban/entities/phongban.entity';
import { FaceData } from 'src/face-data/entities/face-data.entity';
import { Luong } from 'src/luong/entities/luong.entity';

import { VaiTro } from '../enums/vai-tro.enum';
@Entity({ name: 'nhanvien', schema: 'public' })
export class NhanVien {
  @PrimaryGeneratedColumn({ name: 'maNV' })
  maNV: number;

  @Column({ length: 100 })
  hoTen: string;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column({ length: 20, nullable: true })
  soDienThoai?: string;

  @Column({ type: 'text', nullable: true }) 
  diaChi: string;
  
  @Column()
  matKhau: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ length: 20, unique: true, nullable: true })
  cccd?: string;

  @Column({ type: 'date', nullable: true })
  ngayBatDau?: Date;

  @Column({ type: 'enum', enum: ['Nam', 'Nữ', 'Khác'], nullable: true })
  gioiTinh?: 'Nam' | 'Nữ' | 'Khác';

  @Column({ type: 'int', nullable: true })
  tuoi?: number;
  
  @Column({
    type: 'enum',
    enum: VaiTro,
    default: VaiTro.NHANVIEN,
  })
  vaiTro: VaiTro;

  @ManyToOne(() => PhongBan, (pb) => pb.nhanViens, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'maPB' })
  phongBan?: PhongBan;

  @OneToMany(() => NghiPhep, (np) => np.nhanVien)
  nghiPhep: NghiPhep[];

  @OneToMany(() => ChamCong, (cc) => cc.nhanVien)
  chamCong: ChamCong[];

  @OneToMany(() => LamThem, (lt) => lt.nhanVien)
  lamThem: LamThem[];

  @OneToMany(() => FaceData, (fd) => fd.nhanVien)
  faceData: FaceData[];

  @CreateDateColumn()
  ngayTao: Date;
  @OneToMany(() => Luong, (luong) => luong.nhanVien)
  luong: Luong[];

  @Column({ type: 'float', nullable: true, default: 10000000 })
  luongCoBan: number;

  @Column({ type: 'float', nullable: true, default: 30000 })
  luongTheoGio: number;
}
