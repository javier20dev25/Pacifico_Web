const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, subject, text, html) => {
  try {
    let info = await transporter.sendMail({
      from: `"Pacífico Web" <${process.env.EMAIL_USER}>`, // Remitente
      to: to, // Lista de destinatarios
      subject: subject, // Asunto
      text: text, // Cuerpo de texto plano
      html: html, // Cuerpo HTML
    });

    console.log('Mensaje enviado: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error al enviar correo:', error);
    return false;
  }
};

module.exports = { sendEmail };
