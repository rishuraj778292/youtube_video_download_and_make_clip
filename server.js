

import express from "express";
import { config } from "dotenv";
import cors from "cors";
import makeclips from "./clipmaker.controller.js";

// Load env variables
config();
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const PORT = process.env.PORT || 8800;

// Endpoint
app.post("/makeclip", makeclips);

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

