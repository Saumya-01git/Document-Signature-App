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
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
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
      Signature Here
    </div>
  );
}


function App() {
  const [token, setToken] = useState("");
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [signatures, setSignatures] = useState([]);
  const [numPages, setNumPages] = useState(null);
  const [placingSignature, setPlacingSignature] = useState(false);
  const [dragPosition, setDragPosition] = useState(null);

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

        <button
  className="bg-purple-600 text-white px-4 py-2 rounded ml-3"
  onClick={() => setPlacingSignature(true)}
>
  Place Signature
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