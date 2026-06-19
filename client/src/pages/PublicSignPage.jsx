import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
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

  const handlePdfClick = (e, pageNumber) => {
  if (request?.status !== "Pending") return;

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
    if (!signaturePlaced) {
  alert("Please place your signature on the document before approving");
  return;
}
  try {
    await axios.put(
      `http://localhost:5000/api/sign-requests/public/${token}/status`,
      {
  status: "Signed",
  signatureText,
  fontStyle,
  rotation,
  x: signaturePosition.x,
  y: signaturePosition.y,
  page: signaturePosition.page,
}
    );

    alert("Document signed successfully");

    const res = await axios.get(
      `http://localhost:5000/api/sign-requests/public/${token}`
    );

    setRequest(res.data.request);
  } catch (error) {
    console.log(error);
  }
};

const handleReject = async () => {
  try {
    await axios.put(
      `http://localhost:5000/api/sign-requests/public/${token}/status`,
      {
        status: "Rejected",
        rejectionReason,
      }
    );

    alert("Document rejected");

    const res = await axios.get(
      `http://localhost:5000/api/sign-requests/public/${token}`
    );

    setRequest(res.data.request);
  } catch (error) {
    console.log(error);
  }
};

  useEffect(() => {
    const validateToken = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/sign-requests/public/${token}`
        );

        setRequest(res.data.request);
        const docRes = await axios.get(
  `http://localhost:5000/api/sign-requests/public/${token}/document`
);


setDocumentData(docRes.data.document);
      } catch (error) {
        console.log(error);
      }
    };

    validateToken();
  }, [token]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">
        Sign Document
      </h1>

      <p className="mt-3">
        Token: {token}
      </p>

      {request && (
        <div className="mt-4 border p-4 rounded">
          <p>
            Signer Email: {request.signerEmail}
          </p>

          <p>
            Status: {request.status}
          </p>

          {request.status === "Pending" && (
  <div className="mt-4 border p-4 rounded bg-slate-50">
    <h3 className="font-semibold mb-3">Add Your Signature</h3>

    <div className="grid gap-3 md:grid-cols-3">
      <input
        className="border p-2 rounded"
        type="text"
        placeholder="Type your signature"
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

    <p className="mt-2 text-sm text-gray-600">
      Type your signature, then click on the PDF where you want to place it.
    </p>
  </div>
)}

          {request.status === "Pending" && (
  <button
    onClick={handleApprove}
    className="mt-3 bg-green-600 text-white px-4 py-2 rounded"
  >
    Approve & Sign
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
      className="border p-2 rounded ml-3"
    />

    <button
      onClick={handleReject}
      className="ml-3 bg-red-600 text-white px-4 py-2 rounded"
    >
      Reject
    </button>
  </>
)}


          {documentData && (
  <div className="mt-4 border p-4 rounded">
    <h2 className="font-bold text-lg">
      Document Details
    </h2>

    <p>Title: {documentData.title}</p>
    <p>File Name: {documentData.fileName}</p>
    <p>Status: {documentData.status}</p>
  </div>
)}

{documentData && (
  <div className="mt-6 border rounded bg-gray-200 p-4 overflow-auto max-h-[800px]">
    <Document
      file={`http://localhost:5000/${documentData.filePath}`}
      onLoadSuccess={({ numPages }) => setNumPages(numPages)}
    >
      {Array.from(new Array(numPages), (_, index) => (
        <div
  key={index + 1}
  className="relative mb-6 inline-block cursor-crosshair"
  onClick={(e) => handlePdfClick(e, index + 1)}
>
  <Page pageNumber={index + 1} width={700} />

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
  );
}

export default PublicSignPage;