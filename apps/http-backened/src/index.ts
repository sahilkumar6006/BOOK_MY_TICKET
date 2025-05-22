import express, { Request, Response, NextFunction } from "express";
import {mainRouter} from './routes/v1/index'

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

app.use('/api/v1', mainRouter)


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
