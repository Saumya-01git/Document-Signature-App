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

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: "SignFlow",
        email: process.env.EMAIL_USER,
      },
      to: [{ email: recipientEmail }],
      subject: `SignFlow - ${roleTitle}`,
      htmlContent: `
        <h1>SignFlow</h1>
        <h2>${roleTitle}</h2>
        <p>Hello,</p>
        <p>You have received a document that requires your ${actionText}.</p>
        <a href="${signingLink}">Review Document</a>
        <p>This signing link will expire in 7 days.</p>
      `,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("BREVO EMAIL ERROR:", data);
    throw new Error(data.message || "Brevo email failed");
  }

  return data;
};

module.exports = sendSigningEmail;