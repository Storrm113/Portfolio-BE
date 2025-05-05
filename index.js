const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const axios = require("axios");
const { body, validationResult } = require("express-validator");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors({origin: "https://your-frontend-site.netlify.app", // replace with your deployed Netlify domain
    methods: ["POST"],}));
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));

// Rate limiter to prevent spam
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
});
app.use("/api/contact", limiter);

// POST /api/contact
app.post(
  "/api/contact",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("message").isLength({ min: 10 }).withMessage("Message is too short"),
    body("recaptchaToken").notEmpty().withMessage("CAPTCHA is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, message, recaptchaToken } = req.body;

    // ✅ Verify reCAPTCHA token
    try {
      const response = await axios.post(
        `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET}&response=${recaptchaToken}`
      );

      if (!response.data.success) {
        return res.status(400).json({ error: "CAPTCHA verification failed." });
      }
    } catch (error) {
      console.error("reCAPTCHA error:", error);
      return res.status(500).json({ error: "Error verifying CAPTCHA." });
    }

    // ✅ Send the email
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: `"Portfolio Site" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_TO,
        subject: `New Contact from ${name}`,
        html: `
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong><br/>${message}</p>
        `,
      });

      res.status(200).json({ message: "Message sent successfully!" });
    } catch (err) {
      console.error("Email error:", err);
      res.status(500).json({ error: "Email failed. Please try again later." });
    }
  }
);

// Health check route
app.get("/api/status", (req, res) => {
  res.json({ status: "OK" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
