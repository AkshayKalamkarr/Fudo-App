import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import TryCatch from "../middlewares/tryCatch.js";
import Address from "../models/Address.js";
import Cart from "../models/Cart.js";
import { IMenuItems } from "../models/MenuItems.js";
import Order from "../models/Order.js";
import Restaurant, { IRestaurant } from "../models/Restaurant.js";

export const createOrder = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = req.user;
  if (!user) {
    return res.status(400).json({
      message: "unauthorized",
    });
  }

  const { paymentMethod, addressId, distance } = req.body;

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

  const cartItems = await Cart.find({ userId: user._id })
    .populate<{ itemId: IMenuItems }>("itemId")
    .populate<{ restaurentId: IRestaurant }>("restarentId");

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
