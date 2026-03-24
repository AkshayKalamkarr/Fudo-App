import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import {
  addToCart,
  clearrCart,
  decrementCartItem,
  fetchMyCart,
  incrementCartItem,
} from "../controllers/cart.js";

const router = express.Router();

router.post("/add", isAuth, addToCart);
router.get("/all", isAuth, fetchMyCart);
router.put("/inc", isAuth, incrementCartItem);
router.put("/dec", isAuth, decrementCartItem);
router.delete("/clear", isAuth, clearrCart);

export default router;
