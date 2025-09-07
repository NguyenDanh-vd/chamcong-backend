import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ChamCong } from 'src/chamcong/entities/chamcong.entity';
import { NghiPhep } from 'src/nghi-phep/entities/nghi-phep.entity';
import { LamThem } from 'src/lam-them/entities/lam-them.entity';
import { NhanVien } from 'src/nhanvien/entities/nhanvien.entity';
import * as ExcelJS from 'exceljs';
import PdfPrinter from 'pdfmake/src/printer';
import * as path from 'path';

type ReportItem = {
  hoTen: string;
  ngayCong: number;
  ngayNghi: number;
  gioLamThem: number;
};

@Injectable()
export class BaoCaoService {
  constructor(
    @InjectRepository(ChamCong) private ccRepo: Repository<ChamCong>,
    @InjectRepository(NghiPhep) private npRepo: Repository<NghiPhep>,
    @InjectRepository(LamThem) private ltRepo: Repository<LamThem>,
    @InjectRepository(NhanVien) private nvRepo: Repository<NhanVien>,
  ) {}

  private filterByNhanVien(
    qb: SelectQueryBuilder<any>,
    alias: string,
    maNV?: number,
    maPB?: number,
  ) {
    qb.leftJoinAndSelect(`${alias}.nhanVien`, 'nv').leftJoinAndSelect(
      'nv.phongBan',
      'pb',
    );
    if (maNV) qb.andWhere('nv.maNV = :maNV', { maNV });
    if (maPB) qb.andWhere('pb.maPB = :maPB', { maPB });
    return qb;
  }

  // ==================== BÁO CÁO THÁNG ====================
  async tongHopThang(
    thang: number,
    nam: number,
    maNV?: number,
    maPB?: number,
  ): Promise<ReportItem[]> {
    const chamCongQuery = this.ccRepo.createQueryBuilder('cc');
    this.filterByNhanVien(chamCongQuery, 'cc', maNV, maPB);
    chamCongQuery.where('MONTH(cc.gioVao) = :thang AND YEAR(cc.gioVao) = :nam', {
      thang,
      nam,
    });
    const chamCong = await chamCongQuery.getMany();

    const nghiPhepQuery = this.npRepo.createQueryBuilder('np');
    this.filterByNhanVien(nghiPhepQuery, 'np', maNV, maPB);
    nghiPhepQuery.where(
      'MONTH(np.ngayBatDau) = :thang AND YEAR(np.ngayBatDau) = :nam',
      { thang, nam },
    );
    const nghiPhep = await nghiPhepQuery.getMany();

    const lamThemQuery = this.ltRepo.createQueryBuilder('lt');
    this.filterByNhanVien(lamThemQuery, 'lt', maNV, maPB);
    lamThemQuery.where('MONTH(lt.ngayLT) = :thang AND YEAR(lt.ngayLT) = :nam', {
      thang,
      nam,
    });
    const lamThem = await lamThemQuery.getMany();

    // Lấy danh sách nhân viên để đảm bảo ai cũng có trong báo cáo
    const nhanVienQuery = this.nvRepo.createQueryBuilder('nv').leftJoinAndSelect('nv.phongBan', 'pb');
    if (maNV) nhanVienQuery.where('nv.maNV = :maNV', { maNV });
    if (maPB) nhanVienQuery.andWhere('pb.maPB = :maPB', { maPB });
    const nhanVienList = await nhanVienQuery.getMany();

    const baoCaoTongHop = nhanVienList.map((nv) => {
      const ngayCong = chamCong.filter(cc => cc.nhanVien?.maNV === nv.maNV).length;
      const ngayNghi = nghiPhep
        .filter(np => np.nhanVien?.maNV === nv.maNV)
        .reduce((total, np) => {
          const start = new Date(np.ngayBatDau);
          const end = new Date(np.ngayKetThuc);
          const diffTime = Math.abs(end.getTime() - start.getTime());
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
          return total + diffDays;
        }, 0);
      const gioLamThem = lamThem
        .filter(lt => lt.nhanVien?.maNV === nv.maNV)
        .reduce((total, lt) => total + (lt.soGio || 0), 0);

      return {
        hoTen: nv.hoTen,
        ngayCong,
        ngayNghi,
        gioLamThem,
      };
    });

    return baoCaoTongHop;
  }

