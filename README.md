<div align="center">
  <a href="https://nestjs.com/" target="_blank">
    <img src="https://nestjs.com/img/logo-mac.svg" alt="NestJS Logo" width="180" />
  </a>
  
  <h1>🏢 ITGlobal - Chấm Công & Quản Trị Nhân Sự (Backend)</h1>
  
  <p><i>Backend API mạnh mẽ cho hệ thống chấm công (hỗ trợ Face ID), quản lý nhân sự và báo cáo doanh nghiệp.</i></p>

  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white" alt="JWT" />
  <img src="https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI" />
</div>

<hr />

## 🎯 1. Tổng quan dự án
- **Mục tiêu:** Số hóa quy trình chấm công, nghỉ phép, tăng ca, tính lương và tổng hợp báo cáo.
- **Đối tượng sử dụng:** Nhân viên, quản lý phòng ban, bộ phận HR.
- **Giá trị kinh doanh:**
  - Giảm thao tác thủ công và sai sót trong tính công.
  - Tăng tốc độ tổng hợp dữ liệu chấm công - lương.
  - Hỗ trợ ra quyết định qua dashboard và báo cáo.

## ✨ 2. Điểm nổi bật kỹ thuật
- **Kiến trúc Module:** Phân chia rõ ràng theo domain (`nhanvien`, `chamcong`, `luong`, `dashboard`, ...).
- **Bảo mật:** Xác thực và phân quyền bằng JWT (`passport-jwt`).
- **Data Validation:** Validate input toàn cục bằng `ValidationPipe` + DTO.
- **Bảo mật & Network:** CORS linh hoạt cho localhost, LAN IP, Vercel và domain khai báo qua ENV.
- **Database:** Tương thích PostgreSQL (hỗ trợ SSL cho môi trường cloud như Neon).
- **Tính năng mở rộng:** Hỗ trợ email thông báo, xuất file báo cáo (Excel/PDF), và module AI tích hợp nhận diện khuôn mặt.

## 🚀 3. Công nghệ sử dụng
- **Framework:** NestJS 11 (TypeScript)
- **Database:** PostgreSQL + TypeORM
- **Auth:** Passport JWT
- **Tích hợp:** Nodemailer, ExcelJS, PDFMake, OpenAI SDK, Face API
- **Vận hành:** dotenv, CORS, static assets (uploads)

## 📂 4. Cấu trúc chức năng chính
| Module | Chức năng |
| :--- | :--- |
| 🔐 `auth` | Đăng nhập, xác thực, JWT strategy. |
| 🧑‍💼 `nhanvien` | Quản lý nhân sự và trạng thái tài khoản. |
| 🏢 `phongban` | Quản lý phòng ban. |
| ⏰ `calamviec` | Cấu hình ca làm việc. |
| 📸 `chamcong` | Chấm công (hỗ trợ Face ID) và tổng hợp công. |
| 🏖️ `nghi-phep` | Xử lý đơn xin nghỉ phép. |
| ⏳ `lam-them` | Quản lý tăng ca. |
| 💰 `luong` | Tính toán lương theo dữ liệu chấm công. |
| 📊 `baocao` / `dashboard` | Báo cáo và thống kê trực quan. |
| 🤖 `ai` | Các nghiệp vụ hỗ trợ AI & Face API. |

## ⚙️ 5. Hướng dẫn cài đặt

### Yêu cầu hệ thống
- Node.js 18+
- npm 9+
- PostgreSQL

### Cài đặt dependencies
```bash
npm install