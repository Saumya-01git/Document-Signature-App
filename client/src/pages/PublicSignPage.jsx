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

  const handleApprove = async () => {
  try {
    await axios.put(
      `http://localhost:5000/api/sign-requests/public/${token}/status`,
      {
        status: "Signed",
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
        <div key={index + 1} className="mb-6 inline-block">
          <Page pageNumber={index + 1} width={700} />
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