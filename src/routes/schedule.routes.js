import { Router } from "express";
import {
  getGoogleSheet,
  updateGoogleSheet,
  getChanges,
  getByCloser,
  updateByEmail,
} from "../controllers/schedule.controller.js";

export const router = Router();

router.get("/api/schedules", getGoogleSheet);
router.get("/api/schedules/changes", getChanges);
router.get("/api/schedules/:closer", getByCloser);

router.put("/api/schedules/lead/:email", updateByEmail);
router.put("/api/schedules", updateGoogleSheet);