  // ==================== BÁO CÁO NĂM ====================
  async tongHopNam(
    nam: number,
    maNV?: number,
    maPB?: number,
  ): Promise<ReportItem[]> {
    const chamCongQuery = this.ccRepo.createQueryBuilder('cc');
    this.filterByNhanVien(chamCongQuery, 'cc', maNV, maPB);
    chamCongQuery.where('YEAR(cc.gioVao) = :nam', { nam });
    const chamCong = await chamCongQuery.getMany();

    const nghiPhepQuery = this.npRepo.createQueryBuilder('np');
    this.filterByNhanVien(nghiPhepQuery, 'np', maNV, maPB);
    nghiPhepQuery.where('YEAR(np.ngayBatDau) = :nam', { nam });
    const nghiPhep = await nghiPhepQuery.getMany();

    const lamThemQuery = this.ltRepo.createQueryBuilder('lt');
    this.filterByNhanVien(lamThemQuery, 'lt', maNV, maPB);
    lamThemQuery.where('YEAR(lt.ngayLT) = :nam', { nam });
    const lamThem = await lamThemQuery.getMany();

    const nhanVienQuery = this.nvRepo.createQueryBuilder('nv').leftJoinAndSelect('nv.phongBan', 'pb');
    if (maNV) nhanVienQuery.where('nv.maNV = :maNV', { maNV });
    if (maPB) nhanVienQuery.andWhere('pb.maPB = :maPB', { maPB });
    const nhanVienList = await nhanVienQuery.getMany();

    const baoCaoTongHop = nhanVienList.map((nv) => {
      const ngayCong = chamCong.filter(cc => cc.nhanVien?.maNV === nv.maNV).length;
      const ngayNghi = nghiPhep
        .filter(np => np.nhanVien?.maNV === nv.maNV)
        .reduce((total, np) => {
          const start = new Date(np.ngayBatDau);
          const end = new Date(np.ngayKetThuc);
          const diffTime = Math.abs(end.getTime() - start.getTime());
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
          return total + diffDays;
        }, 0);
      const gioLamThem = lamThem
        .filter(lt => lt.nhanVien?.maNV === nv.maNV)
        .reduce((total, lt) => total + (lt.soGio || 0), 0);

      return {
        hoTen: nv.hoTen,
        ngayCong,
        ngayNghi,
        gioLamThem,
      };
    });

    return baoCaoTongHop;
  }

  // ==================== EXPORT EXCEL ====================
  async exportExcel(data: ReportItem[], title: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('BaoCaoTongHop');

    const titleRow = sheet.addRow([title]);
    titleRow.font = { size: 16, bold: true };
    sheet.mergeCells(1, 1, 1, 4); // merge từ cột 1 đến cột 4 (tự động hơn có thể lấy từ headerRow.cellCount)
    titleRow.alignment = { horizontal: 'center' };
    sheet.addRow([]);

    const headerRow = sheet.addRow(['Nhân viên', 'Ngày công', 'Ngày nghỉ', 'Giờ làm thêm']);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    data.forEach((item) => {
      const row = sheet.addRow(Object.values(item));
      row.eachCell((cell) => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
    });

    // Fix lỗi eachCell possibly undefined
    sheet.columns.forEach((col) => {
      if (!col || typeof col.eachCell !== 'function') return;
      let maxLength = 0;
      col.eachCell({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      col.width = maxLength < 10 ? 10 : maxLength + 2;
    });

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  // ==================== EXPORT PDF ====================
  async exportPDF(data: ReportItem[], title: string): Promise<Buffer> {
    const fonts = {
      Roboto: {
        normal: path.join(process.cwd(), 'src/assets/fonts/Roboto-Regular.ttf'),
        bold: path.join(process.cwd(), 'src/assets/fonts/Roboto-Medium.ttf'),
        italics: path.join(process.cwd(), 'src/assets/fonts/Roboto-Italic.ttf'),
        bolditalics: path.join(process.cwd(), 'src/assets/fonts/Roboto-MediumItalic.ttf'),
      },
    };
    const printer = new PdfPrinter(fonts);
    const tableBody = [
      [{ text: 'Nhân viên', bold: true }, { text: 'Ngày công', bold: true }, { text: 'Ngày nghỉ', bold: true }, { text: 'Giờ làm thêm', bold: true }],
      ...data.map((item) => [
        item.hoTen,
        item.ngayCong,
        item.ngayNghi,
        item.gioLamThem, // giữ nguyên số, không ép .toFixed(2)
      ]),
    ];
    const docDef = {
      content: [
        { text: title, style: 'header' },
        { text: ' ' },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto', 'auto'],
            body: tableBody,
          },
          layout: 'lightHorizontalLines',
        },
      ],
      styles: { header: { fontSize: 18, bold: true, alignment: 'center' } },
      defaultStyle: { font: 'Roboto', fontSize: 10 },
    };
    const pdfDoc = printer.createPdfKitDocument(docDef);
    const chunks: Buffer[] = [];
    return new Promise<Buffer>((resolve, reject) => {
      pdfDoc.on('data', (chunk) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      pdfDoc.end();
    });
  }
}
