import express, {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

const app = express();
const PORT = 3000;

app.use(express.json());

const apiKeyMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  const apiKey = req.headers["x-parse-rest-api-key"];
  if (apiKey !== "2f5ae96c-b558-4c7b-a590-a501ae1c3f6c")
    return res.status(403).send("Forbidden");

  next();
};

app.use(apiKeyMiddleware as RequestHandler);

const jwtMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  const token = req.headers["x-jwt-kwy"] as string;
  if (!token) return res.status(401).send("Unauthorized");

  jwt.verify(
    token,
    "your-secret-key",
    (
      err: jwt.VerifyErrors | null,
      decoded: JwtPayload | string | undefined
    ) => {
      if (err) return res.status(401).send("Unauthorized");

      next();
    }
  );
};

app.use(jwtMiddleware as RequestHandler);

app.post("/DevOps", (req: Request, res: Response): void => {
  const { message, to, from, timeToLifeSec } = req.body;
  if (!message || !to || !from || !timeToLifeSec) {
    res.status(400).json({ error: "Invalid payload" });
    return;
  }

  const payload = { message, to, from, timeToLifeSec };
  const token = jwt.sign(payload, "your-secret-key", { expiresIn: "1h" });

  res.header("X-JWT-KWY", token);

  res.json({
    message: `Hello ${to}, your message will be sent`,
  });
});

app.all("/DevOps", (req: Request, res: Response) => {
  res.send("ERROR");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
