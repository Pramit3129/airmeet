import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
    throw new Error("RESEND_API_KEY not configured");
}

const resend = new Resend(apiKey);

const MAIL_FROM = process.env.MAIL_FROM || "";

if (!MAIL_FROM) {
    throw new Error("MAIL_FROM not configured");
}

export class EmailService {
    static async sendMail(userEmail: string, subject: string, message: string) {
        try {

            const htmlContent = `
                <h2>${message}</h2>
            `;

            const data = await resend.emails.send({
                from: MAIL_FROM,
                to: userEmail,
                subject: subject,
                html: htmlContent,
            });

            return data;
        } catch (error) {
            console.error("Error sending user report email:", error);
            throw error;
        }
    }
}
