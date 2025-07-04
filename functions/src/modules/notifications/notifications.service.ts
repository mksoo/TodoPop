import * as admin from 'firebase-admin';

import chunk from '../../utils/chunk';
import usersService from '../users/users.service';
import { FieldValue } from 'firebase-admin/firestore';
import sleep from '../../utils/sleep';
import { Notification } from './notifications.interface';
import { User } from '../users/users.interface';
import { BaseMessage } from 'firebase-admin/lib/messaging/messaging-api';

class NotificationService {
  private getCollectionRef(args: { uid: string }) {
    const { uid } = args;
    return usersService.getRef({ id: uid }).collection('Notifications');
  }

  private async addNotification(args: {
    receiverId: string;
    data: Notification;
  }) {
    await this.addNotifications([args]);
  }

  private async addNotifications(
    args: { receiverId: string; data: Notification }[],
  ) {
    await Promise.all(
      chunk(args, 500).map(async (chunkedArgs) => {
        const batch = admin.firestore().batch();
        chunkedArgs.forEach((arg) => {
          const { receiverId, data } = arg;
          batch.create(this.getCollectionRef({ uid: receiverId }).doc(), {
            ...data,
            createdAt: FieldValue.serverTimestamp(),
          });
        });
        await batch.commit();
        await sleep(1000);
      }),
    );
  }

  private generateFBBaseMessage(args: {title: string; body: string; deepLink?: string; inAppPush?: {inAppTitle: string; actionText?: string}; imageUrl?: string}): BaseMessage {
    const {title, body, deepLink, inAppPush, imageUrl} = args;
    return {
      notification: {
        title,
        body,
        ...(imageUrl && {imageUrl}),
      },
      data: {
        ...(deepLink && {deepLink}),
        ...inAppPush,
      },
      android: {
        priority: "high",
        notification: {
          ...(imageUrl && {imageUrl}),
          sound: "default",
        },
      },
      apns: {
        payload: {
          aps: {
            mutableContent: true,
            contentAvailable: true,
            sound: "default",
          },
        },
        fcmOptions: {
          ...(imageUrl && {imageUrl}),
        },
      },
    };
  }

  async sendMessage(args: {
    receiver: Pick<User, 'fcmToken'>;
    alarm: {
      title: string;
      body: string;
      deepLink?: string;
      imageUrl?: string;
      inAppPush?: {
        inAppTitle: string;
        actionText?: string;
      };
    };
  }) {
    const { receiver, alarm } = args;
    const { title, body, deepLink, imageUrl, inAppPush } = alarm;
    const { fcmToken } = receiver;
    if (!fcmToken) {
      return;
    }
    try {
        await admin.messaging().send({
            token: fcmToken,
            ...this.generateFBBaseMessage({title, body, deepLink, imageUrl, inAppPush})
        })
    } catch (error) {
        console.error(error);
        throw error;
    }
  }
}

export default new NotificationService();