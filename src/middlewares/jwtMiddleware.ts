import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { redisClient } from "../services/redisService";

export const checkTokenUniqueness = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const tokenHeader = req.headers["x-jwt-kwy"] as string;
  const token: string = tokenHeader?.split("Bearer ")[1] || "";

  try {
    const jwtSecret = process.env.JWT_SECRET as string;
    const decoded = jwt.verify(token, jwtSecret) as jwt.JwtPayload;

    if (decoded.iss === "super-token") return next();

    const jti = decoded.jti;

    if (!jti) return res.status(400).send("Missing jti");

    const tokenInRedis = await redisClient.get(jti);
    if (!tokenInRedis)
      return res.status(401).json({ message: "Invalid or expired token" });

    await redisClient.del(jti);
    next();
  } catch (err) {
    if (err instanceof Error)
      return res.status(401).send("Unauthorized: " + err.message);

    return res.status(401).send("Unauthorized");
  }
};
