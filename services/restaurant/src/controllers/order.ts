import axios from "axios";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import TryCatch from "../middlewares/tryCatch.js";
import Address from "../models/Address.js";
import Cart from "../models/Cart.js";
import { IMenuItems } from "../models/MenuItems.js";
import Order from "../models/Order.js";
import Restaurant, { IRestaurant } from "../models/Restaurant.js";
import { publishEvent } from "../config/order.publisher.js";

export const createOrder = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = req.user;
  if (!user) {
    return res.status(400).json({
      message: "unauthorized",
    });
  }

  const { paymentMethod, addressId } = req.body;

  if (!addressId) {
    return res.status(400).json({
      message: "address is required",
    });
  }

  const address = await Address.findOne({
    _id: addressId,
    userId: user._id,
  });

  if (!address) {
    return res.status(404).json({
      message: "Address not found",
    });
  }

  const getDistanceKm = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return +(R * c).toFixed(2);
  };

  const cartItems = await Cart.find({ userId: user._id })
    .populate<{ itemId: IMenuItems }>("itemId")
    .populate<{ restaurentId: IRestaurant }>("restaurentId");

  if (cartItems.length === 0) {
    return res.status(400).json({
      message: "Cart is empty",
    });
  }
  const firstCartItem = cartItems[0];

  if (!firstCartItem || !firstCartItem.restaurentId) {
    return res.status(400).json({
      message: "Invalid Cart Data",
    });
  }

  const restaurentId = firstCartItem.restaurentId._id;
  const restaurent = await Restaurant.findById(restaurentId);

  if (!restaurent) {
    return res.status(404).json({
      message: "No Restaurant With This Id",
    });
  }

  if (!restaurent.isOpen) {
    return res.status(404).json({
      message: "Sorry this restaurant is closed for now",
    });
  }

  const distance = getDistanceKm(
    address.location.coordinates[1],
    address.location.coordinates[0],
    restaurent.autoLocation.coordinates[1],
    restaurent.autoLocation.coordinates[0],
  );

  let subTotal = 0;

  const orderItems = cartItems.map((cart) => {
    const item = cart.itemId;

    if (!item) {
      throw new Error("invalid cart item");
    }

    const itemTotal = item.price * cart.quantity;

    subTotal += itemTotal;

    return {
      itemId: item._id.toString(),
      name: item.name,
      price: item.price,
      quantity: cart.quantity,
    };
  });

  const deliveryFee = subTotal < 250 ? 49 : 0;
  const platformFee = 7;
  const totalAmount = subTotal + deliveryFee + platformFee;

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const [longitude, latitude] = address.location.coordinates;

  const riderAmount = Math.ceil(distance) * 17;

  const order = await Order.create({
    userId: user._id.toString(),
    restaurentId: restaurentId.toString(),
    restaurentName: restaurent.name,
    riderId: null,
    distance,
    riderAmount,
    items: orderItems,
    subTotal,
    deliveryFee,
    platformFee,
    totalAmount,
    addressId: address._id.toString(),
    deliveryAddress: {
      formattedAddress: address.formattedAddress,
      mobile: address.mobile,
      latitude,
      longitude,
    },
    paymentMethod,
    paymentStatus: "pending",
    status: "placed",
    expiresAt,
  });

  await Cart.deleteMany({ userId: user._id });

  res.json({
    message: "Order Created successfully",
    orderId: order._id.toString(),
    amount: totalAmount,
  });
});

export const fetchOrderForPayment = TryCatch(async (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({
      message: "Forbidden",
    });
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({
      message: "order not found",
    });
  }

  if (order.paymentStatus !== "pending") {
    return res.status(400).json({
      message: "order already Paid",
    });
  }

  res.json({
    orderId: order._id,
    amount: order.totalAmount,
    currency: "INR",
  });
});

export const fetchRestaurentOrders = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    const { restaurentId } = req.params;

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!restaurentId) {
      return res.status(400).json({
        message: "Restaurent Id Is required",
      });
    }

    const limit = req.query.limit ? Number(req.query.limit) : 0;

    const orders = await Order.find({ restaurentId, paymentStatus: "paid" })
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.json({
      success: true,
      count: orders.length,
      orders,
    });
  },
);

export const fetchRestaurantOrders = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    const { restaurentId } = req.params;

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!restaurentId) {
      return res.status(400).json({
        message: "Restaurant Id is required",
      });
    }

    const limit = req.query.limit ? Number(req.query.limit) : 0;

    const orders = await Order.find({
      restaurentId,
      paymentStatus: "paid",
    })
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.json({
      success: true,
      count: orders.length,
      orders,
    });
  },
);

const ALLOWED_STATUSES = ["accepted", "preparing", "ready_for_rider"] as const;

