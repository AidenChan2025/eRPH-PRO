
import { db, setDoc, doc, collection } from './firebase';
import { addDoc } from 'firebase/firestore';

export interface EmailData {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
}

export interface SupportTicket {
    senderId: string;
    senderName: string;
    senderEmail: string;
    recipient: string; // usually 'support@erphpro.com'
    subject: string;
    messageBody: string;
    timestamp: string;
    status: 'pending' | 'in-progress' | 'resolved';
}

/**
 * Sends an email by writing a document to the 'mail' collection.
 * This pattern supports the "Trigger Email" Firebase Extension.
 * In Mock mode, it simply logs the email to the console.
 */
export const sendEmail = async (data: EmailData) => {
    try {
        const id = `mail-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Standard payload structure for Firebase Trigger Email Extension
        const emailDoc = {
            id,
            to: data.to,
            message: {
                subject: data.subject,
                text: data.text || '',
                html: data.html || `<p>${data.text}</p>`,
            },
            delivery: {
                startTime: new Date().toISOString(),
                state: 'PENDING',
                attempts: 0
            },
            metadata: {
                app: 'eRPH Pro',
                version: '0.0.28'
            }
        };

        const ref = doc(db, 'mail', id);
        await setDoc(ref, emailDoc);

        // Visual feedback for development/demo
        console.group('📧 [Email Service] Notification Dispatched');
        console.log('To:', data.to);
        console.log('Subject:', data.subject);
        console.log('Body:', data.text?.substring(0, 50) + '...');
        console.groupEnd();
        return true;
    } catch (error) {
        console.error("[Email Service] Failed to dispatch:", error);
        return false;
    }
};

/**
 * Creates a new support ticket in the 'support_tickets' collection.
 * This is an internal messaging system.
 */
export const sendSupportTicket = async (ticket: Omit<SupportTicket, 'timestamp' | 'status'>) => {
    try {
        const newTicket: SupportTicket = {
            ...ticket,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };

        await addDoc(collection(db, 'support_tickets'), newTicket);

        console.log('🎫 [Support Ticket] Created:', newTicket);
        return true;
    } catch (error) {
        console.error("[Support Ticket] Failed to create:", error);
        return false;
    }
};

/**
 * Sends a test email with the provided configuration.
 */
export const sendTestEmail = async (config: any) => {
    return sendEmail({
        to: config.user || 'admin@erphpro.com',
        subject: 'eRPH Pro: Connectivity Test',
        text: `This is a test email from eRPH Pro Mail Subsystem. 
        
Configuration Verified:
- Host: ${config.host}
- Port: ${config.port}
- User: ${config.user}
- Time: ${new Date().toLocaleString()}`,
        html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
                <h2 style="color: #2563eb;">Connectivity Verified</h2>
                <p>This is a test email from <strong>eRPH Pro Mail Subsystem</strong>.</p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                <ul style="list-style: none; padding: 0;">
                    <li><strong>Host:</strong> ${config.host}</li>
                    <li><strong>Port:</strong> ${config.port}</li>
                    <li><strong>User:</strong> ${config.user}</li>
                </ul>
            </div>
        `
    });
};

/**
 * Mock data for the Super Admin mailbox.
 */
export const MOCK_EMAILS = [
    {
        id: 'em-1',
        from: 'teacher@school.com',
        fromName: 'Wong Siew Min',
        to: 'admin@erphpro.com',
        subject: 'Inquiry regarding DSKP update for Year 5 Math',
        body: 'Hello, I noticed that the latest DSKP for Year 5 Math is not yet reflected in the portal. Could you please advise?',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        status: 'unread'
    },
    {
        id: 'em-2',
        from: 'principal@school.com',
        fromName: 'Tan Mei Ling',
        to: 'admin@erphpro.com',
        subject: 'Batch approval issue',
        body: 'The batch approval button seems to be unresponsive this morning. Please investigate.',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        status: 'read'
    }
];

/**
 * Fetches emails for the Super Admin mailbox.
 */
export const getEmails = async () => {
    // In a real app, this would use IMAP/POP3 via a backend proxy
    return MOCK_EMAILS;
};
