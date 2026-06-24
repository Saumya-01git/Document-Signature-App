import { useState } from "react";
import axios from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      alert("Login successful");
      window.location.href = "/";
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top_left,#40C0CB_0%,transparent_30%),radial-gradient(circle_at_top_right,#FF3D7F_0%,transparent_25%),linear-gradient(135deg,#0f172a,#134e4a,#1e293b)] p-4">
      <div className="w-full max-w-md rounded-[2rem] bg-slate-900/55 backdrop-blur-2xl shadow-2xl border border-white/20 p-8 text-white">
        <h1 className="text-5xl font-extrabold tracking-tight mb-2">
          🚀 <span className="text-[#FF6B9A]">Sign</span>
          <span className="text-[#40C0CB]">Flow</span>
        </h1>

        <p className="text-slate-200 mb-6">
          Secure JWT protected login for document workflows.
        </p>

        <input
          className="border border-white/30 bg-white/90 text-slate-800 p-3 rounded-xl w-full mb-3 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="relative mb-4">
          <input
            className="border border-white/30 bg-white/90 text-slate-800 p-3 pr-12 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-cyan-400"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        <button
          className="w-full bg-gradient-to-r from-[#3FB8AF] to-[#40C0CB] hover:from-[#40C0CB] hover:to-[#3FB8AF] active:scale-95 transition-all duration-200 text-white font-semibold px-5 py-3 rounded-2xl shadow-md hover:shadow-xl"
          onClick={handleLogin}
        >
          Login
        </button>

        <p className="mt-5 text-sm text-slate-200">
          New user?{" "}
          <a className="text-[#40C0CB] font-semibold hover:underline" href="/register">
            Register here
          </a>
        </p>
      </div>
    </div>
  );
}

export default Login;