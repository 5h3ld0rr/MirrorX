import "dotenv/config";
import express from "express";
import cors from "cors";
import routes from "./routes/index.js";

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", routes);

app.listen(port, () => {
  console.log(`🚀 MirrorX Backend running on port ${port}`);
});

export default app;
