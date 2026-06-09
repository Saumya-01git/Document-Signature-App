import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [token, setToken] = useState("");
  const [documents, setDocuments] = useState([]);

  const fetchDocuments = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/docs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setDocuments(res.data.documents);
    } catch (error) {
      alert("Failed to fetch documents");
      console.log(error);
    }
  };

  return (
    <div>
      <h1>SignFlow Dashboard</h1>

      <input
        type="text"
        placeholder="Paste JWT token"
        value={token}
        onChange={(e) => setToken(e.target.value)}
      />

      <button onClick={fetchDocuments}>Fetch My Documents</button>

      <h2>Uploaded Documents</h2>

      {documents.map((doc) => (
        <div key={doc._id}>
          <h3>{doc.title}</h3>
          <p>Status: {doc.status}</p>
          <p>File: {doc.fileName}</p>

<a
  href={`http://localhost:5000/${doc.filePath}`}
  target="_blank"
  rel="noreferrer"
>
  View PDF
</a>
        </div>
      ))}
    </div>
  );
}

export default App;