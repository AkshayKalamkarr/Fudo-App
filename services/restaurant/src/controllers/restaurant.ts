import axios from "axios";
import getBuffer from "../config/datauri.js";
import { AuthenticatedRequest } from "../middlewares/isAuth.js";
import TryCatch from "../middlewares/tryCatch.js";
import Restaurant from "../models/Restaurant.js";
import jwt from "jsonwebtoken";

export const addRestaurent = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        message: "unauthorized",
      });
    }
    const existingRestaurent = await Restaurant.findOne({
      ownerId: user?._id,
    });

    if (existingRestaurent) {
      return res.status(400).json({
        message: "you already have a restaurent",
      });
    }

    const { name, description, latitude, longitude, formattedAddress, phone } =
      req.body;
    if (!name || !latitude || !longitude) {
      return res.status(400).json({
        message: "please give all details",
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

    const restaurent = await Restaurant.create({
      name,
      description,
      phone,
      image: uploadResult.url,
      ownerId: user._id,
      autoLocation: {
        type: "Point",
        coordinates: [Number(longitude), Number(latitude)],
        formattedAddress,
      },
      isVerified: false,
    });

    return res.status(201).json({
      message: "Restaurent created successfully",
      restaurent,
    });
  },
);

export const fetchMyRestaurent = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({
        message: "please login",
      });
    }

    const restaurent = await Restaurant.findOne({
      ownerId: req.user._id,
    });

    if (!restaurent) {
      return res.status(400).json({
        message: "no restaurent found",
      });
    }

    if (!req.user.restaurentId) {
      const token = jwt.sign(
        {
          user: {
            ...req.user,
            restaurentId: restaurent._id,
          },
        },
        process.env.JWT_SECRET as string,
        {
          expiresIn: "15d",
        },
      );

      return res.json({
        restaurent,
        token,
      });
    }

    res.json({ restaurent });
  },
);

export const updateStatusRestaurent = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(403).json({
        message: "please login",
      });
    }

    const { status } = req.body;

    if (typeof status !== "boolean") {
      return res.status(400).json({
        message: "status must be boolean",
      });
    }

    const restaurent = await Restaurant.findOneAndUpdate(
      {
        ownerId: req.user._id,
      },
      { isOpen: status },
      { new: true },
    );
    if (!restaurent) {
      return res.status(404).json({
        message: "restaurent not found",
      });
    }

    res.json({
      message: "restaurent status updated ",
      restaurent,
    });
  },
);

export const updateRestaurent = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(403).json({
        message: "please login",
      });
    }

    const { name, description } = req.body;

    const restaurent = await Restaurant.findOneAndUpdate(
      { ownerId: req.user._id }, // ✅ correct
      { name, description },
      { new: true },
    );
    if (!restaurent) {
      return res.status(404).json({
        message: "restaurent not found",
      });
    }

    res.json({
      message: "restaurent updated ",
      restaurent,
    });
  },
);

export const getNearbyRestaurent = TryCatch(async (req, res) => {
  const { latitude, longitude, radius = 5000, search = " " } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({
      message: "Latitude and Longitude are required",
    });
  }

  const query: any = {
    isVerified: false,
  };

  if (search && typeof search === "string") {
    query.name = { $regex: search, $options: "i" };
  }

  const restaurents = await Restaurant.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [Number(longitude), Number(latitude)],
        },
        distanceField: "distance",
        maxDistance: Number(radius),
        spherical: true,
        query,
      },
    },
    {
      $sort: {
        isOpen: -1,
        distance: 1,
      },
    },
    {
      $addFields: {
        distanceKm: {
          $round: [{ $divide: ["$distance", 1000] }, 2],
        },
      },
    },
  ]);
  res.json({
    // success: true,
    // count: restaurents.length,
    restaurents,
  });
});

export const fetchSingleRestaurent = TryCatch(async (req, res) => {
  const restaurent = await Restaurant.findById(req.params.id);

  res.json(restaurent);
});
