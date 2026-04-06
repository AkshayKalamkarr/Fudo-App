import amqp from "amqplib";

let channel: amqp.Channel;

export const connectRabbitMQ = async () => {
  const connection = await amqp.connect(process.env.RABITMQ_URL!);

  channel = await connection.createChannel();

  await channel.assertQueue(process.env.RIDER_QUEUE!, {
    durable: true,
  });

  console.log("🐇 connected to rabbitMQ (Rider Service) ");
};

export const getChannel = () => channel;
