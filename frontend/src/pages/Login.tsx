import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../main";
import toast from "react-hot-toast";
import { useGoogleLogin } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";
import { useAppData } from "../context/AppContext";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();


  const {setUser, setIsAuth}= useAppData()

  const resGoogle = async (authResult: any) => {
    setLoading(true);
    try {
      const result = await axios.post(`${authService}/api/auth/login`, {
        code: authResult["code"],
      });

      localStorage.setItem("token", result.data.token);
      toast.success(result.data.message);

      setLoading(false);
      setUser(result.data.user)
      setIsAuth(true)
      navigate("/");
    } catch (error) {
      console.log(error);
      toast.error("problem while login");
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: resGoogle,
    onError: resGoogle,
    flow: "auth-code",
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg=white px-4">
      <div className="w-full max-wsm space-y-6">
        <h1 className="text-center text-3xl font-bold text-[#E23774]">Fudo</h1>
        <p className="text-center text-sm textgray500">
          Log in or Sign up to continue
        </p>

        <button
          onClick={googleLogin}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-xl border-gray-300 bg-white px-4 py-3"
        >
          <FcGoogle size={20} />
          {loading ? "Signing in..." : "continue with google"}
        </button>

        <p className="text-center text-xs text-grey-400">
          by continuing , you agree with our{" "}
          <span className="text-[#E23774]">Term of Service</span> &{" "}
          <span className="text-[#E23774]">Privacy policy</span> &{" "}
        </p>
      </div>
    </div>
  );
};

export default Login;
