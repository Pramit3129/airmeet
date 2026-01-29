import { json, type Request, type Response } from "express";
import { RetellService } from '@airmeet/service';
import { Lead, Call } from '@airmeet/models'
import { queue } from '@airmeet/queues'

interface CallRequest {
    name: string;
    phNo: string;
    email: string;
}

interface ScheduleCallRequest {
    name: string;
    phNo: string;
    email: string;
    delay: number;
}

export class CallController {
    static async createCall(req: Request, res: Response) {

        const { name, phNo, email }: CallRequest = req.body;

        if (!phNo) {
            return res.status(400).json({
                message: "Phone number is required"
            })
        }

        // Agent ID (from .env)
        const agentId = process.env.AGENT_ID;
        if (!agentId) {
            return res.status(500).json({
                message: "Agent ID is not defined"
            })
        }

        let phoneCall;
        let lead;

        // Creating Dynamic variables for retell
        const dynamicVariables: any = {
            name, email, phone_number: phNo
            // Todo: add date and day context
        }

        // Database Finding or updating for storing the lead details
        try {
            lead = await Lead.findOne({ phNo: phNo });
            if (!lead) {
                const newLead = new Lead({
                    name, email, phNo: phNo
                })
                lead = await newLead.save();
                console.log(`New Lead created for ${phNo}`);
            } else {
                console.log(`Lead found for ${phNo}`);
            }
        } catch (e) {
            return res.status(500).json({
                message: `DB Error: ${e}`
            })
        }

        // Retell API CALL
        try {
            phoneCall = await RetellService.createPhoneCall({
                from_number: process.env.FROM_NUMBER,
                to_number: phNo,
                override_agent_id: agentId,
                retell_llm_dynamic_variables: dynamicVariables,
                metadata: {
                    leadId: lead?._id,
                }
            })
        } catch (e) {
            console.error(`error Retell: ${e}`)
        }

        let newCall;

        // Creating new Call in DB
        try {
            newCall = new Call({
                callId: phoneCall?.call_id,
                status: phoneCall?.call_status,
                fromNumber: process.env.FROM_NUMBER,
                toNumber: phNo,
                leadId: lead?._id,
            });
        } catch (e) {
            console.error(`failed to create call in database: ${e}`);
            return res.status(500).json({
                message: `DB updation failed`
            });
        }

        if (phoneCall) {
            return res.status(200).json({
                message: `Call created successfully callId : ${newCall._id}`,
                phoneCall,
            })
        }
    }

    static async scheduleCall(req: Request, res: Response) {
        const { name, phNo, email, delay }: ScheduleCallRequest = req.body;

        const delayMs = delay * 60 * 1000; 

        if (!name || !delay || !phNo) {
            return res.status(400).json({
                message: "Missing required fields: name, phNo, delay"
            })
        }

        if(delay < 1){
            return res.status(400).json({
                message: "Delay should be greater than or equal to 1"
            })
        }

        const agentId = process.env.AGENT_ID;
        if (!agentId) {
            return res.status(500).json({
                message: "Agent ID is not defined"
            })
        }
        const from_number = process.env.FROM_NUMBER;
        if (!from_number) {
            return res.status(500).json({
                message: "From number is not defined"
            })
        }

        const dynamicVariables: any = {
            name, email, phone_number: phNo
            // Todo: add date and day context
        }

        let lead;
        // Database Finding or updating for storing the lead details
        try {
            lead = await Lead.findOne({ phNo: phNo });
            if (!lead) {
                const newLead = new Lead({
                    name, email, phNo: phNo
                })
                lead = await newLead.save();
                console.log(`New Lead created for ${phNo}`);
            } else {
                console.log(`Lead found for ${phNo}`);
            }
        } catch (e) {
            return res.status(500).json({
                message: `DB Error: ${e}`
            })
        }
        // schedule the call on delay minutes in redis 
        
        // Metadata for retell
        const metadata = {
            leadId: lead?._id
        }

        const jobData = {
            metadata,
            from_number,
            agentId,
            dynamicVariables
        }
        const job = await queue.add('scheduled-call', jobData, {delay: delayMs, removeOnComplete: true});
        console.log(`Job created for ${phNo} and job created job: ${JSON.stringify(job)} with a delay of ${delayMs} mili secs`);
        return res.status(200).json({
            message: `Call scheduled successfully for ${phNo} and job created job: ${JSON.stringify(job)}`,
            jobId: job.id,
            delay_in_Ms: delayMs
        })
    }
}