const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendSigningEmail = async (
  recipientEmail,
  signingLink
) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: recipientEmail,
    subject: "SignFlow Document Signature Request",
    html: `
      <h2>Document Signature Request</h2>

      <p>
        You have received a document that requires your signature.
      </p>

      <a href="${signingLink}">
        Click here to sign the document
      </a>
    `,
  });
};

module.exports = sendSigningEmail;