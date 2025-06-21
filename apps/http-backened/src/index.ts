import express from "express";
import dotenv from 'dotenv';
import { mainRouter } from "./routes/v1";
dotenv.config();


const app = express();
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.use("/api/v1/", mainRouter);

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
