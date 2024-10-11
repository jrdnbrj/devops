import { Request, Response, NextFunction } from "express";

export const apiKeyMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): Response | void => {
  const apiKeyHeader = req.headers["x-parse-rest-api-key"];
  if (apiKeyHeader !== process.env.API_KEY)
    return res.status(403).send("Forbidden");

  next();
};
