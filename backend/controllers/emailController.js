// filepath: c:\Users\georg\OneDrive\Desktop\MP\MiniProjectI\backend\controllers\emailController.js
const nodemailer = require("nodemailer");

exports.sendEmail = async (req, res) => {
  const { to, subject, body } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text: body,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error); // Log the error details
    res.status(500).json({ message: "Error sending email", error });
  }
};
