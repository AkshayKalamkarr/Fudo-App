import express from "express";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "../controller/payment.js";

const router = express.Router();

router.post("/create", createRazorpayOrder);
router.post("/verify", verifyRazorpayPayment);

export default router;
