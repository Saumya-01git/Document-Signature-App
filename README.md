# SignFlow - Document Signature Workflow App

🔗 **Live Demo:** https://document-signature-app-murex.vercel.app/
📂 **GitHub Repository:** https://github.com/Saumya-01git/Document-Signature-App

---

## 📌 Project Overview

**SignFlow** is a full-stack document signature workflow application that allows users to upload PDF documents, place signatures, create sequential signing workflows, send signing links through email, track signing progress, maintain audit trails, and generate final signed PDFs.

The project is built using the **MERN stack** and is deployed using **Vercel** for the frontend and **Render** for the backend.

---

## ✨ Key Features

* User registration and login using JWT authentication
* Secure PDF upload and document management
* PDF preview inside the application
* Signature placement on PDF pages
* Draggable signature positioning
* Sequential signing workflow
* Multiple signer support
* Witness and approver roles
* Email-based signing links
* Reject/sign workflow actions
* Document-wise signing progress
* Audit trail for each document
* Downloadable audit report PDF
* Final signed PDF generation
* Search and status filter for documents
* Responsive dashboard UI

---

## 🔐 Authentication

The application uses JWT-based authentication.

Users can:

* Register with name, email, and password
* Login securely
* Access only their own uploaded documents
* Create workflows only for their own documents

---

## 🧾 Workflow Logic

SignFlow follows a sequential document signing process:

1. The document owner uploads a PDF.
2. The owner places a signature position on the PDF.
3. The owner creates a workflow by entering:

   * Signer email(s)
   * Optional witness email
   * Optional approver email
4. Emails are sent to all signers first.
5. Witness receives the email only after all signers complete signing.
6. Approver receives the email only after witness confirmation.
7. If any participant rejects the document, the workflow stops.
8. Audit logs are created for signing and rejection actions.

---

## 🛠️ Tech Stack

### Frontend

* React.js
* Vite
* Tailwind CSS
* Axios
* React PDF
* DnD Kit

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT
* Bcrypt.js
* Multer
* PDF-Lib
* Nodemailer / Brevo Email API

### Deployment

* Frontend: Vercel
* Backend: Render
* Database: MongoDB Atlas

---

## 📁 Project Structure

```bash
Document-Signature-App/
│
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   └── main.jsx
│   └── package.json
│
├── server/
│   ├── config/
│   │   └── db.js
│   │
│   ├── middleware/
│   │   └── authMiddleware.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Document.js
│   │   ├── Signature.js
│   │   ├── SignRequest.js
│   │   └── AuditLog.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── documentRoutes.js
│   │   ├── signatureRoutes.js
│   │   ├── signRequestRoutes.js
│   │   └── auditRoutes.js
│   │
│   ├── utils/
│   │   └── sendEmail.js
│   │
│   ├── uploads/
│   ├── server.js
│   └── package.json
```

---

## ⚙️ Environment Variables

### Server `.env`

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=https://document-signature-app-murex.vercel.app
EMAIL_USER=your_sender_email
BREVO_API_KEY=your_brevo_api_key
```

### Client `.env`

```env
VITE_API_URL=your_backend_render_url
```

Example:

```env
VITE_API_URL=https://your-backend-name.onrender.com
```

---

## 🚀 How to Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/Saumya-01git/Document-Signature-App.git
cd Document-Signature-App
```

### 2. Run backend

```bash
cd server
npm install
npm run dev
```

### 3. Run frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

---

## 📤 Deployment

### Frontend Deployment

The frontend is deployed on **Vercel**.

Live URL:

```bash
https://document-signature-app-murex.vercel.app/
```

### Backend Deployment

The backend is deployed on **Render**.

The frontend communicates with the backend using the `VITE_API_URL` environment variable.

---

## 📧 Email Service

The app uses an email service to send signing links to signers, witnesses, and approvers.

Emails contain:

* Document review link
* Participant role
* Signing action button
* Workflow instructions

For production usage, a verified sender/domain is recommended for better email deliverability.

---

## 🧪 Main API Routes

### Auth Routes

```bash
POST /api/auth/register
POST /api/auth/login
```

### Document Routes

```bash
POST /api/docs/upload
GET /api/docs
DELETE /api/docs/:id
```

### Signature Routes

```bash
POST /api/signatures
GET /api/signatures/:documentId
PUT /api/signatures/:id
POST /api/signatures/finalize
```

### Signing Workflow Routes

```bash
POST /api/sign-requests
GET /api/sign-requests
GET /api/sign-requests/document/:documentId
PUT /api/sign-requests/public/:token/status
POST /api/sign-requests/:id/resend
DELETE /api/sign-requests/:id
```

### Audit Routes

```bash
GET /api/audit/:docId
GET /api/audit/:docId/report
```

---

## 📊 Audit Trail

Each document has its own audit trail.

The audit trail stores:

* Action performed
* User email
* IP address
* Timestamp

Users can also download the audit report as a PDF.

---

## 📄 Final Signed PDF

After the signing process is completed, the document owner can generate and download the final signed PDF with signatures placed on the document.

---

## ✅ Current Status

The project currently supports:

* Document upload
* Signature placement
* Sequential workflow creation
* Email-based signing
* Audit tracking
* Audit report download
* Final signed PDF generation
* Deployment-ready frontend and backend

---

## 👩‍💻 Developed By

**Saumya**
B.Tech Computer Science and Engineering
VIT Chennai

---

## 📌 Note

This project is developed as a full-stack academic project to demonstrate document signing workflow automation, secure authentication, PDF handling, email notifications, and audit tracking.
