# ITGlobal - Cham Cong & Quan Tri Nhan Su (Backend)

Backend API cho he thong cham cong, quan ly nhan su va bao cao doanh nghiep.

## 1) Tong quan du an
- Muc tieu: So hoa quy trinh cham cong, nghi phep, tang ca, tinh luong va tong hop bao cao.
- Doi tuong su dung: Nhan vien, quan ly phong ban, bo phan HR.
- Gia tri kinh doanh:
  - Giam thao tac thu cong va sai sot trong tinh cong.
  - Tang toc do tong hop du lieu cham cong - luong.
  - Ho tro ra quyet dinh qua dashboard va bao cao.

## 2) Diem noi bat ky thuat
- Kien truc module ro rang theo domain (`nhanvien`, `chamcong`, `luong`, `dashboard`, ...).
- Xac thuc va phan quyen bang JWT (`passport-jwt`).
- Validation input toan cuc bang `ValidationPipe` + DTO.
- CORS linh hoat cho localhost, LAN IP, Vercel va domain khai bao qua ENV.
- Tuong thich PostgreSQL (ho tro SSL cho moi truong cloud nhu Neon).
- Ho tro email thong bao, xuat file bao cao, va module AI.

## 3) Cong nghe su dung
- Framework: NestJS 11 (TypeScript)
- Database: PostgreSQL + TypeORM
- Auth: Passport JWT
- Tich hop: Nodemailer, ExcelJS, PDFMake, OpenAI SDK, Face API
- Van hanh: dotenv, CORS, static assets (uploads)

## 4) Cau truc chuc nang chinh
- `auth`: Dang nhap, xac thuc, JWT strategy.
- `nhanvien`: Quan ly nhan su va trang thai tai khoan.
- `phongban`: Quan ly phong ban.
- `calamviec`: Cau hinh ca lam.
- `chamcong`: Cham cong va tong hop cong.
- `nghi-phep`: Xu ly don nghi phep.
- `lam-them`: Quan ly tang ca.
- `luong`: Tinh toan luong theo du lieu cham cong.
- `baocao` + `dashboard`: Bao cao va thong ke truc quan.
- `ai`: Cac nghiep vu ho tro AI.

## 5) Huong dan cai dat
### Yeu cau
- Node.js 18+
- npm 9+
- PostgreSQL

### Cai dependencies
```bash
npm install
```

### Bien moi truong toi thieu (`.env`)
```env
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
PORT=3000
FRONTEND_ORIGINS=http://localhost:3001,https://your-frontend.vercel.app
JWT_SECRET=your_jwt_secret
```

## 6) Chay du an
```bash
# development
npm run start:dev

# build
npm run build

# production
npm run start:prod
```

Mac dinh API chay tai `http://localhost:3000`.

## 7) Test va chat luong ma nguon
```bash
npm run test
npm run test:e2e
npm run test:cov
npm run lint
```

## 8) Dinh huong demo cho recruiter
De ban demo an tuong hon khi phong van, nen ket hop backend nay voi frontend de trinh bay:
- Dashboard KPI cham cong theo phong ban.
- Luong moi thang va bien dong tang ca.
- Quy trinh duyet nghi phep (tu tao don den phe duyet).
- Export bao cao va email thong bao.

## 9) Tac gia va thong tin du an
- Team: Nhom_05
- Mon hoc/chu de: He thong cham cong va quan tri nhan su

---
Neu ban can, minh co the tiep tuc lam lai `frontend/README.md` theo cung format portfolio de bo ho so du an dong bo va chuyen nghiep hon.
