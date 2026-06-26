import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import API_URL from "../api";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

function PublicSignPage() {
  const { token } = useParams();

  const [request, setRequest] = useState(null);
  const [documentData, setDocumentData] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [signatureText, setSignatureText] = useState("");
  const [fontStyle, setFontStyle] = useState("Arial");
  const [rotation, setRotation] = useState(0);
  const [signaturePlaced, setSignaturePlaced] = useState(false);
  const [signaturePosition, setSignaturePosition] = useState(null);
  const [existingSignatures, setExistingSignatures] = useState([]);
  const inputClass =
  "border border-slate-300 p-3 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-cyan-400 transition";

const primaryBtn =
  "bg-gradient-to-r from-[#3FB8AF] to-[#40C0CB] hover:from-[#40C0CB] hover:to-[#3FB8AF] active:scale-95 transition-all duration-200 text-white font-semibold px-5 py-3 rounded-2xl shadow-md hover:shadow-xl";

const dangerBtn =
  "bg-gradient-to-r from-[#FF3D7F] to-[#FF9E9D] hover:from-[#FF9E9D] hover:to-[#FF3D7F] active:scale-95 transition-all duration-200 text-white font-semibold px-5 py-3 rounded-2xl shadow-md hover:shadow-xl";

const cardClass =
  "rounded-3xl bg-white/90 backdrop-blur-xl shadow-xl p-6 border border-white/70 text-slate-800";

  const handlePdfClick = (e, pageNumber) => {
  if (request?.status !== "Pending") return;
if (request?.role !== "Signer") return;

  if (!signatureText) {
    alert("Please enter your signature text first");
    return;
  }

  const rect = e.currentTarget.getBoundingClientRect();

  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  setSignaturePosition({
    x,
    y,
    page: pageNumber,
  });

  setSignaturePlaced(true);
};

  const handleApprove = async () => {
  if (request?.role === "Signer" && !signaturePlaced) {
    alert("Please place your signature on the document before approving");
    return;
  }

  try {
    const payload =
      request?.role === "Signer"
        ? {
            status: "Signed",
            signatureText,
            fontStyle,
            rotation,
            x: signaturePosition.x,
            y: signaturePosition.y,
            page: signaturePosition.page,
          }
        : {
            status: "Signed",
          };

    await axios.put(
      `${API_URL}/api/sign-requests/public/${token}/status`,
      payload
    );

    alert(
      request?.role === "Witness"
        ? "Document witnessed successfully"
        : request?.role === "Approver"
        ? "Document approved successfully"
        : "Document signed successfully"
    );

    const res = await axios.get(
      `${API_URL}/api/sign-requests/public/${token}`
    );

    setRequest(res.data.request);
  } catch (error) {
  console.log(error);

  alert(
    error.response?.data?.message ||
      "Unable to complete this action"
  );
}
};

const handleReject = async () => {
  try {
    await axios.put(
      `${API_URL}/api/sign-requests/public/${token}/status`,
      {
        status: "Rejected",
        rejectionReason,
      }
    );

    alert("Document rejected");

    const res = await axios.get(
      `${API_URL}/api/sign-requests/public/${token}`
    );

    setRequest(res.data.request);
  } catch (error) {
  console.log(error);

  alert(
    error.response?.data?.message ||
      "Unable to reject this document"
  );
}
};

  useEffect(() => {
    const validateToken = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/api/sign-requests/public/${token}`
        );

        setRequest(res.data.request);
        const docRes = await axios.get(
  `${API_URL}/api/sign-requests/public/${token}/document`
);


setDocumentData(docRes.data.document);

const sigRes = await axios.get(
  `${API_URL}/api/sign-requests/public/${token}/signatures`
);

setExistingSignatures(sigRes.data.signatures);
      } catch (error) {
        console.log(error);
      }
    };

    validateToken();
  }, [token]);

  return (
  <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#40C0CB_0%,transparent_30%),radial-gradient(circle_at_top_right,#FF3D7F_0%,transparent_25%),linear-gradient(135deg,#0f172a,#134e4a,#1e293b)] p-4 md:p-8">
    <div className="max-w-7xl mx-auto rounded-[2rem] bg-slate-900/45 backdrop-blur-2xl shadow-2xl border border-white/20 p-5 md:p-8 text-white">
      <h1 className="text-5xl font-extrabold tracking-tight">
  🚀 <span className="text-[#FF6B9A]">Sign</span>
  <span className="text-[#40C0CB]">Flow</span>
</h1>

<p className="text-slate-200 mt-2 text-lg">
  <p className="text-slate-200 mt-2 text-lg">
  {request?.role === "Witness"
    ? "Review and witness this document."
    : request?.role === "Approver"
    ? "Review and approve this document."
    : "Review and sign your document securely."}
</p>
</p>

      {request && (
        <div className="mt-6 space-y-6">
          <p>
  {request.role === "Witness"
    ? "Witness Email:"
    : request.role === "Approver"
    ? "Approver Email:"
    : "Signer Email:"}
  {" "}
  {request.signerEmail}
</p>

          <p>
            Status: {request.status}
          </p>
          <p>
  Role:{" "}
  <span
    className={`px-2 py-1 rounded text-white ${
      request.role === "Signer"
        ? "bg-cyan-600"
        : request.role === "Witness"
        ? "bg-purple-600"
        : "bg-pink-600"
    }`}
  >
    {request.role || "Signer"}
  </span>
</p>

          {request.status === "Pending" && request.role === "Signer" && (
  <div className={cardClass}>
    <h3 className="text-lg font-bold mb-3">
  ✍️ Add Your Signature
</h3>

    <div className="grid gap-3 md:grid-cols-3">
      <input
        className={inputClass}
        type="text"
        placeholder="Type your signature"
        value={signatureText}
        onChange={(e) => setSignatureText(e.target.value)}
      />

      <select
        className={inputClass}
        value={fontStyle}
        onChange={(e) => setFontStyle(e.target.value)}
      >
        <option value="Arial">Arial</option>
        <option value="Cursive">Cursive</option>
        <option value="Serif">Serif</option>
        <option value="Monospace">Monospace</option>
      </select>

      <input
        className={inputClass}
        type="number"
        placeholder="Rotation (0°)"
        value={rotation}
        onChange={(e) => setRotation(Number(e.target.value))}
      />
    </div>

    <p className="mt-2 text-sm text-gray-600">
      Type your signature, then click on the PDF where you want to place it.
    </p>
  </div>
)}

          {request.status === "Pending" && (
  <button
    onClick={handleApprove}
    className={primaryBtn}
  >
    {request.role === "Witness"
  ? "👀 Confirm as Witness"
  : request.role === "Approver"
  ? "✅ Approve Document"
  : "✍️ Approve & Sign"}
  </button>
)}

{request.status === "Pending" && (
  <>
    <input
      type="text"
      placeholder="Reason for rejection"
      value={rejectionReason}
      onChange={(e) =>
        setRejectionReason(e.target.value)
      }
      className={`${inputClass} max-w-xs`}
    />

    <button
      onClick={handleReject}
      className={dangerBtn}
    >
      Reject
    </button>
  </>
)}


          {documentData && (
  <div className={cardClass}>
    <h2 className="font-bold text-lg">
      Document Details
    </h2>

    <p>Title: {documentData.title}</p>
    <p>File Name: {documentData.fileName}</p>
    <p>Status: {documentData.status}</p>
  </div>
)}

{documentData && (
  <div className="mt-6 rounded-3xl bg-white/90 border border-white/70 shadow-xl p-4 overflow-auto max-h-[800px]">
    <Document
      file={`${API_URL}/${documentData.filePath}`}
      onLoadSuccess={({ numPages }) => setNumPages(numPages)}
    >
      {Array.from(new Array(numPages), (_, index) => (
        <div
  key={index + 1}
  className="relative mb-6 inline-block cursor-crosshair"
  onClick={(e) => handlePdfClick(e, index + 1)}
>
  <Page pageNumber={index + 1} width={700} />
  {existingSignatures
  .filter((sig) => sig.page === index + 1)
  .map((sig) => (
    <div
      key={sig._id}
      className="absolute border-2 border-blue-500 bg-blue-100 text-blue-700 px-3 py-2 rounded"
      style={{
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
        transform: `rotate(${sig.rotation || 0}deg)`,
      }}
    >
      {sig.signatureText || "Signed"}
    </div>
  ))}

  {signaturePosition?.page === index + 1 && (
    <div
      className="absolute border-2 border-red-500 bg-red-100 text-red-700 px-3 py-2 rounded"
      style={{
        left: `${signaturePosition.x}px`,
        top: `${signaturePosition.y}px`,
        fontFamily:
          fontStyle === "Cursive"
            ? "cursive"
            : fontStyle === "Serif"
            ? "serif"
            : fontStyle === "Monospace"
            ? "monospace"
            : "Arial",
        transform: `rotate(${rotation}deg)`,
      }}
    >
      {signatureText}
    </div>
  )}
</div>
      ))}
    </Document>
  </div>
)}

        </div>
      )}
          </div>
    </div>
  );
}
export default PublicSignPage;