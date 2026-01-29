import { Lead } from "@airmeet/models";
import type { Request, Response } from "express";

export class LeadController {
    static async getAllLeads(req: Request, res: Response) {
        const leads = await Lead.find();
        res.status(200).json({
            message: "All Leads",
            leads
        });
    }
}
