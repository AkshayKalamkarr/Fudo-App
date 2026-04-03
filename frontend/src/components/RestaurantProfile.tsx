import axios from "axios";
import { restaurentService } from "../main";
import type { IRestaurant } from "../types";
import toast from "react-hot-toast";
import { BiEdit, BiMapPin, BiSave } from "react-icons/bi";
import { useState } from "react";
import { useAppData } from "../context/AppContext";

interface props {
  restaurent: IRestaurant;
  isSeller: boolean;
  onUpdate: (restaurent: IRestaurant) => void;
}

const RestaurantProfile = ({ restaurent, isSeller, onUpdate }: props) => {
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(restaurent.name);
  const [description, setDescription] = useState(restaurent.description);
  const [isOpen, setisOpen] = useState(restaurent.isOpen);
  const [loading, setloading] = useState(false);

  const toogleOpeneStatus = async () => {
    try {
      const { data } = await axios.put(
        `${restaurentService}/api/restaurant/status`,
        { status: !isOpen },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      toast.success(data.message);
      setisOpen(data.restaurent.isOpen);
    } catch (error: any) {
      console.log(error);
      toast.error(error.response.data.message);
    }
  };

  const saveChanges = async () => {
    try {
      setloading(true);
      const { data } = await axios.put(
        `${restaurentService}/api/restaurant/edit`,
        { name, description },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      toast.success(data.message);
      onUpdate(data.restaurent);
      setEditMode(false);
    } catch (error: any) {
      console.log(error);
      toast.error("Failed to update");
    } finally {
      setloading(false);
    }
  };

  const { setIsAuth, setUser } = useAppData();

  const logoutHandler = async () => {
    await axios.put(
      `${restaurentService}/api/restaurant/status`,
      { status: !isOpen },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      },
    );

    localStorage.setItem("token", "");
    setIsAuth(false);
    setUser(null);
    toast.success("Logged out successfully");
  };

  return (
    <div className="mx-auto max-w-xl rounded-lg bg-white shadow-sm overflow-hidden">
      {restaurent.image && (
        <img
          src={restaurent.image}
          alt=""
          className="h-48 w-full object-cover"
        />
      )}

      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            {editMode ? (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-border px-2 py-1 text-lg font-semibold"
              />
            ) : (
              <h2 className="text-xl font-semibold">{restaurent.name}</h2>
            )}

            <div className="mt-1 flex items-center gap-2 text-sm text-grey-500">
              <BiMapPin className="h-4 w-4 text-red-500" />
              {restaurent.autoLocation.formattedAddress ||
                "location unavailable"}
            </div>
          </div>

          {isSeller && (
            <button
              onClick={() => setEditMode(!editMode)}
              className="text-grey-500 hover:text-black"
            >
              <BiEdit size={18} />
            </button>
          )}
        </div>

        {editMode ? (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded border px-3 py-2 text-sm"
          />
        ) : (
          <p className="text-sm text-grey-600">
            {restaurent.description || "no description added"}
          </p>
        )}

        <div className="flex items-center justify-between pt-3 border-t">
          <span
            className={`text-sm font-medium ${isOpen ? "text-green-600" : "text-red-500"}`}
          >
            {isOpen ? "OPEN" : "CLOSE"}
          </span>

          <div className="flex gap-3 ">
            {editMode && (
              <button
                onClick={saveChanges}
                disabled={loading}
                className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
              >
                <BiSave size={16} />
                save
              </button>
            )}
            {isSeller && (
              <button
                onClick={toogleOpeneStatus}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium text-white ${isOpen ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
              >
                {isOpen ? "Close Restaurant" : "Open Restaurant"}
              </button>
            )}

            {isSeller && (
              <button
                onClick={logoutHandler}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700}`}
              >
                Logout
              </button>
            )}
          </div>
        </div>

        <p className="text-xs text-grey-400">
          Created on {new Date(restaurent.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default RestaurantProfile;
