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

import { VaiTro } from '../enums/vai-tro.enum';
@Entity('nhanvien')
export class NhanVien {
  @PrimaryGeneratedColumn({ name: 'maNV' })
  maNV: number;

  @Column({ length: 100 })
  hoTen: string;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column({ length: 20, nullable: true })
  soDienThoai?: string;

  @Column({ type: 'text', nullable: true }) // Kiểu 'text' cho địa chỉ dài
  diaChi: string;
  
  @Column()
  matKhau: string;

  @Column({ nullable: true })
  avatar?: string;

  // 👇 Thêm CCCD
  @Column({ length: 20, unique: true, nullable: true })
  cccd?: string;

  // 👇 Thêm ngày bắt đầu làm việc
  @Column({ type: 'date', nullable: true })
  ngayBatDau?: Date;

  // ✅ Thêm giới tính
  @Column({ type: 'enum', enum: ['Nam', 'Nữ', 'Khác'], nullable: true })
  gioiTinh?: 'Nam' | 'Nữ' | 'Khác';

  // ✅ Thêm tuổi
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
}
