import nodemailer from "nodemailer"

async function sendVerificationEmail(to, emailToken) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const verifyUrl = `${process.env.FRONTEND_URL}/signup?emailToken=${emailToken}`


  const message = {
    from: process.env.SMTP_USER,
    to,
    subject: "Verify Your Email Address",
    html: `
  <div style="font-family: Arial, sans-serif; background:#f5f7fa; padding:40px;">
    <div style="max-width:500px; margin:auto; background:#fff; padding:30px; border-radius:10px; box-shadow:0 2px 6px rgba(0,0,0,0.1);">
      
      <h2 style="color:#333; text-align:center;">Welcome to Our App 🎉</h2>
      
      <p style="font-size:15px; color:#555;">
        Thanks for signing up! Please confirm your email by clicking the button below:
      </p>

      <a href="${verifyUrl}" target="_blank"
         style="display:inline-block; background:#4F46E5; color:white; padding:12px 25px; border-radius:6px; 
         text-decoration:none; font-size:16px; margin-top:20px; text-align:center;">
         Verify Email
      </a>

      <p style="margin-top:30px; font-size:13px; color:#777;">
        This link will expire in <strong>10 minutes</strong>.
      </p>

      <hr style="margin:25px 0; border:none; border-top:1px solid #eee;">
      <p style="font-size:12px; color:#999; text-align:center;">
        If this wasn't you, please ignore this email.
      </p>

    </div>
  </div>
  `
  };

  return transporter.sendMail(message);

}


export default sendVerificationEmail;
