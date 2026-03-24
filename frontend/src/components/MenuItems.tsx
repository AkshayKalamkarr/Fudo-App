import { useState } from "react";
import type { IMenuItems } from "../types";
import { FiEyeOff } from "react-icons/fi";
import { BsCartPlus, BsEye } from "react-icons/bs";
import { BiTrash } from "react-icons/bi";
import toast from "react-hot-toast";
import { VscLoading } from "react-icons/vsc";
import axios from "axios";
import { restaurentService } from "../main";
import { useAppData } from "../context/AppContext";

interface MenuItemsProps {
  items: IMenuItems[];
  onItemDeleted: () => void;
  isSeller: boolean;
}

const MenuItems = ({ items, onItemDeleted, isSeller }: MenuItemsProps) => {
  const [loadingItemId, setloadingItemId] = useState<string | null>(null);
  const handleDelete = async (itemId: string) => {
    const confirm = window.confirm("Are you sure you want to delete this item");
    if (!confirm) return;

    try {
      await axios.delete(`${restaurentService}/api/item/${itemId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      toast.success("Item Deleted");
      onItemDeleted();
    } catch (error) {
      console.log(error);
      toast.error("Failed to delete Item");
    }
  };

  const toogleAvaibility = async (itemId: string) => {
    if (!confirm) return;

    try {
      const { data } = await axios.put(
        `${restaurentService}/api/item/status/${itemId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      toast.success(data.message);
      onItemDeleted();
    } catch (error) {
      console.log(error);
      toast.error("Failed to update status");
    }
  };

  const { fetchCart } = useAppData();

  const addToCart = async (restaurentId: string, itemId: string) => {
    try {
      setloadingItemId(itemId);

      const { data } = await axios.post(
        `${restaurentService}/api/cart/add`,
        {
          restaurentId,
          itemId,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      toast.success(data.message);
      fetchCart();
    } catch (error: any) {
      toast.error(error.response.data.message);
    } finally {
      setloadingItemId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => {
        const isLoading = loadingItemId === item._id;

        return (
          <div
            key={item._id}
            className={`relative flex gap-4 rounded-lg bg-white p-4 shadow-sm transition ${
              !item.isAvailable ? "opacity-70" : ""
            }`}
          >
            <div className="relative shrink-0">
              <img
                src={item.image}
                alt=""
                className={`h-20 w-20 rounded object-cover ${!item.isAvailable ? "grayscale brightness-75" : ""}`}
              />
              {!item.isAvailable && (
                <span className="absolute inset-0 flex items-center justify-center rounded bg-black/60 text-xs font-semibold text-white">
                  Not Available
                </span>
              )}
            </div>
            <div className="flex flex-1 flex-col justify-between">
              <div>
                <h3>{item.name}</h3>
                {item.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <p className="font-medium">₹{item.price}</p>
                {isSeller && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => toogleAvaibility(item._id)}
                      className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
                    >
                      {item.isAvailable ? (
                        <BsEye size={18} />
                      ) : (
                        <FiEyeOff size={18} />
                      )}
                    </button>

                    <button
                      onClick={() => handleDelete(item._id)}
                      className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                    >
                      <BiTrash size={18} />
                    </button>
                  </div>
                )}

                {!isSeller && (
                  <button
                    disabled={!item.isAvailable || isLoading}
                    onClick={() => addToCart(item.restaurentId, item._id)}
                    className={`flex items-center justify-center rounded-lg p-2 ${!item.isAvailable || isLoading ? "cursor-not-allowed text-gray-400" : "text-red-500 hover:bg-red-50"}`}
                  >
                    {isLoading ? (
                      <VscLoading size={18} className="animate-spin" />
                    ) : (
                      <BsCartPlus size={18} />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MenuItems;
