import { useEffect, useState } from "react";
import { useAppData } from "../context/AppContext";
import { restaurentService, utilsService } from "../main";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import type { IRestaurant } from "../types";
import toast from "react-hot-toast";

interface Address {
  _id: string;
  formattedAddress: string;
  mobile: number;
}

const Checkout = () => {
  const { cart, subTotal, quantity } = useAppData();

  const [address, setaddress] = useState<Address[]>([]);
  const [selectedAddressId, setselectedAddressId] = useState<string | null>(
    null,
  );
  const [loadingAddress, setLoadingAddress] = useState(true);

  const [loadingRazorpay, setloadingRazorpay] = useState(false);
  const [loadingStripe, setloadingStripe] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);

  useEffect(() => {
    const fetchAddress = async () => {
      if (!cart || cart.length === 0) {
        setLoadingAddress(false);
        return;
      }

      try {
        const { data } = await axios.get(
          `${restaurentService}/api/address/all`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        );
        setaddress(data);
      } catch (error) {
        console.log(error);
      } finally {
        setLoadingAddress(false);
      }
    };

    fetchAddress();
  }, [cart]);

  const navigate = useNavigate();

  if (!cart || cart.length === 0) {
    return (
      <div className="flex min-h-[60vh] item-center justify-center">
        <p className="text-grey-500 text-lg">Your Cart is Empty</p>
      </div>
    );
  }

  const restaurent = cart[0].restaurentId as IRestaurant;

  const deliveryFee = subTotal < 250 ? 49 : 0;

  const platformFee = 7;

  const grandTotal = subTotal + deliveryFee + platformFee;

  const createOrder = async (paymentMethod: "razorpay" | "stripe") => {
    if (!selectedAddressId) return;

    setCreatingOrder(true);

    try {
      const { data } = await axios.post(
        `${restaurentService}/api/order/new`,
        {
          paymentMethod,
          addressId: selectedAddressId,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      return data;
    } catch (error) {
      toast.error("failed to create order");
    } finally {
      setCreatingOrder(false);
    }
  };

  const payWithRazorpay = async () => {
    try {
      setloadingRazorpay(true);

      const order = await createOrder("razorpay");
      if (!order) return;

      const { orderId, amount } = order;

      const { data } = await axios.post(`${utilsService}/api/payment/create`, {
        orderId,
      });

      const { razorpayOrderId, key } = data;

      const option = {
        key,
        amount: amount * 100,
        currency: "INR",
        name: "Fudo",
        description: "Food Order Payment",
        orderId: razorpayOrderId,

        handler: async (response: any) => {
          try {
            await axios.post(`${utilsService}/api/payment/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId,
            });

            toast.success("Payment Successfull 🎉");
            navigate("/paymentsuccess/" + response.razorpay_payment_id);
          } catch (error) {
            toast.error("payment verification failed");
          }
        },
        theme: {
          color: "#E23744",
        },
      };

      const razorpay = new (window as any).Razorpay(option);
      razorpay.open();
    } catch (error) {
      console.log(error);
      toast.error("payment failed lease refresh page");
    } finally {
      setloadingRazorpay(false);
    }
  };

  const payWithStripe = async () => {
    try {
      setloadingStripe(true);
      const order = await createOrder("stripe");
      if (!order) return;

      console.log("stripe checkout", order);
    } catch (error) {
      console.log(error);
      toast.error("payment failed");
    } finally {
      setloadingStripe(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6 ">
      <h1 className="text-2xl font-bold">Checkout</h1>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold ">{restaurent.name}</h2>
        <p className="text-sm text-grey-500">
          {restaurent.autoLocation.formattedAddress}
        </p>
      </div>
    </div>
  );
};

export default Checkout;
