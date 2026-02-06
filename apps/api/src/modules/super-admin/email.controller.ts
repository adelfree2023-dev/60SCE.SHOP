import { Controller, Get, Post, Body, UseGuards, Query, Logger, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SuperAdminGuard, SkipTenantScope } from '@apex/security';
import { MailService } from '../mail/mail.service';
import axios from 'axios';

@Controller('super-admin/email')
@SkipTenantScope()
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class EmailController {
    private readonly logger = new Logger(EmailController.name);
    private readonly mailpitApi = 'http://apex-mailpit:8025/api/v1';

    constructor(private readonly mailService: MailService) { }

    @Get()
    async listEmails(@Query('page') page = 1) {
        try {
            const response = await axios.get(`${this.mailpitApi}/messages`);
            const messages = response.data.messages || [];

            return messages.map((msg: any) => ({
                id: msg.ID,
                subject: msg.Subject,
                from: msg.From?.Address || 'Unknown',
                to: msg.To?.map((t: any) => t.Address) || [],
                date: msg.Created,
                snippet: msg.Snippet
            }));
        } catch (error: any) {
            this.logger.error(`Failed to fetch emails: ${error.message}`);
            return [];
        }
    }

    @Get(':id')
    async getEmail(@Param('id') id: string) {
        try {
            const response = await axios.get(`${this.mailpitApi}/message/${id}`);
            return response.data;
        } catch (error: any) {
            this.logger.error(`Failed to fetch email ${id}: ${error.message}`);
            return null;
        }
    }

    @Post('send')
    async sendEmail(@Body() body: { to: string; subject: string; html: string }) {
        if (!body.to || !body.subject || !body.html) {
            return { success: false, message: 'Missing required fields' };
        }

        try {
            await this.mailService.sendEmail({
                to: body.to,
                subject: body.subject,
                html: body.html,
            });
            return { success: true };
        } catch (error: any) {
            this.logger.error(`Failed to send email: ${error.message}`);
            return { success: false, message: error.message };
        }
    }
}

