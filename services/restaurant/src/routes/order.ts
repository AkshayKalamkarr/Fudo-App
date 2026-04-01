import express from "express";
import { isAuth, isSeller } from "../middlewares/isAuth.js";
import {
  createOrder,
  fetchOrderForPayment,
  fetchRestaurantOrders,
  fetchSingleOrder,
  getMyOrders,
  updateOrderStatus,
} from "../controllers/order.js";

const router = express.Router();

router.get("/myorder", isAuth, getMyOrders);
router.get("/:id", isAuth, fetchSingleOrder);

router.post("/new", isAuth, createOrder);
router.get("/restaurant/:restaurentId", isAuth, isSeller, fetchRestaurantOrders);
router.put("/:orderId", isAuth, isSeller, updateOrderStatus);
router.get("/payment/:id", fetchOrderForPayment);

export default router;
