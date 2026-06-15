import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

function PublicSignPage() {
  const { token } = useParams();

  const [request, setRequest] = useState(null);

  useEffect(() => {
    const validateToken = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/sign-requests/public/${token}`
        );

        setRequest(res.data.request);
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
        </div>
      )}
    </div>
  );
}

export default PublicSignPage;