import axios from "axios";
import getBuffer from "../config/datauri.js";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import TryCatch from "../middlewares/tryCatch.js";
import Restaurant from "../models/Restaurant.js";
import MenuItems from "../models/MenuItems.js";

export const addMenuItem = TryCatch(async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Please Login",
    });
  }

  const restaurent = await Restaurant.findOne({ ownerId: req.user._id });
  if (!restaurent) {
    return res.status(404).json({
      message: "no restaurent found",
    });
  }

  const { name, description, price } = req.body;

  if (!name || !price) {
    return res.status(400).json({
      message: "Name and price are required",
    });
  }

  const file = req.file;

  if (!file) {
    return res.status(400).json({
      message: "please give image",
    });
  }

  const fileBuffer = getBuffer(file);
  if (!fileBuffer?.content) {
    return res.status(500).json({
      message: "failed to create file buffer",
    });
  }

  const { data: uploadResult } = await axios.post(
    `${process.env.UTILS_SERVICE}/api/upload`,
    {
      buffer: fileBuffer.content,
    },
  );

  const item = await MenuItems.create({
    name,
    description,
    price,
    restaurentId: restaurent._id,
    image: uploadResult.url,
  });
  res.json({
    message: "item added successfully",
    item,
  });
});

export const getAllItems = TryCatch(async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({
      message: "id is required",
    });
  }

  const items = await MenuItems.find({ restaurentId: id });
  res.json({ items });
});

export const deleteMenuItem = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Please Login",
      });
    }

    const { itemId } = req.params;
    if (!itemId) {
      return res.status(400).json({
        message: "id is required",
      });
    }

    const item = await MenuItems.findById(itemId);

    if (!item) {
      return res.status(404).json({
        message: "no item found",
      });
    }

    const restaurent = await Restaurant.findOne({
      _id: item.restaurentId,
      ownerId: req.user._id,
    });

    if (!restaurent) {
      return res.status(404).json({
        message: "No Restaurent Found",
      });
    }

    await item.deleteOne();
    res.json({
      message: "Menu Item Deleted Successfully",
    });
  },
);

export const toogleMenuItemAvailability = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Please Login",
      });
    }

    const { itemId } = req.params;
    if (!itemId) {
      return res.status(400).json({
        message: "id is required",
      });
    }

    const item = await MenuItems.findById(itemId);

    if (!item) {
      return res.status(404).json({
        message: "no item found",
      });
    }

    const restaurent = await Restaurant.findOne({
      _id: item.restaurentId,
      ownerId: req.user._id,
    });

    if (!restaurent) {
      return res.status(404).json({
        message: "No Restaurent Found",
      });
    }

    item.isAvailable = !item.isAvailable;
    await item.save();

    res.json({
      message: `Item Marked as ${
        item.isAvailable ? "available" : "unavailable"
      }`,
      item,
    });
  },
);
