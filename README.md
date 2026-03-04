# ITGlobal - Chấm Công & Quản Trị Nhân Sự (Backend)

Backend API cho hệ thống chấm công, quản lý nhân sự, nghỉ phép, tăng ca và tính lương doanh nghiệp.

## 1. Tổng quan dự án
- Mục tiêu: Số hóa quy trình chấm công, nghỉ phép, tăng ca, tính lương và tổng hợp báo cáo.
- Đối tượng sử dụng: Nhân viên, quản lý phòng ban, bộ phận HR.
- Giá trị kinh doanh:
  - Giảm thao tác thủ công và sai sót trong tính công.
  - Tăng tốc độ tổng hợp dữ liệu chấm công - lương.
  - Hỗ trợ ra quyết định qua dashboard và báo cáo.

## 2. Điểm nổi bật kỹ thuật
- Kiến trúc module rõ ràng theo domain (`nhanvien`, `chamcong`, `luong`, `dashboard`, ...).
- Xác thực và phân quyền bằng JWT (`passport-jwt`).
- Validation input toàn cục bằng `ValidationPipe` + DTO.
- CORS linh hoạt cho localhost, LAN IP, Vercel và domain khai báo qua ENV.
- Tương thích PostgreSQL (hỗ trợ SSL cho môi trường cloud như Neon).
- Hỗ trợ email thông báo, xuất file báo cáo, và module AI.

## 3. Công nghệ sử dụng
- Framework: NestJS 11 (TypeScript)
- Database: PostgreSQL + TypeORM
- Auth: Passport JWT
- Tích hợp: Nodemailer, ExcelJS, PDFMake, OpenAI SDK, Face API
- Vận hành: dotenv, CORS, static assets (uploads)

## 4. Cấu trúc chức năng chính
- `auth`: Đăng nhập, xác thực, JWT strategy.
- `nhanvien`: Quản lý nhân sự và trạng thái tài khoản.
- `phongban`: Quản lý phòng ban.
- `calamviec`: Cấu hình ca làm.
- `chamcong`: Chấm công và tổng hợp công.
- `nghi-phep`: Xử lý đơn nghỉ phép.
- `lam-them`: Quản lý tăng ca.
- `luong`: Tính toán lương theo dữ liệu chấm công.
- `baocao` + `dashboard`: Báo cáo và thống kê trực quan.
- `ai`: Các nghiệp vụ hỗ trợ AI.

## 5. Cài đặt dự án
### Yêu cầu
- Node.js 18+
- npm 9+
- PostgreSQL

### Cài dependencies
```bash
npm install
```

## Biến môi trường (.env)
Tạo một file có tên là `.env` ở thư mục gốc của dự án và dán đoạn cấu hình tối thiểu sau vào:

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
PORT=3000
FRONTEND_ORIGINS=http://localhost:3001,https://your-frontend.vercel.app
JWT_SECRET=your_jwt_secret
```

## 🏃‍♂️ 6. Chạy dự án
```bash
# Chế độ Development (Dùng khi đang code)
npm run start:dev

# Đóng gói dự án (Build)
npm run build

# Chế độ Production (Dùng khi deploy thực tế)
npm run start:prod
```

Lưu ý: Mặc định API sẽ khởi chạy tại `http://localhost:3000`.

## 🧪 7. Test & Chất lượng mã nguồn
```bash
npm run test        # Chạy Unit test
npm run test:e2e    # Chạy End-to-end test
npm run test:cov    # Kiểm tra độ phủ của code (Coverage)
npm run lint        # Chạy Linter kiểm tra lỗi format code
```

## 💼 8. Định hướng demo (Cho Recruiter)
Để buổi phỏng vấn ấn tượng hơn, bạn nên kết hợp Backend này với giao diện Frontend để trình bày các luồng sau:

- Chấm công qua Face ID: Demo luồng gửi hình ảnh từ client lên server xử lý.
- Dashboard KPI: Thống kê chấm công theo phòng ban.
- Quy trình duyệt phép: Từ lúc tạo đơn đến khi được quản lý phê duyệt.
- Báo cáo: Export file Excel lương mỗi tháng và biến động tăng ca.

(Bạn có thể chèn 1-2 ảnh chụp màn hình giao diện Dashboard hoặc màn hình chấm công Face ID vào đây để README thêm sinh động)

## 👥 9. Tác giả & Thông tin dự án
- Team thực hiện: Nhóm_05
- Môn học / Chủ đề: Hệ thống chấm công và quản trị nhân sự
