import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

function PublicSignPage() {
  const { token } = useParams();

  const [request, setRequest] = useState(null);
  const [documentData, setDocumentData] = useState(null);

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
        </div>
      )}
    </div>
  );
}

export default PublicSignPage;