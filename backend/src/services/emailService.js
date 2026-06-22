import nodemailer from 'nodemailer';

export const sendEmail = async ({ to, subject, text, html }) => {
  // Implement email send (configure transporter via env)
  console.log('sendEmail placeholder', to, subject);
};
