import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import DOMPurify from 'isomorphic-dompurify';

export interface MailOptions {
    to: string;
    subject: string;
    html: string;
}

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private transporter: nodemailer.Transporter;

    constructor(private readonly configService: ConfigService) {
        const port = this.configService.get('MAIL_PORT') || 465;
        this.transporter = nodemailer.createTransport({
            host: this.configService.get('MAIL_HOST'),
            port: port,
            secure: port === 465, // SSL for port 465, TLS for others
            auth: {
                user: this.configService.get('MAIL_USER'),
                pass: this.configService.get('MAIL_PASS'),
            },
        });
    }

    async sendMail(options: MailOptions) {
        // [FIX-012] Step 1: Header Injection Protection
        if (/[\r\n]/.test(options.to) || /[\r\n]/.test(options.subject)) {
            this.logger.warn(`🛑 Header injection attempt detected from/to: ${options.to}`);
            throw new Error('Invalid email headers');
        }

        // [FIX-012] Step 2: HTML Sanitization (XSS Prevention)
        // [SEC] S8: Restricted to practically zero tags for maximum security
        const sanitizedHtml = DOMPurify.sanitize(options.html, {
            ALLOWED_TAGS: [], // [SEC] S8: Block ALL HTML tags for maximum security
            ALLOWED_ATTR: []
        });

        try {
            await this.transporter.sendMail({
                from: `"Apex V2" <${this.configService.get('MAIL_FROM')}>`,
                to: options.to,
                subject: options.subject,
                html: sanitizedHtml,
            });
            this.logger.log(`✅ Email sent (sanitized) to ${options.to}`);
        } catch (error: any) {
            this.logger.error(`Failed to send email: ${error.message}`);
            throw error;
        }
    }

    async sendVerificationEmail(to: string, token: string) {
        const link = `https://60sec.shop/verify?token=${token}`;
        await this.sendMail({
            to,
            subject: 'Verify your email',
            html: `<p>Please verify your email by clicking <a href="${link}">here</a>.</p>`,
        });
    }

    async sendEmail(options: MailOptions) {
        return this.sendMail(options);
    }
}
