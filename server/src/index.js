import express from "express";
import cors from "cors";
import config from "./config.js";
import demoRouter from "./routes/demo.js";
import statusRouter from "./routes/status.js";

const app = express();

// MIDDLEWARE
// Allows the React client on port 3000 to talk to this server on port 4000
app.use(cors({
  origin: "http://localhost:3000",
}));

// Lets Express read JSON request bodies
app.use(express.json());

// ROUTES
// All demo routes will be prefixed with /api
app.use("/api", demoRouter);
app.use("/api", statusRouter);

// Health check — just confirms server is alive
app.get("/", (req, res) => {
  res.json({ message: "Rate limiter server is running" });
});

// START SERVER
app.listen(config.port, () => {
  console.log(`Server listening on http://localhost:${config.port}`);
});