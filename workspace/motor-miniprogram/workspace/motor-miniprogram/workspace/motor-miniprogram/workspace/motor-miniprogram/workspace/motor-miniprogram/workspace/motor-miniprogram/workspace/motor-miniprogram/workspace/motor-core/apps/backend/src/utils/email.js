const nodemailer = require('nodemailer');

// 创建邮件传输器
const createTransporter = () => {
  // 开发环境使用Ethereal或者其他测试服务
  if (process.env.NODE_ENV === 'development') {
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // 生产环境配置
  return nodemailer.createTransporter({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// 邮件模板
const emailTemplates = {
  // 欢迎邮件
  welcome: (username) => ({
    subject: '欢迎加入摩托车性能数据库',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">欢迎，${username}！</h2>
        <p>感谢您注册我们的摩托车性能数据库。</p>
        <p>您现在可以：</p>
        <ul>
          <li>浏览详细的摩托车信息</li>
          <li>查看和发表评价</li>
          <li>收藏喜欢的车型</li>
          <li>比较不同车型</li>
        </ul>
        <p>祝您使用愉快！</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          这是一封自动发送的邮件，请勿回复。
        </p>
      </div>
    `
  }),

  // 邮箱验证
  emailVerification: (username, verificationLink) => ({
    subject: '请验证您的邮箱地址',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">邮箱验证</h2>
        <p>您好，${username}！</p>
        <p>请点击下面的链接验证您的邮箱地址：</p>
        <a href="${verificationLink}" 
           style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          验证邮箱
        </a>
        <p>如果按钮无法点击，请复制以下链接到浏览器：</p>
        <p style="word-break: break-all; color: #666;">${verificationLink}</p>
        <p style="color: #e74c3c;">此链接将在24小时后失效。</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          如果您没有注册账户，请忽略此邮件。
        </p>
      </div>
    `
  }),

  // 密码重置
  passwordReset: (username, resetLink) => ({
    subject: '重置您的密码',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">密码重置请求</h2>
        <p>您好，${username}！</p>
        <p>我们收到了您的密码重置请求。请点击下面的链接重置密码：</p>
        <a href="${resetLink}" 
           style="display: inline-block; padding: 12px 24px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
          重置密码
        </a>
        <p>如果按钮无法点击，请复制以下链接到浏览器：</p>
        <p style="word-break: break-all; color: #666;">${resetLink}</p>
        <p style="color: #e74c3c;">此链接将在10分钟后失效。</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          如果您没有请求重置密码，请忽略此邮件。您的密码不会被更改。
        </p>
      </div>
    `
  }),

  // 评价审核通知
  reviewApproved: (username, motorcycleName, reviewTitle) => ({
    subject: '您的评价已通过审核',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">评价审核通过</h2>
        <p>您好，${username}！</p>
        <p>您对 <strong>${motorcycleName}</strong> 的评价已通过审核并发布：</p>
        <blockquote style="border-left: 4px solid #007bff; padding-left: 16px; margin: 20px 0; color: #666;">
          ${reviewTitle}
        </blockquote>
        <p>感谢您的宝贵分享！</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          这是一封自动发送的邮件，请勿回复。
        </p>
      </div>
    `
  }),

  // 新摩托车通知
  newMotorcycle: (motorcycleName, category, brand) => ({
    subject: `新车型上线：${motorcycleName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">新车型上线</h2>
        <p>我们刚刚添加了一款新的${category}：</p>
        <h3 style="color: #007bff;">${brand} ${motorcycleName}</h3>
        <p>快来查看详细信息和参数吧！</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          如果您不想接收此类邮件，可以在个人设置中取消订阅。
        </p>
      </div>
    `
  })
};

// 发送邮件函数
const sendEmail = async (to, templateName, templateData = {}) => {
  try {
    const transporter = createTransporter();
    const template = emailTemplates[templateName];
    
    if (!template) {
      throw new Error(`邮件模板 "${templateName}" 不存在`);
    }

    const emailContent = typeof template === 'function' 
      ? template(...Object.values(templateData))
      : template;

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || '摩托车数据库'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject: emailContent.subject,
      html: emailContent.html
    };

    // 如果有文本版本，添加文本内容
    if (emailContent.text) {
      mailOptions.text = emailContent.text;
    }

    const info = await transporter.sendMail(mailOptions);
    
    console.log('邮件发送成功:', {
      messageId: info.messageId,
      to,
      subject: emailContent.subject
    });

    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('邮件发送失败:', error);
    throw new Error(`邮件发送失败: ${error.message}`);
  }
};

// 批量发送邮件
const sendBulkEmail = async (recipients, templateName, templateData = {}) => {
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  for (const recipient of recipients) {
    try {
      await sendEmail(recipient, templateName, templateData);
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        email: recipient,
        error: error.message
      });
    }
  }

  return results;
};

// 验证邮箱地址格式
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 发送测试邮件
const sendTestEmail = async (to) => {
  return sendEmail(to, 'welcome', { username: '测试用户' });
};

module.exports = {
  sendEmail,
  sendBulkEmail,
  validateEmail,
  sendTestEmail,
  emailTemplates
};