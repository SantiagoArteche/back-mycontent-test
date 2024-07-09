import { Router } from "express";
import {
  getGoogleSheet,
  updateGoogleSheet,
  getChanges,
} from "../controllers/schedule.controller.js";

export const router = Router();

router.get("/api/schedules", getGoogleSheet);
router.get("/api/schedules/changes", getChanges);
router.put("/api/schedules", updateGoogleSheet);
