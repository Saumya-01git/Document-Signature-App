import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { DndContext, useDraggable } from "@dnd-kit/core";
import API_URL from "./api";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

function DraggableSignature({ sig }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: sig._id,
  });

  const style = {
  left: `${sig.x}px`,
  top: `${sig.y}px`,
  fontFamily:
    sig.fontStyle === "Cursive"
      ? "cursive"
      : sig.fontStyle === "Serif"
      ? "serif"
      : sig.fontStyle === "Monospace"
      ? "monospace"
      : "Arial",
  transform: transform
    ? `translate3d(${transform.x}px, ${transform.y}px, 0) rotate(${sig.rotation || 0}deg)`
    : `rotate(${sig.rotation || 0}deg)`,
};
  

  return (
    <div
  ref={setNodeRef}
  {...listeners}
  {...attributes}
  onClick={(e) => e.stopPropagation()}
  className="absolute z-20 border-2 border-red-500 bg-red-100 text-red-700 px-3 py-2 rounded cursor-move select-none touch-none"
  style={style}
>
      {sig.signatureText || "Signature Here"}
    </div>
  );
}


function App() {
  const [token, setToken] = useState(
  localStorage.getItem("token") || ""
);
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [signatures, setSignatures] = useState([]);
  const [numPages, setNumPages] = useState(null);
  const [placingSignature, setPlacingSignature] = useState(false);
  const [dragPosition, setDragPosition] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [signerEmail, setSignerEmail] = useState("");
const [witnessEmail, setWitnessEmail] = useState("");
const [approverEmail, setApproverEmail] = useState("");
  const [signingLink, setSigningLink] = useState("");
  const [signRequests, setSignRequests] = useState([]);
  const [documentRequests, setDocumentRequests] = useState([]);
  const [signatureText, setSignatureText] = useState("");
  const [fontStyle, setFontStyle] = useState("Arial");
  const [rotation, setRotation] = useState(0);
  const [signedPdfLink, setSignedPdfLink] = useState("");
  const [auditLogs, setAuditLogs] = useState([]);
  const [progress, setProgress] = useState(null);
  const [activeView, setActiveView] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const documentsRef = useRef(null);
const requestsRef = useRef(null);
const uploadRef = useRef(null);
const documentRequestsRef = useRef(null);
const workspaceRef = useRef(null);


  const cardClass =
  "rounded-3xl bg-white/90 backdrop-blur-xl shadow-xl p-6 border border-white/70 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 text-slate-800";
const inputClass =
  "border border-slate-300 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 transition";

const primaryBtn =
  "bg-gradient-to-r from-[#3FB8AF] to-[#40C0CB] hover:from-[#40C0CB] hover:to-[#3FB8AF] active:scale-95 transition-all duration-200 text-white font-semibold px-5 py-3 rounded-2xl shadow-md hover:shadow-xl";

const successBtn =
  "bg-gradient-to-r from-[#7FC7AF] to-[#3FB8AF] hover:from-[#3FB8AF] hover:to-[#7FC7AF] active:scale-95 transition-all duration-200 text-white font-semibold px-5 py-3 rounded-2xl shadow-md hover:shadow-xl";

const dangerBtn =
  "bg-gradient-to-r from-[#FF3D7F] to-[#FF9E9D] hover:from-[#FF9E9D] hover:to-[#FF3D7F] active:scale-95 transition-all duration-200 text-white font-semibold px-5 py-3 rounded-2xl shadow-md hover:shadow-xl";

const darkBtn =
  "bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:from-[#8B5CF6] hover:to-[#6366F1] active:scale-95 transition-all duration-200 text-white font-semibold px-5 py-3 rounded-2xl shadow-md hover:shadow-xl";
const actionBtn =
  "bg-gradient-to-r from-[#3FB8AF] to-[#40C0CB] hover:from-[#40C0CB] hover:to-[#3FB8AF] active:scale-95 transition-all duration-200 text-white font-semibold px-5 py-3 rounded-2xl shadow-md hover:shadow-xl";

  if (!token) {
  window.location.href = "/login";
  return null;
}

  useEffect(() => {
  if (token) {
    fetchDocuments();
    fetchSignRequests();
  }
}, [token]);

  const fetchDocuments = async () => {
  console.log("Fetch My Documents clicked");
  console.log("Token:", token);

  if (!token) {
    alert("Please login again");
    window.location.href = "/login";
    return;
  }

  try {
    const res = await axios.get(`${API_URL}/api/docs`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("Documents response:", res.data);
    setDocuments(res.data.documents);
  } catch (error) {
    console.log("Fetch documents error:", error);
    alert("Failed to fetch documents");
  }
};

  const openDocument = async (doc) => {
    try {
      setSelectedDoc(doc);
setActiveView("workspace");
setTimeout(() => {
  workspaceRef.current?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}, 100);
setNumPages(null);
setAuditLogs([]);
setSignedPdfLink("");
setSigningLink("");

      const res = await axios.get(
        `${API_URL}/api/signatures/${doc._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSignatures(res.data.signatures);
      const progressRes = await axios.get(
  `${API_URL}/api/sign-requests/progress/${doc._id}`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

setProgress(progressRes.data);
const docReqRes = await axios.get(
  `${API_URL}/api/sign-requests/document/${doc._id}`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

setDocumentRequests(docReqRes.data.requests);
    } catch (error) {
      alert("Failed to fetch signatures");
      console.log(error);
    }
  };
  
  const handlePdfClick = async (e, pageNumber) => {
  if (!placingSignature || !selectedDoc) return;

  const rect = e.currentTarget.getBoundingClientRect();

  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  try {
    await axios.post(
  `${API_URL}/api/signatures`,
      {
        documentId: selectedDoc._id,
        x,
        y,
        page: pageNumber,
        signatureText: signatureText || "Signed by SignFlow",
        fontStyle,
        rotation,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    alert("Signature placed successfully");
    setPlacingSignature(false);

const res = await axios.get(
  `${API_URL}/api/signatures/${selectedDoc._id}`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

setSignatures(res.data.signatures);
  } catch (error) {
    console.log(error);
    alert("Failed to place signature");
  }
};

const handleDragEnd = async (event) => {
  const { active, delta } = event;

  const draggedSignature = signatures.find((sig) => sig._id === active.id);

  if (!draggedSignature) return;

  const updatedX = draggedSignature.x + delta.x;
  const updatedY = draggedSignature.y + delta.y;

  setSignatures((prev) =>
    prev.map((sig) =>
      sig._id === active.id
        ? {
            ...sig,
            x: updatedX,
            y: updatedY,
          }
        : sig
    )
  );


  try {
    await axios.put(
      `${API_URL}/api/signatures/${active.id}`,
      {
  x: updatedX,
  y: updatedY,
  page: draggedSignature.page,
  signatureText: draggedSignature.signatureText,
  fontStyle: draggedSignature.fontStyle,
  rotation: draggedSignature.rotation,
},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  } catch (error) {
    console.log(error);
    alert("Failed to save dragged position");
  }
};

const filteredDocuments = documents.filter((doc) => {
  const matchesStatus =
    statusFilter === "All" || doc.status === statusFilter;

  const matchesSearch =
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.fileName.toLowerCase().includes(searchTerm.toLowerCase());

  return matchesStatus && matchesSearch;
});

const totalDocuments = documents.length;
const pendingDocuments = documents.filter(
  (doc) => doc.status === "Pending"
).length;
const signedDocuments = documents.filter(
  (doc) => doc.status === "Signed"
).length;
const rejectedDocuments = documents.filter(
  (doc) => doc.status === "Rejected"
).length;
const partiallySignedDocuments = documents.filter(
  (doc) => doc.status === "Partially Signed"
).length;

    const uploadDocument = async () => {
  if (!uploadTitle || !uploadFile) {
    alert("Please enter title and select PDF");
    return;
  }

  const formData = new FormData();
  formData.append("title", uploadTitle);
  formData.append("pdf", uploadFile);

  try {
    await axios.post(
      `${API_URL}/api/docs/upload`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    alert("PDF uploaded successfully");
    setUploadTitle("");
    setUploadFile(null);
    fetchDocuments();
  } catch (error) {
    console.log(error);
    alert("Failed to upload PDF");
  }
};

const createSigningRequest = async () => {
  if (!selectedDoc) {
    alert("Please open/select a document first");
    return;
  }

  if (selectedDoc.status === "Signed") {
    alert("This document is already signed.");
    return;
  }

  if (!signerEmail) {
    alert("Please enter signer email");
    return;
  }

  try {
    const res = await axios.post(
      `${API_URL}/api/sign-requests`,
      {
        documentId: selectedDoc._id,
        signerEmail,
        witnessEmail,
        approverEmail,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setSigningLink(res.data.signRequest.signingLink);

    alert("Workflow created. Email sent to signer first.");

    setSignerEmail("");
    setWitnessEmail("");
    setApproverEmail("");

    const docReqRes = await axios.get(
      `${API_URL}/api/sign-requests/document/${selectedDoc._id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setDocumentRequests(docReqRes.data.requests);
  } catch (error) {
    console.log(error);
    alert(
      error.response?.data?.message ||
        "Failed to create workflow"
    );
  }
};

const fetchSignRequests = async () => {
  console.log("Fetch Signing Requests clicked");
  console.log("Token:", token);

  if (!token) {
    alert("Please login again");
    window.location.href = "/login";
    return;
  }

  try {
    const res = await axios.get(`${API_URL}/api/sign-requests`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Sign requests response:", res.data);
    setSignRequests(res.data.requests);
  } catch (error) {
    console.log("Fetch sign requests error:", error);
    alert("Failed to fetch signing requests");
  }
};

const deleteSignRequest = async (id) => {
  try {
    await axios.delete(
      `${API_URL}/api/sign-requests/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    alert("Signing request deleted");

    if (selectedDoc) {
  const docReqRes = await axios.get(
    `${API_URL}/api/sign-requests/document/${selectedDoc._id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  setDocumentRequests(docReqRes.data.requests);
}
  } catch (error) {
    console.log(error);
    alert("Failed to delete signing request");
  }
};

const deleteDocument = async (id) => {
  const confirmDelete = window.confirm(
    "Delete this document?"
  );

  if (!confirmDelete) return;

  try {
    await axios.delete(
      `${API_URL}/api/docs/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    alert("Document deleted successfully");

await fetchDocuments();
await fetchSignRequests();

if (selectedDoc?._id === id) {
      setSelectedDoc(null);
setActiveView("dashboard");
    }
  } catch (error) {
    console.log(error);
    alert("Failed to delete document");
  }
};

const resendSignRequest = async (id) => {
  try {
    await axios.post(
      `${API_URL}/api/sign-requests/${id}/resend`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    alert("Signing request email resent successfully");
  } catch (error) {
    console.log(error);
    alert(
      error.response?.data?.message ||
        "Failed to resend signing request"
    );
  }
};

const finalizeDocument = async () => {
  if (!selectedDoc) {
    alert("Please open/select a document first");
    return;
  }

  try {
    const res = await axios.post(
      `${API_URL}/api/signatures/finalize`,
      {
        documentId: selectedDoc._id,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const link = `${API_URL}/${res.data.signedPdf}`;
    setSignedPdfLink(link);

    alert("Final signed PDF generated");
  } catch (error) {
    console.log(error);
    alert("Failed to generate signed PDF");
  }
};

const fetchAuditLogs = async () => {
  if (!selectedDoc) {
    alert("Please open/select a document first");
    return;
  }

  try {
    const res = await axios.get(
  `${API_URL}/api/audit/${selectedDoc._id}`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

if (res.data.logs.length === 0) {
  alert("No audit records found for this document.");
  setAuditLogs([]);
  return;
}

setAuditLogs(res.data.logs);
  } catch (error) {
    console.log(error);
    alert("Failed to fetch audit logs");
  }
};

const downloadAuditReport = async () => {
  if (!selectedDoc) {
    alert("Please open/select a document first");
    return;
  }

  try {
    const response = await axios.get(
      `${API_URL}/api/audit/${selectedDoc._id}/report`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob",
      }
    );

    const url = window.URL.createObjectURL(
      new Blob([response.data])
    );

    const link = document.createElement("a");

    link.href = url;
    link.setAttribute(
      "download",
      `audit-report-${selectedDoc.title}.pdf`
    );

    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.log(error);
    alert("Failed to download audit report");
  }
};

const fetchProgress = async () => {
  if (!selectedDoc) return;

  try {
    const res = await axios.get(
      `${API_URL}/api/sign-requests/progress/${selectedDoc._id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setProgress(res.data);
  } catch (error) {
    console.log(error);
  }
};


  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#40C0CB_0%,transparent_30%),radial-gradient(circle_at_top_right,#FF3D7F_0%,transparent_25%),linear-gradient(135deg,#0f172a,#134e4a,#1e293b)] p-4 md:p-8">
      <div className="w-full max-w-7xl mx-auto rounded-[2rem] bg-slate-900/45 backdrop-blur-2xl shadow-2xl border border-white/20 p-5 md:p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
  <div>
    <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-[#FF3D7F] via-[#40C0CB] to-[#3FB8AF] bg-clip-text text-transparent leading-tight">
  🚀 SignFlow
</h1>
    <p className="text-slate-200 mt-2 text-lg">
      Smart document signing, audit tracking and PDF management.
    </p>
  </div>

  <button
    className={`${dangerBtn} h-fit`}
    onClick={() => {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }}
  >
    Logout
  </button>
</div>

<div className="flex flex-wrap gap-3 mb-6">
  <button
    className={`${primaryBtn} min-w-[180px]`}
    onClick={() =>
      uploadRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  >
    Upload New
  </button>

  <button
    className={`${successBtn} min-w-[180px]`}
    onClick={() =>
      documentsRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  >
    View Documents
  </button>

  {/* <button
    className={darkBtn}
    onClick={() =>
      requestsRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  >
    Signing Requests
  </button> */}
</div>


{/* JWT input removed after login system 
        <input
  className="border p-2 rounded w-full mb-3"
  type="text"
  placeholder="Paste JWT token"
  value={token}
  onChange={(e) => setToken(e.target.value)}
/> 
*/}

<div ref={uploadRef} className="mb-4 grid gap-3 md:grid-cols-3">
  <input
    className={inputClass}
    type="text"
    placeholder="Document title"
    value={uploadTitle}
    onChange={(e) => setUploadTitle(e.target.value)}
  />

  <input
    className={inputClass}
    type="file"
    accept="application/pdf"
    onChange={(e) => setUploadFile(e.target.files[0])}
  />

  <button
    className={actionBtn}
    onClick={uploadDocument}
  >
    Upload PDF
  </button>
</div>



        <div className="grid gap-4 md:grid-cols-5 mb-6">
  <div className={cardClass}>
    <h3 className="font-semibold">Total Documents</h3>
    <p className="text-2xl font-bold">{totalDocuments}</p>
  </div>

  <div className={cardClass}>
    <h3 className="font-semibold">Pending</h3>
    <p className="text-2xl font-bold">{pendingDocuments}</p>
  </div>

  <div className={cardClass}>
    <h3 className="font-semibold">Signed</h3>
    <p className="text-2xl font-bold">{signedDocuments}</p>
  </div>

  <div className={cardClass}>
    <h3 className="font-semibold">Rejected</h3>
    <p className="text-2xl font-bold">{rejectedDocuments}</p>
  </div>

  <div className={cardClass}>
  <h3 className="font-semibold">Partially Signed</h3>
  <p className="text-2xl font-bold">{partiallySignedDocuments}</p>
</div>
</div>


        {activeView === "dashboard" && (
  <>
        <h2 ref={documentsRef} className="text-xl font-semibold mb-3">
  Uploaded Documents ({filteredDocuments.length})
</h2>

<input
  className={`${inputClass} mb-4`}
  type="text"
  placeholder="Search documents by title or file name..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
/>

        <div className="mb-4">
  <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
    className="border border-white/60 bg-white text-slate-800 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400"
  >
    <option value="All">All Documents</option>
    <option value="Signed">Signed</option>
    <option value="Pending">Pending</option>
    <option value="Rejected">Rejected</option>
    <option value="Partially Signed">Partially Signed</option>
  </select>
</div>

{filteredDocuments.length === 0 && (
  <div className={cardClass}>
    No documents match your search. Upload a PDF to get started.
  </div>
)}

        <div className="grid gap-3 mb-6">
          {filteredDocuments.map((doc) => (
            <div
              key={doc._id}
              className="border border-white/60 rounded-3xl p-5 flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-white/90 backdrop-blur-xl shadow-lg hover:shadow-2xl transition-all duration-300 text-slate-800"
            >
              <div>
                <h3 className="font-semibold">{doc.title}</h3>
                <p>
                    Status:
                    <span
                      className={`ml-2 px-2 py-1 rounded text-white ${
                        doc.status === "Signed"
  ? "bg-green-600"
  : doc.status === "Rejected"
  ? "bg-red-600"
  : doc.status === "Partially Signed"
  ? "bg-blue-600"
  : "bg-yellow-500"
                      }`}
                    >
                      {doc.status}
                    </span>
                  </p>
                <p className="text-sm text-gray-500">File: {doc.fileName}</p>
              </div>

              <p className="text-sm text-gray-500">
  Uploaded:{" "}
  {new Date(doc.createdAt).toLocaleDateString()}
</p>

              <button
                className={actionBtn}
                onClick={() => openDocument(doc)}
              >
                Open Document
              </button>
              
              <button
  className={darkBtn}
  onClick={async () => {
    await openDocument(doc);

    setTimeout(() => {
      documentRequestsRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }, 500);
  }}
>
  Signing Requests
</button>
<button
  className={dangerBtn}
  onClick={() => deleteDocument(doc._id)}
>
  Delete
</button>
            </div>
          ))}
        </div>
        

        {/* <h2 ref={requestsRef} className="text-xl font-semibold mb-3">
  Signing Requests
</h2>
        
{signRequests.length === 0 && (
  <div className={cardClass}>
    No signing requests found yet.
  </div>
)}

<div className="grid gap-3 mb-6">
  {signRequests.map((req) => (
    <div
      key={req._id}
      className="border border-slate-200 rounded-2xl p-4 bg-white/80 hover:shadow-lg transition-all duration-300"
    >
      <p>Signer Email: {req.signerEmail}</p>
      <p>
  Status:
  <span
    className={`ml-2 px-2 py-1 rounded text-white ${
      req.status === "Signed"
        ? "bg-green-600"
        : req.status === "Rejected"
        ? "bg-red-600"
        : "bg-yellow-500"
    }`}
  >
    {req.status}
  </span>
</p>

<p>
  Created: {new Date(req.createdAt).toLocaleString()}
</p>

<p>
  Updated: {new Date(req.updatedAt).toLocaleString()}
</p>

<p>
  Expires:{" "}
  {req.expiresAt
    ? new Date(req.expiresAt).toLocaleString()
    : "No expiry"}
</p>

{req.expiresAt &&
  new Date() > new Date(req.expiresAt) && (
    <p className="text-red-600 font-semibold">
      Expired
    </p>
)}

      {req.rejectionReason && (
        <p>Rejection Reason: {req.rejectionReason}</p>
      )}

      <p className="text-sm break-all">
        Link: {req.signingLink || `http://localhost:5173/sign/${req.signingToken}`}
      </p>

      <div className="mt-2 flex gap-2">
  <button
    className={darkBtn}
    onClick={() =>
      navigator.clipboard.writeText(
        req.signingLink ||
          `http://localhost:5173/sign/${req.signingToken}`
      )
    }
  >
    Copy Link
  </button>

  {req.status === "Pending" &&
 !(req.expiresAt &&
   new Date() > new Date(req.expiresAt)) && (
  <button
    className={primaryBtn}
    onClick={() => resendSignRequest(req._id)}
  >
    Resend Email
  </button>
)}

  <button
    className={dangerBtn}
    onClick={() => deleteSignRequest(req._id)}
  >
    Delete
  </button>
</div>
    </div>
  ))}
</div> */}

          </>
)}
        {activeView === "workspace" && selectedDoc && (
  <div ref={workspaceRef}>
    <button
      className={`${darkBtn} mb-4`}
      onClick={() => setActiveView("dashboard")}
    >
      ← Back to Dashboard
    </button>
            <h2 className="text-xl font-semibold mb-3">
              Preview: {selectedDoc.title}
            </h2>

            <div className="mb-6 rounded-3xl bg-white/85 border border-white/70 shadow-xl p-6 text-slate-800">
  <h3 className="text-lg font-bold mb-2">
    Add Signature
  </h3>

  <p className="text-sm text-gray-600 mb-4">
    Type the signature text, click “Place Signature”, then click anywhere on the PDF where you want the signature to appear.
  </p>

  <div className="grid gap-3 md:grid-cols-3 mb-4">
    <input
      className={inputClass}
      type="text"
      placeholder="Enter signature name"
      value={signatureText}
      onChange={(e) => setSignatureText(e.target.value)}
    />

    <select
      className={inputClass}
      value={fontStyle}
      onChange={(e) => setFontStyle(e.target.value)}
    >
      <option value="Arial">Simple</option>
      <option value="Cursive">Cursive Signature</option>
      <option value="Serif">Formal</option>
      <option value="Monospace">Typed Style</option>
    </select>

    <input
      className={inputClass}
      type="number"
      placeholder="Rotation (0°)"
      value={rotation}
      onChange={(e) => setRotation(Number(e.target.value))}
    />
  </div>

  <p className="text-xs text-gray-500 mb-4">
    Tilt angle means rotation in degrees. Use 0 for straight, 10 for slight right tilt, and -10 for slight left tilt.
  </p>

  <button
    className={`font-semibold px-5 py-3 rounded-2xl text-white shadow-md hover:shadow-xl active:scale-95 transition-all duration-200 ${
      selectedDoc?.status === "Signed"
        ? "bg-gray-400 cursor-not-allowed"
        : "bg-gradient-to-r from-purple-600 to-[#FF3D7F] hover:from-[#FF3D7F] hover:to-purple-600"
    }`}
    disabled={selectedDoc?.status === "Signed"}
    onClick={() => setPlacingSignature(true)}
  >
    ✍️ Place Signature on PDF
  </button>
</div>

            {progress && (
  <div className="mb-6 rounded-3xl bg-white/85 border border-white/70 shadow-xl p-6 text-slate-800">
    <h3 className="font-semibold mb-3">
      Signing Progress
    </h3>

    <div className="grid md:grid-cols-4 gap-3">
      <div>Total: {progress.total}</div>
      <div>Completed: {progress.signed}</div>
      <div>Pending: {progress.pending}</div>
      <div>Rejected: {progress.rejected}</div>
    </div>

    <div className="mt-3 w-full bg-gray-300 rounded h-4">
      <div
        className="bg-green-600 h-4 rounded"
        style={{
          width: `${progress.percentage}%`,
        }}
      />
    </div>

    <p className="mt-2 font-medium">
      {progress.percentage}% Completed
    </p>
  </div>
)}
            <button
  className={`${successBtn} mb-4`}
  onClick={finalizeDocument}
>
  Finalize & Generate Signed PDF
</button>

<button
  className={`${darkBtn} ml-3 mb-4`}
  onClick={fetchAuditLogs}
>
  View Audit Trail
</button>

<button
  className={`${actionBtn} ml-3 mb-4`}
  onClick={downloadAuditReport}
>
  Download Audit Report
</button>

{auditLogs.length > 0 && (
  <div className="mb-4 border rounded p-4 bg-slate-50">
    <div className="flex justify-between items-center mb-3">
      <h3 className="font-semibold">Audit Trail</h3>

      <button
        className={dangerBtn}
        onClick={() => setAuditLogs([])}
      >
        Close
      </button>
    </div>

    <div className="space-y-3">
      {auditLogs.map((log) => (
        <div
          key={log._id}
          className="border rounded p-3 bg-white"
        >
          <p>Action: {log.action}</p>
          <p>User: {log.userEmail}</p>
          <p>IP Address: {log.ipAddress}</p>
          <p>
            Time: {new Date(log.createdAt).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  </div>
)}

{signedPdfLink && (
  <a
    href={signedPdfLink}
    target="_blank"
    className="ml-3 bg-blue-700 text-white px-4 py-2 rounded inline-block"
  >
    Download Signed PDF
  </a>
)}
            {selectedDoc.status === "Rejected" && (
              <div className="mb-4 border border-red-300 bg-red-50 text-red-700 p-3 rounded">
                This document was rejected earlier. You can review it, make changes if needed, and generate a new signing request.
              </div>
            )}
            
            <div className="mb-6 rounded-3xl bg-white/90 border border-white/70 shadow-xl p-6 text-slate-800">
  <h3 className="font-semibold mb-2">
    Create Sequential Workflow
  </h3>

  <p className="text-sm text-gray-500 mb-4">
    Email will be sent to all signers first. After all signers complete, witness gets email. After witness completes, approver gets email.
  </p>

  <div className="grid gap-3 md:grid-cols-3">
    <input
      className={inputClass}
      type="email"
      placeholder="Signer email(s) separated by commas *"
      value={signerEmail}
      onChange={(e) => setSignerEmail(e.target.value)}
    />

    <input
      className={inputClass}
      type="email"
      placeholder="Witness email optional"
      value={witnessEmail}
      onChange={(e) => setWitnessEmail(e.target.value)}
    />

    <input
      className={inputClass}
      type="email"
      placeholder="Approver email optional"
      value={approverEmail}
      onChange={(e) => setApproverEmail(e.target.value)}
    />
  </div>

  <button
    className={`${actionBtn} mt-4`}
    onClick={createSigningRequest}
    disabled={selectedDoc.status === "Signed"}
  >
    Create Workflow
  </button>

  {signingLink && (
    <p className="mt-3 text-sm break-all">
      First Signing Link: {signingLink}
    </p>
  )}
</div>

            <div className="border rounded bg-gray-200 p-4 overflow-auto max-h-[800px]">
              <DndContext onDragEnd={handleDragEnd}>
              <Document
                file={`${API_URL}/${selectedDoc.filePath}`}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              >
                {Array.from(new Array(numPages), (_, index) => (
                  <div
  key={index + 1}
  className="relative mb-6 inline-block cursor-crosshair"
  onClick={(e) => handlePdfClick(e, index + 1)}
>
                    <Page pageNumber={index + 1} width={700} />

                    {signatures
                      .filter((sig) => sig.page === index + 1)
                      .map((sig) => (
                        <DraggableSignature key={sig._id} sig={sig} />
                      ))}
                  </div>
                ))}
              </Document>
              </DndContext>
            </div>
            <div ref={documentRequestsRef}>
  <h3 className="font-semibold mb-3 mt-4">
    Signing Requests For This Document
  </h3>

{documentRequests.length === 0 && (
  <div className={cardClass}>
    No signing requests for this document.
  </div>
)}

<div className="grid gap-3 mb-6">
  {documentRequests.map((req) => (
    <div
      key={req._id}
      className="rounded-3xl bg-white/90 border border-white/70 shadow-xl p-6 text-slate-800"
    >
      <p>
  <strong>Signer:</strong> {req.signerEmail}
</p>
<p>
  <strong>Role:</strong>{" "}
  <span
    className={`px-2 py-1 rounded text-white ${
      req.role === "Signer"
        ? "bg-cyan-600"
        : req.role === "Witness"
        ? "bg-purple-600"
        : "bg-pink-600"
    }`}
  >
    {req.role || "Signer"}
  </span>
</p>
<p>
  <strong>Status:</strong>

  <span
    className={`ml-2 px-2 py-1 rounded text-white ${
      req.status === "Signed"
        ? "bg-green-600"
        : req.status === "Rejected"
        ? "bg-red-600"
        : "bg-yellow-500"
    }`}
  >
    {req.status}
  </span>
</p>
<p className="text-sm text-gray-500 mt-2">
  Created:
  {new Date(req.createdAt).toLocaleString()}
</p>
      <div className="mt-2 flex gap-2">
        {req.status === "Pending" && (
  <button
    className={primaryBtn}
    onClick={() => resendSignRequest(req._id)}
  >
    Resend Email
  </button>
)}

        <button
          className={dangerBtn}
          onClick={() => deleteSignRequest(req._id)}
        >
          Delete
        </button>
      </div>
    </div>
  ))}
</div>
</div>
          </div>
        )}
      </div>
    </div>
    
    
  );
}

export default App;