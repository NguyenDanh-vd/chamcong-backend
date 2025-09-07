export const resetPasswordTemplate = (resetLink: string, hoTen?: string) => {
  return `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2 style="color: #4f46e5;">Xin chào ${hoTen || "bạn"},</h2>
    <p>Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản của mình.</p>
    <p>Nhấn vào nút bên dưới để đặt lại mật khẩu (link sẽ hết hạn sau <b>15 phút</b>):</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="${resetLink}" 
        style="background: linear-gradient(to right, #4f46e5, #9333ea); 
               color: #fff; padding: 12px 20px; 
               border-radius: 8px; 
               text-decoration: none; 
               font-weight: bold;">
        Đặt lại mật khẩu
      </a>
    </div>
    <p>Nếu nút không hoạt động, hãy copy và dán đường link sau vào trình duyệt:</p>
    <p style="word-break: break-all; color: #1d4ed8;">${resetLink}</p>
    <hr style="margin: 32px 0; border: none; border-top: 1px solid #ddd;" />
    <p style="font-size: 12px; color: #555;">
      Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
    </p>
    <p style="font-size: 12px; color: #555;">
      — ITGlobal Support
    </p>
  </div>
  `;
};
