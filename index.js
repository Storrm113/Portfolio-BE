// index.js (Backend API with Express and Nodemailer)
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 10000;

// Allow all origins for testing
app.use(cors({
  origin: '*',
  methods: ["GET", "POST", "OPTIONS"],
}));

// Middleware
app.use(express.json());

// Optional Home Route
app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

// POST /api/contact - Handle form submission
app.post("/api/contact", async (req, res) => {
  const { name, email, message, recaptchaToken } = req.body;

  try {
    // Setup email transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Send the email
    await transporter.sendMail({
      from: email,
      to: process.env.EMAIL_USER,
      subject: `New message from ${name}`,
      text: message,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Email failed:", error);
    res.status(500).json({ success: false, message: "Email failed to send" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
