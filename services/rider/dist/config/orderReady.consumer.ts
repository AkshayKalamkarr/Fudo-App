import axios from "axios";
import { getChannel } from "./rabbitmq.js";
import { Rider } from "../model/Rider.js";

export const startOrderReadyConsumer = async () => {
  const channel = getChannel();

  console.log("Starting to consume from :", process.env.ORDER_READY_QUEUE);

  channel.consume(process.env.ORDER_READY_QUEUE!, async (msg) => {
    if (!msg) return;

    try {
      console.log("Received message", msg.content.toString());

      const event = JSON.parse(msg.content.toString());

      console.log("event type", event.type);

      if (event.type !== "ORDER_READY_FOR_RIDER") {
        console.log("Skipping non-order-ready-for-rider event");
        channel.ack(msg);
        return;
      }

      const { orderId, restaurentId, location } = event.data;
      console.log("searching for rider near:", location);

      const riders = await Rider.find({
        isAvailable: true,
        isVerified: true,
        location: {
          $near: {
            $geometry: location,
            $maxDistance: 500,
          },
        },
      });
      console.log(`found ${riders.length} near by riders`);

      if (riders.length === 0) {
        console.log("No riders available near by");
        channel.ack(msg);
        return;
      }

      for (const rider of riders) {
        console.log(`notifying rider userId ${rider.userId}`);

        try {
          await axios.post(
            `${process.env.REALTIME_SERVICE}/api/internal/emit`,
            {
              event: "order:available",
              room: `user:${rider.userId}`,
              payload: { orderId, restaurentId },
            },
            {
              headers: {
                "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
              },
            },
          );
          console.log(`notified rider ${rider.userId} successfully`);

          channel.ack(msg);
          console.log("Message acknowledged");
        } catch (error) {
          console.log(`OrderReady consumer error: `, error);
        }
      }
    } catch (error) {}
  });
};
