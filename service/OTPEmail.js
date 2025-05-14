const nodemailer = require("nodemailer");
const fs = require("fs").promises;
const path = require("path");
const config = require("../config");

let transporter = nodemailer.createTransport({
  host: "smtp.zoho.in",
  secure: true,
  port: 465,
  auth: {
    user: config.EMAIL_USER,
    pass: config.EMAIL_PASS,
  },
});

async function sendOtpEmail(to, name, otp) {
  try {
    const templatePath = path.join(__dirname, "OTPEmail.html");
    let template = await fs.readFile(templatePath, "utf-8");
    template = template.replace(/{{name}}/g, name);
    template = template.replace(/{{otp}}/g, otp);

    const mailOptions = {
      from: '"Abhishek Kumar" <official@iamabhi.tech>',
      to: to,
      subject: `Your OTP Code\n${otp}`,
      html: template,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
  } catch (error) {
    console.log("Error sending email:", error);
  }
}

module.exports = { sendOtpEmail };
