import express from "express";
import { apiKeyMiddleware } from "./middlewares/apiKeyMiddleware";
import { checkTokenUniqueness } from "./middlewares/jwtMiddleware";
import devOpsRoutes from "./routes/devOpsRoutes";
import { RequestHandler } from "express";

const app = express();

app.use(express.json());
app.use(apiKeyMiddleware as RequestHandler);
app.use(checkTokenUniqueness as RequestHandler);

app.use("/", devOpsRoutes);

export default app;
