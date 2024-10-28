import { Body, Controller, Post, Get, InternalServerErrorException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Post('register')
    async addDeviceToken(@Body('token') token: string): Promise<{ id: string }> {
        try {
            const id = await this.notificationsService.addDeviceToken(token);
            return { id }
        } catch (error) {
            throw new InternalServerErrorException('Could not add device token');
        }
    }

    @Get('tokens')
    async listTokens() {
        return this.notificationsService.getAllDeviceTokens()
    }

    @Post('send')
    async sendNotification(
        @Body() body: {
            token: string;
        },
    ) {
        return this.notificationsService.sendFCMNotification(
            body.token,
        );
    }
}
