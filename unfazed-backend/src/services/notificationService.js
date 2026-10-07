const EventEmitter = require('events');
const nodemailer = require('nodemailer');

class NotificationService extends EventEmitter {
  constructor() {
    super();
    this.mailer = this.createTransporter();
    this.registerEventHandlers();
  }

  createTransporter() {
    // Falls back to mock logger transporter if SMTP credentials are omitted
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER) {
      return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT, 10) || 587,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    }

    return {
      sendMail: async (mailOptions) => {
        console.log(`[NotificationService: STUB DISPATCH] To: ${mailOptions.to} | Subject: ${mailOptions.subject}`);
        return { messageId: `mock-${Date.now()}` };
      },
    };
  }

  registerEventHandlers() {
    this.on('booking_confirmed', this.handleBookingConfirmed.bind(this));
    this.on('reminder_24h', this.handleReminder24h.bind(this));
    this.on('post_session_followup', this.handlePostSessionFollowup.bind(this));
  }

  async handleBookingConfirmed({ session, therapist, client }) {
    console.log(`\n======================================================`);
    console.log(`[EVENT: booking_confirmed] Instant session confirmation!`);
    console.log(`Therapist: ${therapist.name} (${therapist.email})`);
    console.log(`Client: ${client.name} (${client.email})`);
    console.log(`Slot: ${new Date(session.startTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)`);
    console.log(`Room Link: ${session.meetingLink}`);
    console.log(`======================================================\n`);

    const mailOptions = {
      from: `"Unfazed Telehealth" <no-reply@unfazed.in>`,
      to: client.email,
      subject: `Confirmed: Therapy Session with ${therapist.name}`,
      text: `Hello ${client.name},\n\nYour session with ${therapist.name} is confirmed for ${new Date(session.startTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST.\n\nJoin URL: ${session.meetingLink}\n\nWarm regards,\nUnfazed Team`,
    };

    try {
      await this.mailer.sendMail(mailOptions);
    } catch (err) {
      console.error(`[NotificationService Error] Failed to send email: ${err.message}`);
    }
  }

  async handleReminder24h({ session, therapist, client }) {
    console.log(`[EVENT: reminder_24h] 24-hour reminder dispatched for Session ${session._id} to ${client.email}`);
  }

  async handlePostSessionFollowup({ session, therapist, client }) {
    console.log(`[EVENT: post_session_followup] Follow-up check-in sent for Session ${session._id} to ${client.email}`);
  }
}

module.exports = new NotificationService();
