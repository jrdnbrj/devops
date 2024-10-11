import jwt from "jsonwebtoken";

export const generateToken = (payload: object, expiresIn: string) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new Error("JWT_SECRET is not defined");
  return jwt.sign(payload, jwtSecret, { expiresIn });
};
