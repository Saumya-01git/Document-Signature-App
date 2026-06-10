import { useState } from "react";
import axios from "axios";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

function App() {
  const [token, setToken] = useState("");
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [signatures, setSignatures] = useState([]);
  const [numPages, setNumPages] = useState(null);

  const fetchDocuments = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/docs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocuments(res.data.documents);
    } catch (error) {
      alert("Failed to fetch documents");
      console.log(error);
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

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-xl shadow">
        <h1 className="text-3xl font-bold mb-4">SignFlow Dashboard</h1>

        <input
          className="border p-2 rounded w-full mb-3"
          type="text"
          placeholder="Paste JWT token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />

        <button
          className="bg-blue-600 text-white px-4 py-2 rounded mb-6"
          onClick={fetchDocuments}
        >
          Fetch My Documents
        </button>

        <h2 className="text-xl font-semibold mb-3">Uploaded Documents</h2>

        <div className="grid gap-3 mb-6">
          {documents.map((doc) => (
            <div
              key={doc._id}
              className="border rounded p-4 flex justify-between items-center"
            >
              <div>
                <h3 className="font-semibold">{doc.title}</h3>
                <p>Status: {doc.status}</p>
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

        {selectedDoc && (
          <div>
            <h2 className="text-xl font-semibold mb-3">
              Preview: {selectedDoc.title}
            </h2>

            <div className="border rounded bg-gray-200 p-4 overflow-auto">
              <Document
                file={`http://localhost:5000/${selectedDoc.filePath}`}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              >
                {Array.from(new Array(numPages), (_, index) => (
                  <div key={index + 1} className="relative mb-6 inline-block">
                    <Page pageNumber={index + 1} width={700} />

                    {signatures
                      .filter((sig) => sig.page === index + 1)
                      .map((sig) => (
                        <div
                          key={sig._id}
                          className="absolute border-2 border-red-500 bg-red-100 text-red-700 px-3 py-2 rounded"
                          style={{
                            left: `${sig.x}px`,
                            top: `${sig.y}px`,
                          }}
                        >
                          Signature Here
                        </div>
                      ))}
                  </div>
                ))}
              </Document>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;