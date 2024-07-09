import { Schema, model } from "mongoose";

const logSchema = new Schema(
  {
    message: { type: String, required: true },
    date: { type: Date, default: new Date() },
  },
  { versionKey: null }
);

export const logModel = model("Logs", logSchema);
