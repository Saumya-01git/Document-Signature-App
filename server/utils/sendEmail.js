const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  family: 4,
  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000,
});

const sendSigningEmail = async (
  recipientEmail,
  signingLink,
  role = "Signer"
) => {
  let actionText = "signature";
let roleTitle = "Document Signature Request";

if (role === "Witness") {
  actionText = "witness confirmation";
  roleTitle = "Document Witness Request";
}

if (role === "Approver") {
  actionText = "approval";
  roleTitle = "Document Approval Request";
}
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: recipientEmail,
    subject: `SignFlow - ${roleTitle}`,
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
      You have received a document that requires your ${actionText}.
    </p>

    <p>
      Please click the button below to review the document and complete your required action.
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
      ${role === "Signer"
  ? "Review & Sign"
  : role === "Witness"
  ? "Review & Witness"
  : "Review & Approve"}
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