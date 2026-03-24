import express from "express";
import { addUserRole, loginUser, myprofile } from "../controllers/auth.js";
import { isAuth } from "../middlwares/isAuth.js";

const router = express.Router();

router.post("/login", loginUser);
router.put("/add/role", isAuth, addUserRole);
router.get("/me", isAuth, myprofile);

export default router;
