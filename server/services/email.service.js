
import nodemailer from "nodemailer";

const auther = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

sendEmail = async (to, subject, username) => {
  const mailOptions = {
    from: process.env.FROM,
    to: to,
    subject: subject,
    text: `Hello, ${username}! we`
  };

  await auther.sendMail(mailOptions);
};
