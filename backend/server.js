import express, { json, urlencoded } from "express"
import { config } from "dotenv"
import cors from "cors"

// Load environment variable
config();
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());


const PORT = process.env.PORT || 8800;

// importing controller
import makeclips from "./clipmaker.controller.js";

app.post("/makeclip",makeclips);


// start thge server
app.listen(PORT, () => {
    console.log(`app is listening on ${PORT}`)
})