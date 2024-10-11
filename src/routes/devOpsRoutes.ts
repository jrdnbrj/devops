import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import { redisClient } from "../services/redisService";

const router = Router();

router.post("/DevOps", async (req: Request, res: Response): Promise<void> => {
  const { message, to, from, timeToLifeSec } = req.body;

  if (!message || !to || !from || !timeToLifeSec) {
    res.status(400).json({ error: "Invalid payload" });
    return;
  }

  const jti = uuidv4();
  const payload = { message, to, from, timeToLifeSec, jti, iss: "my-key" };
  const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: timeToLifeSec + "s",
  });

  await redisClient.setEx(jti, timeToLifeSec, "valid");

  res.header("X-JWT-KWY", "Bearer " + token);
  res.json({ message: `Hello ${to} your message will be sent` });
});

router.all("/DevOps", (req: Request, res: Response) => {
  res.send("ERROR");
});

export default router;
