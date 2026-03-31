import { useEffect, useState } from "react";
import type { IMenuItems, IRestaurant } from "../types";
import { restaurentService } from "../main";
import axios from "axios";
import AddRestaurent from "../components/AddRestaurent";
import RestaurantProfile from "../components/RestaurantProfile";
import MenuItems from "../components/MenuItems";
import AddMenuItems from "../components/AddMenuItems";
import RestaurantOrders from "../components/RestaurantOrders";

type SelletTab = "menu" | "add-item" | "sales";

const Restaurant = () => {
  const [restaurent, setRestaurent] = useState<IRestaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<SelletTab>("menu");

  const fetchMyRestaurent = async () => {
    try {
      const { data } = await axios.get(
        `${restaurentService}/api/restaurant/my`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      setRestaurent(data.restaurent || null);

      if (data.token) {
        localStorage.setItem("token", data.token);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRestaurent();
  }, []);

  const [menuItems, setMenuItems] = useState<IMenuItems[]>([]);

  const fetchMenuItems = async (restaurentId: string) => {
    try {
      const { data } = await axios.get(
        `${restaurentService}/api/item/all/${restaurentId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      setMenuItems(data.items);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (restaurent?._id) {
      fetchMenuItems(restaurent._id);
    }
  }, [restaurent]);

  if (loading)
    return (
      <div className="flex min-h-screen item-center justify-center">
        <p className="text-grey-500">Loading your restaurent...</p>
      </div>
    );
  if (!restaurent) {
    return <AddRestaurent fetchMyRestaurent={fetchMyRestaurent} />;
  }

  return (
    <div className="min-h-screen bg-grey-50 px-4 py-6 space-y-6 ">
      <RestaurantProfile
        restaurent={restaurent}
        onUpdate={setRestaurent}
        isSeller={true}
      />

      <RestaurantOrders restaurentId={restaurent._id} />

      <div className="rounded-xl bg-white shadow-sm">
        <div className="flex border-b">
          {[
            { key: "menu", label: "Menu Items" },
            { key: "add-item", label: "Add Item" },
            { key: "sales", label: "Sales" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as SelletTab)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition ${tab === t.key ? "border-b-2 border-red-500 text-red-500" : "text-grey-500 hover:text-grey-700"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5 ">
          {tab === "menu" && (
            <MenuItems
              items={menuItems}
              onItemDeleted={() => fetchMenuItems(restaurent._id)}
              isSeller={true}
            />
          )}
          {tab === "add-item" && (
            <AddMenuItems onItemAdded={() => fetchMenuItems(restaurent._id)} />
          )}
          {tab === "sales" && <p>Sales Page</p>}
        </div>
      </div>
    </div>
  );
};

export default Restaurant;
