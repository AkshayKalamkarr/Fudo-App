import express from "express";
import { isAuth, isSeller } from "../middlewares/isAuth.js";
import {
  assignRiderToOrder,
  createOrder,
  fetchOrderForPayment,
  fetchRestaurantOrders,
  fetchSingleOrder,
  getCurrentOrdersForRider,
  getMyOrders,
  updateOrderStatus,
  updateOrderStatusRider,
} from "../controllers/order.js";

const router = express.Router();

router.get("/myorder", isAuth, getMyOrders);
router.get("/:id", isAuth, fetchSingleOrder);

router.post("/new", isAuth, createOrder);
router.get("/restaurant/:restaurentId", isAuth, isSeller, fetchRestaurantOrders);
router.put("/:orderId", isAuth, isSeller, updateOrderStatus);
router.get("/payment/:id", fetchOrderForPayment);

router.put("/assign/rider",assignRiderToOrder)
router.get("/current/rider",getCurrentOrdersForRider)
router.put("/update/status/rider",updateOrderStatusRider)


export default router;
