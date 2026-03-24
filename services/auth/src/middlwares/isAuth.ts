import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { IUser } from "../model/User.js";
import { auth } from "googleapis/build/src/apis/abusiveexperiencereport/index.js";

export interface AuthenticatedRequest extends Request {
  user?: IUser | null;
}

export const isAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        message: "please login - no auth header",
      });
      return;
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      res.status(401).json({
        message: "please login - token missing",
      });
      return;
    }

    const decodedValue = jwt.verify(
      token,
      process.env.JWT_SECRET as string,
    ) as jwt.JwtPayload;
    if (!decodedValue || !decodedValue.user) {
      res.status(401).json({
        message: "invalid token",
      });
      return;
    }

    req.user = decodedValue.user
    next()
  } catch (error) {
     res.status(500).json({
        message: "please login - jwt error",
      });
      return
  }
};
