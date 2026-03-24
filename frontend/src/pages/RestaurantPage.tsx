import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { IMenuItems, IRestaurant } from "../types";
import axios from "axios";
import { restaurentService } from "../main";
import RestaurantProfile from "../components/RestaurantProfile";
import MenuItems from "../components/MenuItems";

const RestaurantPage = () => {
  const { id } = useParams();

  const [restaurent, setRestaurent] = useState<IRestaurant | null>(null);
  const [menuItems, setmenuItems] = useState<IMenuItems[]>([]);
  const [loading, setloading] = useState(true);

  const fetchRestaurent = async () => {
    try {
      const { data } = await axios.get(
        `${restaurentService}/api/restaurant/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      setRestaurent(data || null);
    } catch (error) {
      console.log(error);
    } finally {
      setloading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const { data } = await axios.get(
        `${restaurentService}/api/item/all/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      setmenuItems(data.items);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchRestaurent();
      fetchMenuItems();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-grey-500">Loading Restaurents near you....</p>
      </div>
    );
  }

  if (!restaurent) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-grey-500">No Restaurant with this id</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grey-50 px-4 py-6 space-y-6 ">
      <RestaurantProfile
        restaurent={restaurent}
        onUpdate={setRestaurent}
        isSeller={false}
      />

      <div className="rounded-xl bg-white shadow-sm p-4">
        <MenuItems
          isSeller={false}
          items={menuItems}
          onItemDeleted={() => {}}
        />
      </div>
    </div>
  );
};

export default RestaurantPage;
