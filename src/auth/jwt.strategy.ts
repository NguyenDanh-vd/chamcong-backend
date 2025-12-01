import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config'; 

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  // 1. INJECT ConfigService vào constructor
  constructor(private readonly _configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // 2. FIX: Lấy SECRET KEY TỪ BIẾN MÔI TRƯỜNG
      secretOrKey: _configService.get<string>('JWT_SECRET_KEY'), 
    });
  }

  // 3. Xử lý Payload (Dữ liệu đã giải mã)
  async validate(payload: any) {
    // Kiểm tra tính hợp lệ tối thiểu của token
    if (!payload.maNV) {
        throw new UnauthorizedException('Token không hợp lệ hoặc thiếu thông tin.');
    }
    
    // Trả về đối tượng user để NestJS gắn vào req.user
    return { 
        maNV: payload.maNV, 
        email: payload.email, 
        role: payload.role, 
        hoTen: payload.hoTen 
    };
  }
}