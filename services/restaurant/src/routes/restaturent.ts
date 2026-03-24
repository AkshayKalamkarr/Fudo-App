import express from "express";
import { isAuth, isSeller } from "../middlewares/isAuth.js";
import {
  addRestaurent,
  fetchMyRestaurent,
  fetchSingleRestaurent,
  getNearbyRestaurent,
  updateRestaurent,
  updateStatusRestaurent,
} from "../controllers/restaurant.js";
import uploadFile from "../middlewares/multer.js";

const router = express.Router();

router.post("/new", isAuth, isSeller, uploadFile, addRestaurent);
router.get("/my", isAuth, isSeller, fetchMyRestaurent);
router.put("/status", isAuth, isSeller, updateStatusRestaurent);
router.put("/edit", isAuth, isSeller, updateRestaurent);
router.get("/all", isAuth, getNearbyRestaurent);
router.get("/:id", isAuth, fetchSingleRestaurent);

export default router;
