import { useEffect, useRef, useState } from "react";
import type { IOrder } from "../types";
import { useSocket } from "../context/SocketContext";
import audio from "../assets/iPhone.mp3";
import axios from "axios";
import { restaurentService } from "../main";

const ACTIVE_STATUSES = [
  "placed",
  "accepted",
  "preparing",
  "ready_for_rider",
  "rider_assigned",
  "picked_up",
];

const RestaurantOrders = ({ restaurentId }: { restaurentId: string }) => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setloading] = useState(true);
  const [audioUnlocked, setaudioUnlocked] = useState(false);

  const { socket } = useSocket();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(audio);
    audioRef.current.load();
  }, []);

  const unLockedAudio = () => {
    if (audioRef.current) {
      audioRef.current
        .play()
        .then(() => {
          audioRef.current!.pause();
          audioRef.current!.currentTime = 0;
          setaudioUnlocked(true);
          console.log("Audio Unlocked");
        })
        .catch((err) => {
          console.log("failed to unlocked audio: ", err);
        });
    }
  };

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get(
        `${restaurentService}/api/order/${restaurentId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );

      setOrders(data.orders || []);
    } catch (error) {
      console.log(error);
    } finally {
      setloading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [restaurentId]);

  useEffect(() => {
    if (!socket) return;
    const onNewOrder = () => {
      console.log("New Order received from socket");
      if (audioUnlocked && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((err) => {
          console.error("Audio play failed: ", err);
        });
      }

      fetchOrders();
    };

    socket.on("order:new", onNewOrder);
    return () => {
      socket.off("order:new", onNewOrder);
    };
  }, [socket, audioUnlocked]);

  if (loading) {
    return <p className="text-grey-500">Loading Orders</p>;
  }

  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));

  const completedOrders = orders.filter(
    (o) => !ACTIVE_STATUSES.includes(o.status),
  );

  return (
    <div className="space-y-6">
      {!audioUnlocked && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔔</span>
            <div>
              <p className="font-medium text-blue-900">
                Enable sound Notification
              </p>
              <p className="text-sm text-blue-700">
                Get Notified when new orders arrive
              </p>
            </div>
          </div>

          <button
            onClick={unLockedAudio}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
          >
            Enable Sound
          </button>
        </div>
      )}

      {/*active orders */}
      <div className="space-y-3 ">
        <h3 className="text-lg font-semibold">Active Orders</h3>

        {

          activeOrders.length === 0 ? <p className="text-sm text-grey-500">No Acive Orders</p> : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeOrders.map((order)=>(
              <p key={order._id}>{order._id}</p>
            ))}
          </div>
        }
      </div>


      <div className="space-y-3 ">
        <h3 className="text-lg font-semibold">Completed Orders</h3>

        {

          completedOrders.length === 0 ? <p className="text-sm text-grey-500">No Completed Orders</p> : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedOrders.map((order)=>(
              <p key={order._id}>{order._id}</p>
            ))}
          </div>
        }
      </div>


    </div>
  );
};

export default RestaurantOrders;
