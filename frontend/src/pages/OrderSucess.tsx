import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { utilsService } from "../main";
import axios from "axios";
import toast from "react-hot-toast";

const OrderSucess = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const sessionId = params.get("session_id");
  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) return;

      try {
        await axios.post(`${utilsService}/api/payment/stripe/verify`, {
          sessionId,
        });

        toast.success("Payment SuccessFull 🎉");
        navigate(`/paymentsuccess/${sessionId}`);
      } catch (error) {
        toast.error("Stripe verification failed");
        console.log(error);
      }
    };

    verifyPayment();
  }, [sessionId, navigate]);
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <h1 className="text-2xl font-bold text-green-600">
        Payment SuccessFull🎉
      </h1>
    </div>
  );
};

export default OrderSucess;
