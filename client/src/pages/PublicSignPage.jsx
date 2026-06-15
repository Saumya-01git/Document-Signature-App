import { useParams } from "react-router-dom";

function PublicSignPage() {
  const { token } = useParams();

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">
        Sign Document
      </h1>

      <p className="mt-3">
        Public signing page
      </p>

      <p className="mt-3 text-sm text-gray-600">
        Token: {token}
      </p>
    </div>
  );
}

export default PublicSignPage;