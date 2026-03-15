require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'sanchitchoudhary123@gmail.com',
    subject: "Test Email from Local Environment",
    text: "This is a test to verify if the Google App Password is still valid."
};

console.log("Attempting to send email...");
transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.error("FAILED to send email:");
        console.error(error);
    } else {
        console.log("SUCCESS! Email sent:");
        console.log(info.response);
    }
});
