import nodemailer from "nodemailer"

async function sendResetEmail(to, token, isVendor = false){
  const resetPath = isVendor ? "/vendor/reset-password" : "/resetpassword";
  const resetUrl = `${process.env.FRONTEND_URL}${resetPath}/${token}`
  
  const transporter = nodemailer.createTransport({
    host:process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure:false,
    auth:{
      user:process.env.SMTP_USER,
      pass:process.env.SMTP_PASS,
    }
  });
    const message = {
    from: process.env.SMTP_USER,
    to,
    subject: "Reset Password",
    html: `
    <h3>Password Reset Request</h3>
    <p>Click the link below to reset your password</p>
    <a href="${resetUrl}" target="_blank">Reset Password</a>
    <p>This link will expire in 1 hour.</p>
    `
};
  return transporter.sendMail(message);
}
export default sendResetEmail;
  
