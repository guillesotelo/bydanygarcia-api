const nodemailer = require('nodemailer');
const { contactEmail, newPostComment } = require('./emailTemplates');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: "smtp.zoho.eu",
  port: 587,
  // secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify().then(() => {
  console.log("* Mailing ready *")
}).catch(error => console.error('Error verifying Nodemailer transporter: ', error))

const sendContactEmail = async (data) => {
  await transporter.sendMail({
    from: `"Dany García" <hello@anechooftheheart.com>`,
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
    from: `"${from}" <hello@anechooftheheart.com>`,
    to,
    subject,
    html
  }).catch((err) => {
    console.error('Something went wrong!', err)
  })
}

const sendCommentEmail = async (data) => {
  await transporter.sendMail({
    from: `"Dany García" <hello@anechooftheheart.com>`,
    to: 'danielasangar92@gmail.com',
    subject: `Nuevo comentario en ${data.postName}`,
    html: newPostComment(data)
  }).catch((err) => {
    console.error('Something went wrong!', err)
  })
}

const sendNotificationEmail = async ({ emailList, subject, html }) => {
  const sent = await transporter.sendMail({
    from: `"Dany García" <hello@anechooftheheart.com>`,
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