export const updateOrderStatus = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    const { orderId } = req.params;
    const { status } = req.body;

    const { restaurentId } = req.params;

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        message: "Invalid order Status",
      });
    }

    const order = await Order.findById(orderId);
    {
      if (!order) {
        return res.status(404).json({
          message: "Order Not Found",
        });
      }

      if (order.paymentStatus !== "paid") {
        return res.status(404).json({
          message: "Order Not completed",
        });
      }
    }

    const restaurent = await Restaurant.findById(order.restaurentId);

    if (!restaurent) {
      return res.status(404).json({
        message: "Restaurant Not completed",
      });
    }

    if (restaurent.ownerId !== user._id.toString()) {
      return res.status(404).json({
        message: "You are not allowed to update this order",
      });
    }

    order.status = status;

    await order.save();
    await axios.post(
      `${process.env.REALTIME_SERVICE_URL}/api/v1/internal/emit`,
      {
        event: "order:update",
        room: `user:${order.userId}`,
        payload: {
          orderId: order._id,
          status: order.status,
        },
      },
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
        },
      },
    );

    /// now assign rider
    if (status === "ready_for_rider") {
      console.log(
        "publishing order ready for rider event for order",
        order._id,
      );

      await publishEvent("ORDER_READY_FOR_RIDER", {
        orderId: order._id.toString(),
        restaurentId: restaurent._id.toString(),
        location: restaurent.autoLocation,
      });
      console.log("Event Published Successfully");
    }

    res.json({
      message: "Order Status Updated Successfully",
      order,
    });
  },
);

export const getMyOrders = TryCatch(async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const orders = await Order.find({
    userId: req.user._id.toString(),
    paymentStatus: "paid",
  }).sort({ createdAt: -1 });

  res.json({
    orders,
  });
});

export const fetchSingleOrder = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order Not Found",
      });
    }

    if (order.userId !== req.user._id.toString()) {
      return res.status(401).json({
        message: "you are not authorized to access this order",
      });
    }

    res.json(order);
  },
);

export const assignRiderToOrder = TryCatch(async (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({
      message: "Forbidden",
    });
  }

  const { orderId, riderId, riderName, riderPhone } = req.body;
  const order = await Order.findById(orderId);

  if (order?.riderId !== null) {
    return res.status(400).json({
      message: "Order already taken",
    });
  }

  const orderUpdated = await Order.findOneAndUpdate(
    {
      _id: orderId,
      riderId: null,
    },
    {
      riderId,
      riderName,
      riderPhone,
      status: "rider,assigned",
    },
    { new: true },
  );

  await axios.post(
    `${process.env.REALTIME_SERVICE_URL}/api/v1/internal/emit`,
    {
      event: "order:rider_assigned",
      room: `user:${order.userId}`,
      payload: order,
    },
    {
      headers: {
        "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
      },
    },
  );

  await axios.post(
    `${process.env.REALTIME_SERVICE_URL}/api/v1/internal/emit`,
    {
      event: "order:rider_assigned",
      room: `restaurent:${order.restaurentId}`,
      payload: order,
    },
    {
      headers: {
        "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
      },
    },
  );

  res.json({
    message: "Rider Assigned Sucessfully",
    success: true,
    order: orderUpdated,
  });
});

export const getCurrentOrdersForRider = TryCatch(async (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({
      message: "Forbidden",
    });
  }

  const { riderId } = req.body;
  if (!riderId) {
    return res.status(400).json({
      message: "Rider Id is Required",
    });
  }

  const order = await Order.findOne({
    riderId,
    status: { $ne: "delivered" },
  }).populate("restaurentId");

  if (!order) {
    return res.status(404).json({
      message: "Order Not Found",
    });
  }
  res.json(order);
});

export const updateOrderStatusRider = TryCatch(async (req, res) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({
      message: "Forbidden",
    });
  }

  const orderId = req.body;
  const order = await Order.findById(orderId);

  if (!order) {
    return res.status(404).json({
      message: "Order Not Found",
    });
  }

  if (order.status === "rider_assigned") {
    order.status = "picked_up";
    await order.save();

    await axios.post(
      `${process.env.REALTIME_SERVICE_URL}/api/v1/internal/emit`,
      {
        event: "order:rider_assigned",
        room: `restaurent:${order.restaurentId}`,
        payload: order,
      },
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
        },
      },
    );

    await axios.post(
      `${process.env.REALTIME_SERVICE_URL}/api/v1/internal/emit`,
      {
        event: "order:rider_assigned",
        room: `user:${order.userId}`,
        payload: order,
      },
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
        },
      },
    );

    return res.json({
      message: "Order update successfully",
    });
  }

  if (order.status === "picked_up") {
    order.status = "delivered";
    await order.save();

    await axios.post(
      `${process.env.REALTIME_SERVICE_URL}/api/v1/internal/emit`,
      {
        event: "order:rider_assigned",
        room: `restaurent:${order.restaurentId}`,
        payload: order,
      },
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
        },
      },
    );

    await axios.post(
      `${process.env.REALTIME_SERVICE_URL}/api/v1/internal/emit`,
      {
        event: "order:rider_assigned",
        room: `user:${order.userId}`,
        payload: order,
      },
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
        },
      },
    );

    return res.json({
      message: "Order update successfully",
    });
  }
});
