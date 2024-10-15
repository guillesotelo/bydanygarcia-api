const nodemailer = require('nodemailer');
const { contactEmail, newPostComment } = require('./emailTemplates');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify().then(() => {
  console.log("* Mailing ready *")
})

const sendContactEmail = async (data) => {
  await transporter.sendMail({
    from: `"by Dany Garcia" <${process.env.EMAIL}>`,
    to: 'danielasangar92@gmail.com',
    subject: `Tienes un nuevo mensaje`,
    html: contactEmail(data)
  }).catch((err) => {
    console.error('Something went wrong!', err)
  })
}

const sendCustomContactEmail = async (data) => {
  const { from, to, subject, html } = data
  
  await transporter.sendMail({
    from: `"${from}" <${process.env.EMAIL}>`,
    to,
    subject,
    html
  }).catch((err) => {
    console.error('Something went wrong!', err)
  })
}

const sendCommentEmail = async (data) => {
  await transporter.sendMail({
    from: `"by Dany Garcia" <${process.env.EMAIL}>`,
    to: 'danielasangar92@gmail.com',
    subject: `Nuevo comentario en ${data.postName}`,
    html: newPostComment(data)
  }).catch((err) => {
    console.error('Something went wrong!', err)
  })
}

const sendNotificationEmail = async ({ emailList, subject, html }) => {
  const sent = await transporter.sendMail({
    from: `"by Dany Garcia" <${process.env.EMAIL}>`,
    to: emailList,
    subject: subject || 'We have some updates for you',
    html
  }).catch((err) => {
    console.error('Something went wrong!', err)
  })
  return sent
}

module.exports = {
  transporter,
  sendContactEmail,
  sendCustomContactEmail,
  sendNotificationEmail,
  sendCommentEmail
}