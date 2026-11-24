import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { BaoCaoService } from './baocao.service';
import { Response } from 'express';
import { JwtAuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/common/roles.guard';
import { Roles } from 'src/common/roles.decorator';

@Controller('baocao')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('quantrivien', 'nhansu')
export class BaoCaoController {
  constructor(private readonly baoCaoService: BaoCaoService) {}

  // ==================== BÁO CÁO THÁNG ====================

  @Get('thang')
  async getBaoCaoThang(
    @Query('thang') thang: number,
    @Query('nam') nam: number,
    @Query('maNV') maNV?: number,
    @Query('maPB') maPB?: number,
  ) {
    return this.baoCaoService.tongHopThang(
      +thang,
      +nam,
      maNV ? +maNV : undefined,
      maPB ? +maPB : undefined,
    );
  }

  @Get('thang/export/excel')
  async exportExcelThang(
    @Query('thang') thang: number,
    @Query('nam') nam: number,
    @Query('maNV') maNV: number,
    @Query('maPB') maPB: number,
    @Res() res: Response,
  ) {
    const data = await this.baoCaoService.tongHopThang(
      +thang,
      +nam,
      maNV ? +maNV : undefined,
      maPB ? +maPB : undefined,
    );
    const buffer = await this.baoCaoService.exportExcel(
      data,
      `BÁO CÁO THÁNG ${thang}/${nam}`,
    );

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=baocao-thang-${thang}-${nam}.xlsx`,
    );
    res.end(buffer);
  }

  @Get('thang/export/pdf')
  async exportPDFThang(
    @Query('thang') thang: number,
    @Query('nam') nam: number,
    @Query('maNV') maNV: number,
    @Query('maPB') maPB: number,
    @Res() res: Response,
  ) {
    const data = await this.baoCaoService.tongHopThang(
      +thang,
      +nam,
      maNV ? +maNV : undefined,
      maPB ? +maPB : undefined,
    );
    const buffer = await this.baoCaoService.exportPDF(
      data,
      `BÁO CÁO THÁNG ${thang}/${nam}`,
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=baocao-thang-${thang}-${nam}.pdf`,
    );
    res.end(buffer);
  }

  // ==================== BÁO CÁO NĂM ====================

  @Get('nam')
  async getBaoCaoNam(
    @Query('nam') nam: number,
    @Query('maNV') maNV?: number,
    @Query('maPB') maPB?: number,
  ) {
    return this.baoCaoService.tongHopNam(
      +nam,
      maNV ? +maNV : undefined,
      maPB ? +maPB : undefined,
    );
  }

  @Get('nam/export/excel')
  async exportExcelNam(
    @Query('nam') nam: number,
    @Query('maNV') maNV: number,
    @Query('maPB') maPB: number,
    @Res() res: Response,
  ) {
    const data = await this.baoCaoService.tongHopNam(
      +nam,
      maNV ? +maNV : undefined,
      maPB ? +maPB : undefined,
    );
    const buffer = await this.baoCaoService.exportExcel(
      data,
      `BÁO CÁO NĂM ${nam}`,
    );

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=baocao-nam-${nam}.xlsx`,
    );
    res.end(buffer);
  }

  @Get('nam/export/pdf')
  async exportPDFNam(
    @Query('nam') nam: number,
    @Query('maNV') maNV: number,
    @Query('maPB') maPB: number,
    @Res() res: Response,
  ) {
    const data = await this.baoCaoService.tongHopNam(
      +nam,
      maNV ? +maNV : undefined,
      maPB ? +maPB : undefined,
    );
    const buffer = await this.baoCaoService.exportPDF(
      data,
      `BÁO CÁO NĂM ${nam}`,
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=baocao-nam-${nam}.pdf`,
    );
    res.end(buffer);
  }
}
