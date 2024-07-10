import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMPT_HOST,
  port: 587,
  secure: false, // Use `true` for port 465, `false` for all other ports
  auth: {
    user: process.env.SMPT_USER,
    pass: process.env.SMPT_PASS,
  },
});

export const sendEmail = async (toEmail, subject, body) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL, // sender address
      to: toEmail, // list of receivers
      subject: subject, // Subject line
      html: body, // html body
    });
    console.log("Email sent: %s", info.messageId); // Log the message ID
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info)); // Log the preview URL
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Error sending email");
  }
};
