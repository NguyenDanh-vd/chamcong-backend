import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  JoinColumn, 
  CreateDateColumn, 
  Index 
} from 'typeorm';
import { NhanVien } from 'src/nhanvien/entities/nhanvien.entity';

@Entity('facedata')
export class FaceData {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  maNV: number;

  @ManyToOne(() => NhanVien, (nv) => nv.faceData, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'maNV' })
  nhanVien: NhanVien;

  // ✅ Dùng kiểu jsonb để lưu mảng số nhận diện khuôn mặt
  @Column({ type: 'jsonb' })
  faceDescriptor: number[];

  @CreateDateColumn()
  ngayTao: Date;
}
