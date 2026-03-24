import User from "../model/User.js";
import jwt from "jsonwebtoken";
import TryCatch from "../middlwares/trycatch.js";
import { AuthenticatedRequest } from "../middlwares/isAuth.js";
import { oauth2Client } from "../config/googleConfig.js";
import axios from "axios";

export const loginUser = TryCatch(async (req, res) => {
  const {code} = req.body;
  if(!code){
    return res.status(400).json({message: "auhtorixation code is required"})
  }

  const googleRes = await oauth2Client.getToken(code);

  oauth2Client.setCredentials(googleRes.tokens);

  const userRes = await axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`)

  const { email, name, picture } =userRes.data;
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ email, name, image: picture });
  }

  const token = jwt.sign({ user }, process.env.JWT_SECRET as string, {
    expiresIn: "15d",
  });

  res.status(200).json({ message: "Login successful", token, user });
});

const allowedRoles = ["customer", "rider", "seller"] as const;
type Role = (typeof allowedRoles)[number];

export const addUserRole = TryCatch(async (req: AuthenticatedRequest, res) => {
  if (!req.user?._id) {
    return res.status(401).json({ message: "unauthorized" });
  }

  const { role } = req.body as { role: Role };
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: "invalid role" });
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { role },
    { new: true },
  );
  if (!user) {
    res.status(404).json({ message: "user not found" });
  }

  const token = jwt.sign({ user }, process.env.JWT_SECRET as string, {
    expiresIn: "15d",
  });

  res.json({ user, token });
});

export const myprofile = TryCatch(async (req: AuthenticatedRequest, res) => {
  const user = req.user;
  res.json({user})
});

