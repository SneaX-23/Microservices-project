import express from "express";
import cors from "cors";
import inventoryRoutes from "./routes/inventoryRoutes";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());


app.use("/api/v1/inventory", inventoryRoutes);

// Health check for Docker/Kubernetes
app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", service: "inventory-service" });
});

app.listen(PORT, () => {
  console.log(`📦 Inventory Service running on port ${PORT}`);
});