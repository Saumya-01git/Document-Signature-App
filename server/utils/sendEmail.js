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
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">

    <h1 style="color:#4f46e5;">
      SignFlow
    </h1>

    <h2>
      Document Signature Request
    </h2>

    <p>
      Hello,
    </p>

    <p>
      You have received a document that requires your signature.
    </p>

    <p>
      Please click the button below to review and sign the document.
    </p>

    <a
      href="${signingLink}"
      style="
        display:inline-block;
        padding:12px 20px;
        background:#4f46e5;
        color:white;
        text-decoration:none;
        border-radius:6px;
        font-weight:bold;
      "
    >
      Open Document
    </a>

    <p style="margin-top:20px;">
      This signing link will expire in 7 days.
    </p>

    <hr>

    <p style="color:gray;font-size:12px;">
      Powered by SignFlow
    </p>

  </div>
`,
  });
};

module.exports = sendSigningEmail;