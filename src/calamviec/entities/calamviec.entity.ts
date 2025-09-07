import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ChamCong } from 'src/chamcong/entities/chamcong.entity';

@Entity('calamviec') // 👉 nên dùng lowercase để đồng bộ với table name
export class CaLamViec {
  @PrimaryGeneratedColumn()
  maCa: number;

  @Column({ length: 100 })
  tenCa: string;

  @Column({ type: 'time' })
  gioBatDau: string;

  @Column({ type: 'time' })
  gioKetThuc: string;

  // ✅ Thêm trạng thái ca (true = đang hoạt động, false = ngưng)
  @Column({ type: 'boolean', default: true })
  trangThai: boolean;

  @OneToMany(() => ChamCong, (cc) => cc.caLamViec)
  chamCong: ChamCong[];
}
