import express, {
  Request,
  Response,
  NextFunction,
  RequestHandler,
} from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

const usedTokens = new Set<string>();

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret)
  throw new Error("JWT_SECRET is not defined in environment variables");

const apiKey = process.env.API_KEY;
if (!apiKey) throw new Error("API_KEY is not defined in environment variables");

const app = express();
const PORT = 3000;

app.use(express.json());

const apiKeyMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  const apiKeyHeader = req.headers["x-parse-rest-api-key"];
  if (apiKeyHeader !== apiKey) return res.status(403).send("Forbidden");

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

  if (usedTokens.has(token))
    return res.status(401).send("Unauthorized: Token already used");

  jwt.verify(
    token,
    jwtSecret,
    (
      err: jwt.VerifyErrors | null,
      decoded: JwtPayload | string | undefined
    ) => {
      if (err) return res.status(401).send("Unauthorized: " + err.message);

      usedTokens.add(token);

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
  const token = jwt.sign(payload, jwtSecret, {
    expiresIn: timeToLifeSec + "s",
  });

  res.header("X-JWT-KWY", token);

  res.json({ message: `Hello ${to} your message will be send` });
});

app.all("/DevOps", (req: Request, res: Response) => {
  res.send("ERROR");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
