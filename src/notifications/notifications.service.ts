import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { google } from 'googleapis';
import axios from 'axios';
import { Firestore } from '@google-cloud/firestore';
import * as dotenv from 'dotenv';
dotenv.config();


@Injectable()
export class NotificationsService {
    private firestore: Firestore;

    constructor() {
        this.firestore = new Firestore({
            projectId: process.env.FIREBASE_PROJECT_ID,
            keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
        });
    }

    async getAllDeviceTokens(): Promise<string[]> {
        try {
            const tokensSnapshot = await this.firestore.collection('deviceTokens').get();
            return tokensSnapshot.docs.map(doc => doc.data().token);
        } catch (error) {
            console.error('Error fetching device tokens:', error);
            throw new InternalServerErrorException('Could not fetch device tokens');
        }
    }

    async addDeviceToken(token: string): Promise<string> {
        try {
            const tokenRef = await this.firestore.collection("deviceTokens").add({ token });
            return tokenRef.id;
        } catch (error) {
            console.error("Error adding device token: ", error);
            throw new InternalServerErrorException("Could not add device token");
        }
    }



    private async getAccessToken(): Promise<string> {
        return new Promise((resolve, reject) => {
            const key = require('../../fcm-service-account.json'); // Adjust the path accordingly
            const jwtClient = new google.auth.JWT(
                key.client_email,
                null,
                key.private_key,
                ['https://www.googleapis.com/auth/firebase.messaging'],
                null,
            );

            jwtClient.authorize((err, tokens) => {
                if (err) {
                    console.error('Error authorizing JWT:', err);
                    reject(err);
                    return;
                }
                resolve(tokens.access_token);
            });
        });
    }

    async sendFCMNotification(
        token: string,
    ): Promise<void> {
        try {
            const accessToken = await this.getAccessToken();

            const payload = {
                message: {
                    token: token,
                    notification: {
                        title: "Notification",
                        body: "Notification Recieved",
                    },
                },
            };

            console.log('payload', payload)

            try {
                const response = await axios.post(
                    `https://fcm.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/messages:send`,
                    payload,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            'Content-Type': 'application/json',
                        },
                    },
                );

                console.log(`Notification sent successfully to ${token}:`, response.data);
            } catch (error) {
                console.error(`Error sending notification to ${token}:`, error.response ? {
                    status: error.response.status,
                    data: error.response.data.error.details,
                } : error.message);
            }

            console.log('All notifications processed');
        } catch (error) {
            console.error('Error sending notifications:', error);
            throw new InternalServerErrorException('Failed to send notifications');
        }
    }

}
