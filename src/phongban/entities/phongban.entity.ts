import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { NhanVien } from 'src/nhanvien/entities/nhanvien.entity';

@Entity('phongban')
export class PhongBan {
  @PrimaryGeneratedColumn()
  maPB: number;

  @Column()
  tenPhong: string;

  @Column({ nullable: true })
  moTa: string;

  @OneToMany(() => NhanVien, (nv) => nv.phongBan)
  nhanViens: NhanVien[];
}
