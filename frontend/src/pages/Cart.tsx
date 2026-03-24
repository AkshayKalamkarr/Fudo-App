import { useNavigate } from "react-router-dom";
import { useAppData } from "../context/AppContext";
import { useState } from "react";
import type { ICart, IMenuItems, IRestaurant } from "../types";
import { restaurentService } from "../main";
import axios from "axios";
import toast from "react-hot-toast";
import { VscLoading } from "react-icons/vsc";
import { BiMinus, BiPlus } from "react-icons/bi";
import { TbTrash } from "react-icons/tb";

const Cart = () => {
  const { cart, subTotal, quantity, fetchCart } = useAppData();

  const navigate = useNavigate();

  const [loadingItemId, setloadingItemId] = useState<string | null>(null);
  const [clearingCart, setclearingCart] = useState(false);

  if (!cart || cart.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500 text-lg">Your Cart is Empty</p>
      </div>
    );
  }

  const restaurent = cart[0].restaurentId as IRestaurant;

  const deliveryFee = subTotal < 250 ? 49 : 0;

  const platformFee = 7;

  const grandTotal = subTotal + deliveryFee + platformFee;

  const increaseQty = async (itemId: string) => {
    try {
      setloadingItemId(itemId);
      await axios.put(
        `${restaurentService}/api/cart/inc`,
        { itemId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      await fetchCart();
    } catch (error) {
      toast.error("something went wrong");
    } finally {
      setloadingItemId(null);
    }
  };

  const decreaseQty = async (itemId: string) => {
    try {
      setloadingItemId(itemId);
      await axios.put(
        `${restaurentService}/api/cart/dec`,
        { itemId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      await fetchCart();
    } catch (error) {
      toast.error("something went wrong");
    } finally {
      setloadingItemId(null);
    }
  };

  const clearCart = async () => {
    const confirm = window.confirm("are you sure you want to clear your cart?");
    if (!confirm) return;
    try {
      setclearingCart(true);
      await axios.delete(`${restaurentService}/api/cart/clear`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      await fetchCart();
    } catch (error) {
      toast.error("something went wrong");
    } finally {
      setclearingCart(false);
    }
  };

  const checkOut = () => {
    navigate("/checkout");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="text-xl font-semibold">{restaurent.name}</h2>
        <p className="text-sm text-gray-500">
          {restaurent.autoLocation.formattedAddress}
        </p>
      </div>

      <div className="space-y-4">
        {cart.map((cartItem: ICart) => {
          const item = cartItem.itemId as IMenuItems;
          const isLoading = loadingItemId === item._id;

          return (
            <div
              key={item._id}
              className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm"
            >
              <img
                src={item.image}
                alt=""
                className="h-20 w-20 rounded object-cover"
              />

              <div className="flex-1">
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-sm text-gray-500">₹{item.price}</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  className="rounded-full border p-2 hover:bg-gray-100 disabled::opacity-50"
                  disabled={isLoading}
                  onClick={() => decreaseQty(item._id)}
                >
                  {isLoading ? (
                    <VscLoading size={16} className="animate-spin" />
                  ) : (
                    <BiMinus size={16} />
                  )}
                </button>
                <span className="font-medium">{cartItem.quantity}</span>
                <button
                  className="rounded-full border p-2 hover:bg-gray-100 disabled::opacity-50"
                  disabled={isLoading}
                  onClick={() => increaseQty(item._id)}
                >
                  {isLoading ? (
                    <VscLoading size={16} className="animate-spin" />
                  ) : (
                    <BiPlus size={16} />
                  )}
                </button>
              </div>

              <p className="w-20 text-right font-medium">
                ₹{item.price * cartItem.quantity}
              </p>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm space-y-3 ">
        <div className="text justify-between text-sm">
          <span>Total Item</span>
          <span>{quantity}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span>SubTotal</span>
          <span>₹{subTotal}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span>Delivery Fee</span>
          <span>{deliveryFee === 0 ? "Free" : `₹${deliveryFee}`}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span>Platform fee</span>
          <span>₹{platformFee}</span>
        </div>

        {subTotal < 250 && (
          <p className="text-xs text-grey-500 ">
            Add Item Worth ₹{250 - subTotal} more to get Free Delivery
          </p>
        )}

        <div className="flex justify-between text-base font-semibold border-top pt-2">
          <span>Grand Total</span>
          <span>₹{grandTotal}</span>
        </div>

        <button
          onClick={checkOut}
          className={`mt-3 w-full rounded-lg bg-[#E23744] py-3 text-sm font-semibold text-white hover:bg-red-800 ${!restaurent.isOpen ? "opacity-50 cursor-not-allowed" : ""}`}
          disabled={!restaurent.isOpen}
        >
          {!restaurent.isOpen ? "Restaurant is Closed" : "Proceed to Checkout"}
        </button>

        <button
          onClick={clearCart}
          className="mt-3 w-full rounded-lg bg-[#232222] py-3 text-sm font-semibold text-white hover:bg-gray-800 flex justify-center items-center gap-3"
          disabled={clearingCart}
        >
          Clear cart <TbTrash size={16} />
        </button>
      </div>
    </div>
  );
};

export default Cart;
