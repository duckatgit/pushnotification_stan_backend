// src/firebase/firebase.module.ts
import { Module, Global } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
    imports: [ConfigModule],
    providers: [
        {
            provide: 'FIREBASE_ADMIN',
            useFactory: (configService: ConfigService) => {
                return admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId: configService.get('FIREBASE_PROJECT_ID'),
                        clientEmail: configService.get('FIREBASE_CLIENT_EMAIL'),
                        privateKey: configService.get('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
                    }),
                });
            },
            inject: [ConfigService],
        },
    ],
    exports: ['FIREBASE_ADMIN'],
})
export class FirebaseModule { }
