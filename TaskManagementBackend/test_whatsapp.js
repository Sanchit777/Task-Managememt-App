require('dotenv').config();
const twilio = require('twilio');

// Ensure that these variables are set in your .env file
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromWhatsAppNumber = process.env.TWILIO_WHATSAPP_FROM;
const toWhatsAppNumber = process.env.WHATSAPP_TO_NUMBER;

if (!accountSid || !authToken || !fromWhatsAppNumber || !toWhatsAppNumber) {
    console.error("Missing Twilio credentials in your .env file.");
    console.log("Please make sure you have added the following variables:");
    console.log("- TWILIO_ACCOUNT_SID");
    console.log("- TWILIO_AUTH_TOKEN");
    console.log("- TWILIO_WHATSAPP_FROM (e.g. 'whatsapp:+14155238886')");
    console.log("- WHATSAPP_TO_NUMBER (e.g. 'whatsapp:+919876543210')");
    process.exit(1);
}

const client = twilio(accountSid, authToken);

console.log("Attempting to send WhatsApp message via Twilio...");

client.messages
    .create({
        body: 'Hello from Task Management System! This is a test message to verify your Twilio WhatsApp configuration.',
        from: fromWhatsAppNumber,
        to: toWhatsAppNumber
    })
    .then(message => {
        console.log("SUCCESS! WhatsApp message sent:");
        console.log(`Message SID: ${message.sid}`);
    })
    .catch(error => {
        console.error("FAILED to send WhatsApp message:");
        console.error(error);
    });
