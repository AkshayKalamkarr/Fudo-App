import mongoose from "mongoose";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import TryCatch from "../middlewares/tryCatch.js";
import Cart from "../models/Cart.js";

export const addToCart = TryCatch(async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Please Login",
    });
  }

  const userId = req.user._id;

  const { restaurentId, itemId } = req.body;

  if (
    !mongoose.Types.ObjectId.isValid(restaurentId) ||
    !mongoose.Types.ObjectId.isValid(itemId)
  ) {
    return res.status(400).json({
      message: "Invalid restaurant and item id",
    });
  }

  const cartFromDifferentRestaurent = await Cart.findOne({
    userId,
    restaurentId: { $ne: restaurentId },
  });

  if (cartFromDifferentRestaurent) {
    return res.status(400).json({
      message:
        "you can order from only one restaurent at a same time Please clear your cart first to add items from this restaurant",
    });
  }

  const cartItem = await Cart.findOneAndUpdate(
    {
      userId,
      restaurentId,
      itemId,
    },
    {
      $inc: { quantity: 1 },
      $setOnInsert: { userId, restaurentId, itemId },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return res.json({
    message: "Item added to cart",
    cart: cartItem,
  });
});

export const fetchMyCart = TryCatch(async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Please Login",
    });
  }

  const userId = req.user._id;

  const cartItems = await Cart.find({ userId })
    .populate("itemId")
    .populate("restaurentId");

  let subtotal = 0;
  let carLength = 0;

  for (const cartItem of cartItems) {
    const item: any = cartItem.itemId;

    subtotal += item.price * cartItem.quantity;
    carLength += cartItem.quantity;
  }

  return res.json({
    success: true,
    carLength, // ✅ match frontend naming
    subtotal,
    cart: cartItems,
  });
});

export const incrementCartItem = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const userId = req.user?._id;

    const { itemId } = req.body;

    if (!userId || !itemId) {
      return res.status(400).json({
        message: "invalid request",
      });
    }

    const cartItem = await Cart.findOneAndUpdate(
      { userId, itemId },
      { $inc: { quantity: 1 } },
      { new: true },
    );

    if (!cartItem) {
      return res.status(404).json({
        message: "item not found",
      });
    }

    res.json({
      message: "quantity increases",
      cartItem,
    });
  },
);

export const decrementCartItem = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const userId = req.user?._id;

    const { itemId } = req.body;

    if (!userId || !itemId) {
      return res.status(400).json({
        message: "invalid request",
      });
    }

    const cartItem = await Cart.findOne({ userId, itemId });

    if (!cartItem) {
      return res.status(404).json({
        message: "item not found",
      });
    }

    if (cartItem.quantity === 1) {
      await Cart.deleteOne({ userId, itemId });

      return res.json({
        message: " item removed from cart",
      });
    }

    cartItem.quantity -= 1;
    await cartItem.save();

    res.json({
      message: "quantity decreased",
      cartItem,
    });
  },
);

export const clearrCart = TryCatch(async (req: AuthenticatedRequest, res) => {
  const userId = req.user?._id;
  if (!userId) {
    return res.status(400).json({
      message: "Unauthorzed",
    });
  }

  await Cart.deleteMany({ userId });

  res.json({
    message: "Cart cleared Sucessfully",
  });
});
