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

  @Column({ type: 'longtext' })
  faceDescriptor: string; // JSON.stringify(faceDescriptor array)

  @CreateDateColumn()
  ngayTao: Date;
}
