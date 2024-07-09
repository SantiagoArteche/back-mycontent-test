import express from "express";
import { router } from "./routes/schedule.routes.js";
import mongoose from "mongoose";
import cors from "cors";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT;

const whiteList = new Set(["https://front-mycontent-test.vercel.app"]);
const corsOptions = {
  origin: function (origin, callback) {
    if (whiteList.has(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Access denied"));
    }
  },
};

mongoose.connect(process.env.MONGO_URL, { dbName: "Schedules" }).then(() => {
  console.log("MONGO DB CONNECTED");
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));

app.use(router);

app.listen(PORT, () => {
  console.log(`Server running on PORT: ${PORT}`);
});
