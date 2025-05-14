const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const logger = require("../service/logging");
const config = require("../config");
const emailTemplates = require("./emailTemplates");


let transporter = nodemailer.createTransport({
  host: "smtp.zoho.in",
  port: 587,
  secure: false,
  auth: {
    user: config.EMAIL_USER,
    pass: config.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
});

// Function to read and compile the template
async function compileTemplate(templatePath, context) {
  try {
    const filePath = path.join(__dirname, 'templates', templatePath);
    const templateContent = await fs.promises.readFile(filePath, 'utf-8');
    const compiledTemplate = handlebars.compile(templateContent);
    return compiledTemplate(context);
  } catch (error) {
    logger.error("Error compiling the template:", error);
    throw error;
  }
}



// Function to send the email
async function sendEmail({ to, subject, template, context }) {
  try {
    
    const html = await compileTemplate(template, context);

    const mailOptions = {
      from: `Abhishek Kumar <${config.EMAIL_USER}>`,
      to,
      subject,
      html, // Send the compiled HTML as email content
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    logger.error("Error sending email:", error);
    throw error;
  }
}
module.exports = { sendEmail, emailTemplates };