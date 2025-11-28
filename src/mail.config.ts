import { MailerOptions } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

export const MAIL_CONFIG: MailerOptions = {
  // 1. Cấu hình Server gửi mail (Gmail)
  transport: {
    service: 'gmail', 
    auth: {
      user: process.env.MAIL_USER || 'your-email@gmail.com',
      pass: process.env.MAIL_PASS || 'your-app-password',
    },
  },
  
  // 2. Cấu hình mặc định người gửi
  defaults: {
    from: '"IT-Global Support" <no-reply@itglobal.com>',
  },

  // 3. Cấu hình Template (HTML mail)
  template: {
    dir: process.cwd() + '/src/email-templates/', 
    adapter: new HandlebarsAdapter(), 
    options: {
      strict: true,
    },
  },
};