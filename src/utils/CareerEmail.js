import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendApplicationConfirmation = async (applicantEmail, applicantName, jobTitle) => {
  const message = {
    from: `"Home Service Careers" <${process.env.SMTP_USER}>`,
    to: applicantEmail,
    subject: `Application Received: ${jobTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
        <h2 style="color: #4CAF50;">Application Submitted!</h2>
        <p>Hi ${applicantName},</p>
        <p>Thank you for applying for the <strong>${jobTitle}</strong> position at Home Service Provider.</p>
        <p>We have received your appxlication and resume. Our team will review your profile and get back to you within 5–7 business days if your qualifications match our requirements.</p>
        <p>Best regards,<br>The Hiring Team</p>
      </div>
    `,
  };
  return transporter.sendMail(message);
};

export const sendAdminNotification = async (applicantDetails, jobTitle, resumeUrl) => {
  const message = {
    from: `"Career Portal" <${process.env.SMTP_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `New Application: ${jobTitle} - ${applicantDetails.name}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
        <h2 style="color: #2196F3;">New Job Application</h2>
        <p><strong>Candidate Name:</strong> ${applicantDetails.name}</p>
        <p><strong>Job Title:</strong> ${jobTitle}</p>
        <p><strong>Email:</strong> ${applicantDetails.email}</p>
        <p><strong>Phone:</strong> ${applicantDetails.phone}</p>
        <p><strong>Resume:</strong> <a href="${resumeUrl}" target="_blank">View Resume</a></p>
        <p>Please log in to the admin panel to review the full details.</p>
      </div>
    `,
  };
  return transporter.sendMail(message);
};

export const sendStatusUpdateEmail = async (applicantEmail, applicantName, jobTitle, status) => {
  const statusMessages = {
    under_review: "Your application is currently under review by our hiring team.",
    interview_scheduled: "We would like to invite you for an interview. Our team will contact you soon with the details.",
    accepted: "Congratulations! We are pleased to inform you that your application has been accepted.",
    rejected: "Thank you for your interest. Unfortunately, we have decided to move forward with other candidates at this time.",
  };

  const message = {
    from: `"Home Service Careers" <${process.env.SMTP_USER}>`,
    to: applicantEmail,
    subject: `Update on your application for ${jobTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
        <h2>Application Update</h2>
        <p>Hi ${applicantName},</p>
        <p>We have an update regarding your application for the <strong>${jobTitle}</strong> position.</p>
        <p><strong>Current Status: ${status.charAt(0).toUpperCase() + status.slice(1)}</strong></p>
        <p>${statusMessages[status] || "Your application status has been updated."}</p>
        <p>Thank you for your patience.</p>
        <p>Best regards,<br>The Hiring Team</p>
      </div>
    `,
  };
  return transporter.sendMail(message);
};
