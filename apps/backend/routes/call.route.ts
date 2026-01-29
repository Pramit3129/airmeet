import express from 'express';
import { CallController } from '../controllers/call.controller.ts';
const router = express.Router();

router.post("/createCall", CallController.createCall)
router.post("/scheduleCall", CallController.scheduleCall)
router.get('/getCalls/:leadId', CallController.getCalls)

export default router;