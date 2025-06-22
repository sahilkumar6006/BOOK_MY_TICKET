import express from "express";
import dotenv from 'dotenv';
import { mainRouter } from "./routes/v1";
import cors from 'cors';
import { setupSwagger } from './config/swagger';

dotenv.config();

const app = express();

// Enable CORS
app.use(cors());

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    next();
});

app.get("/", (req, res) => {
    res.send("Hello World!");
});

// Setup Swagger documentation
setupSwagger(app);

// API routes
app.use("/api/v1", mainRouter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
