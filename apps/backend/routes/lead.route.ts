import express from 'express';
import { LeadController } from '../controllers/lead.controller';
const router = express.Router();

router.get('/allLeads', LeadController.getAllLeads);


export default router;