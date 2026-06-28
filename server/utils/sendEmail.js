const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendSigningEmail = async (recipientEmail, signingLink, role = "Signer") => {
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

  await resend.emails.send({
    from: "SignFlow <onboarding@resend.dev>",
    to: recipientEmail,
    subject: `SignFlow - ${roleTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h1 style="color:#4f46e5;">SignFlow</h1>
        <h2>${roleTitle}</h2>
        <p>Hello,</p>
        <p>You have received a document that requires your ${actionText}.</p>
        <p>Please click below to review the document.</p>
        <a href="${signingLink}" style="display:inline-block;padding:12px 20px;background:#4f46e5;color:white;text-decoration:none;border-radius:6px;font-weight:bold;">
          ${
            role === "Signer"
              ? "Review & Sign"
              : role === "Witness"
              ? "Review & Witness"
              : "Review & Approve"
          }
        </a>
        <p>This signing link will expire in 7 days.</p>
      </div>
    `,
  });
};

module.exports = sendSigningEmail;