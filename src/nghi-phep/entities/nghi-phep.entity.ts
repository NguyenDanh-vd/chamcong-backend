import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn,OneToMany } from 'typeorm';
import { NhanVien } from 'src/nhanvien/entities/nhanvien.entity';

@Entity('nghiPhep')
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

  // Trong nhanvien.entity.ts
  @OneToMany(() => NghiPhep, np => np.nhanVien)
  nghiPhep: NghiPhep[];

}
