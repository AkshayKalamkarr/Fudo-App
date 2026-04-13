import { ObjectId } from "mongodb";
import TryCatch from "../middleware/trycatch.js";
import { getRestaurantCollection, getRiderCollection, } from "../utils/collection.js";
export const getPendingRestaurant = TryCatch(async (req, res) => {
    const restaurants = await (await getRestaurantCollection())
        .find({ isVerified: false })
        .toArray();
    res.json({
        count: restaurants.length,
        restaurants,
    });
});
export const getPendingRiders = TryCatch(async (req, res) => {
    const riders = await (await getRiderCollection())
        .find({ isVerified: false })
        .toArray();
    res.json({
        count: riders.length,
        riders,
    });
});
export const verifyRestaurant = TryCatch(async (req, res) => {
    const { id } = req.params;
    if (typeof id !== "string") {
        return res.status(400).json({
            message: "invalid restaurant id"
        });
    }
    if (!ObjectId.isValid(id)) {
        return res.status(400).json({
            message: "Invalid object id"
        });
    }
});
