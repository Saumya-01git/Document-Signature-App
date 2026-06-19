import { useState } from "react";
import axios from "axios";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { DndContext, useDraggable } from "@dnd-kit/core";

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
  const [signingLink, setSigningLink] = useState("");
  const [signRequests, setSignRequests] = useState([]);
  const [signatureText, setSignatureText] = useState("");
  const [fontStyle, setFontStyle] = useState("Arial");
  const [rotation, setRotation] = useState(0);

  const fetchDocuments = async () => {
  console.log("Fetch My Documents clicked");
  console.log("Token:", token);

  if (!token) {
    alert("Please login again");
    window.location.href = "/login";
    return;
  }

  try {
    const res = await axios.get("http://localhost:5000/api/docs", {
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
      setNumPages(null);

      const res = await axios.get(
        `http://localhost:5000/api/signatures/${doc._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSignatures(res.data.signatures);
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
      "http://localhost:5000/api/signatures",
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
  `http://localhost:5000/api/signatures/${selectedDoc._id}`,
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
      `http://localhost:5000/api/signatures/${active.id}`,
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

const filteredDocuments =
  statusFilter === "All"
    ? documents
    : documents.filter((doc) => doc.status === statusFilter);

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
      "http://localhost:5000/api/docs/upload",
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

  if (!signerEmail) {
    alert("Please enter signer email");
    return;
  }

  try {
    const res = await axios.post(
      "http://localhost:5000/api/sign-requests",
      {
        documentId: selectedDoc._id,
        signerEmail,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setSigningLink(res.data.signRequest.signingLink);
    alert("Signing request created successfully");
  } catch (error) {
    console.log(error);
    alert("Failed to create signing request");
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
    const res = await axios.get("http://localhost:5000/api/sign-requests", {
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


  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-xl shadow">
        <h1 className="text-3xl font-bold mb-4">SignFlow Dashboard</h1>
        <button
  className="bg-red-600 text-white px-4 py-2 rounded mb-4"
  onClick={() => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  }}
>
  Logout
</button>


{/* JWT input removed after login system 
        <input
  className="border p-2 rounded w-full mb-3"
  type="text"
  placeholder="Paste JWT token"
  value={token}
  onChange={(e) => setToken(e.target.value)}
/> 
*/}

<div className="mb-4 grid gap-3 md:grid-cols-3">
  <input
    className="border p-2 rounded"
    type="text"
    placeholder="Document title"
    value={uploadTitle}
    onChange={(e) => setUploadTitle(e.target.value)}
  />

  <input
    className="border p-2 rounded"
    type="file"
    accept="application/pdf"
    onChange={(e) => setUploadFile(e.target.files[0])}
  />

  <button
    className="bg-indigo-600 text-white px-4 py-2 rounded"
    onClick={uploadDocument}
  >
    Upload PDF
  </button>
</div>

<button
  className="bg-blue-600 text-white px-4 py-2 rounded mb-6"
  onClick={fetchDocuments}
>
  Fetch My Documents
</button>

<button
  className="bg-slate-700 text-white px-4 py-2 rounded mb-6 ml-3"
  onClick={fetchSignRequests}
>
  Fetch Signing Requests
</button>

        <button
  className="bg-purple-600 text-white px-4 py-2 rounded ml-3"
  onClick={() => setPlacingSignature(true)}
>
  Place Signature
</button>

<div className="mb-6 grid gap-3 md:grid-cols-3">
  <input
    className="border p-2 rounded"
    type="text"
    placeholder="Signature text"
    value={signatureText}
    onChange={(e) => setSignatureText(e.target.value)}
  />

  <select
    className="border p-2 rounded"
    value={fontStyle}
    onChange={(e) => setFontStyle(e.target.value)}
  >
    <option value="Arial">Arial</option>
    <option value="Cursive">Cursive</option>
    <option value="Serif">Serif</option>
    <option value="Monospace">Monospace</option>
  </select>

  <input
    className="border p-2 rounded"
    type="number"
    placeholder="Rotation"
    value={rotation}
    onChange={(e) => setRotation(Number(e.target.value))}
  />
</div>


        <div className="grid gap-4 md:grid-cols-4 mb-6">
  <div className="border rounded p-4 bg-white shadow-sm">
    <h3 className="font-semibold">Total Documents</h3>
    <p className="text-2xl font-bold">{totalDocuments}</p>
  </div>

  <div className="border rounded p-4 bg-yellow-50 shadow-sm">
    <h3 className="font-semibold">Pending</h3>
    <p className="text-2xl font-bold">{pendingDocuments}</p>
  </div>

  <div className="border rounded p-4 bg-green-50 shadow-sm">
    <h3 className="font-semibold">Signed</h3>
    <p className="text-2xl font-bold">{signedDocuments}</p>
  </div>

  <div className="border rounded p-4 bg-red-50 shadow-sm">
    <h3 className="font-semibold">Rejected</h3>
    <p className="text-2xl font-bold">{rejectedDocuments}</p>
  </div>
</div>


        <h2 className="text-xl font-semibold mb-3">Uploaded Documents</h2>

        <div className="mb-4">
  <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
    className="border p-2 rounded"
  >
    <option value="All">All Documents</option>
    <option value="Signed">Signed</option>
    <option value="Pending">Pending</option>
    <option value="Rejected">Rejected</option>
  </select>
</div>

        <div className="grid gap-3 mb-6">
          {filteredDocuments.map((doc) => (
            <div
              key={doc._id}
              className="border rounded p-4 flex justify-between items-center"
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
                          : "bg-yellow-500"
                      }`}
                    >
                      {doc.status}
                    </span>
                  </p>
                <p className="text-sm text-gray-500">File: {doc.fileName}</p>
              </div>

              <button
                className="bg-green-600 text-white px-3 py-2 rounded"
                onClick={() => openDocument(doc)}
              >
                Open with Signature Placeholder
              </button>
            </div>
          ))}
        </div>
        

        {signRequests.length > 0 && (
  <h2 className="text-xl font-semibold mb-3">
    Signing Requests
  </h2>
)}
        

<div className="grid gap-3 mb-6">
  {signRequests.map((req) => (
    <div
      key={req._id}
      className="border rounded p-4"
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


      {req.rejectionReason && (
        <p>Rejection Reason: {req.rejectionReason}</p>
      )}

      <p className="text-sm break-all">
        Link: {req.signingLink || `http://localhost:5173/sign/${req.signingToken}`}
      </p>

      <button
        className="mt-2 bg-gray-800 text-white px-3 py-1 rounded"
        onClick={() =>
  navigator.clipboard.writeText(
    req.signingLink || `http://localhost:5173/sign/${req.signingToken}`
  )
}
      >
        Copy Link
      </button>
    </div>
  ))}
</div>


        {selectedDoc && (
          <div>
            <h2 className="text-xl font-semibold mb-3">
              Preview: {selectedDoc.title}
            </h2>
            {selectedDoc.status === "Rejected" && (
              <div className="mb-4 border border-red-300 bg-red-50 text-red-700 p-3 rounded">
                This document was rejected earlier. You can review it, make changes if needed, and generate a new signing request.
              </div>
            )}
            
            <div className="mb-4 border p-4 rounded bg-slate-50">
  <h3 className="font-semibold mb-2">Create Signing Request</h3>

  <div className="grid gap-3 md:grid-cols-3">
    <input
      className="border p-2 rounded"
      type="email"
      placeholder="Signer email"
      value={signerEmail}
      onChange={(e) => setSignerEmail(e.target.value)}
    />

    <button
      className="bg-orange-600 text-white px-4 py-2 rounded"
      onClick={createSigningRequest}
    >
      Generate Signing Link
    </button>

    {signingLink && (
      <button
        className="bg-gray-800 text-white px-4 py-2 rounded"
        onClick={() => navigator.clipboard.writeText(signingLink)}
      >
        Copy Link
      </button>
    )}
  </div>

  {signingLink && (
    <p className="mt-3 text-sm break-all">
      Signing Link: {signingLink}
    </p>
  )}
</div>  


            <div className="border rounded bg-gray-200 p-4 overflow-auto max-h-[800px]">
              <DndContext onDragEnd={handleDragEnd}>
              <Document
                file={`http://localhost:5000/${selectedDoc.filePath}`}
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
          </div>
        )}
      </div>
    </div>
  );
}

export default App;