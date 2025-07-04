import * as admin from "firebase-admin";

import chunk from "../../utils/chunk";
import usersService from "../users/users.service";
import {FieldValue} from "firebase-admin/firestore";
import sleep from "../../utils/sleep";
import {Notification} from "./notifications.interface";
import {User} from "../users/users.interface";
import {BaseMessage} from "firebase-admin/lib/messaging/messaging-api";
import {ScheduleEntry} from "../scheduleEntries/scheduleEntries.interface";
import dayjs from "dayjs";

class NotificationService {
  private getCollectionRef(args: {uid: string}) {
    const {uid} = args;
    return usersService.getRef({id: uid}).collection("Notifications");
  }

  async addNotifications(args: {receiverId: string; data: Notification}[]) {
    await Promise.all(
      chunk(args, 500).map(async (chunkedArgs) => {
        const batch = admin.firestore().batch();
        chunkedArgs.forEach((arg) => {
          const {receiverId, data} = arg;
          batch.create(this.getCollectionRef({uid: receiverId}).doc(), {
            ...data,
            createdAt: FieldValue.serverTimestamp(),
          });
        });
        await batch.commit();
        await sleep(1000);
      }),
    );
  }

  private generateFBBaseMessage(args: {
    title: string;
    body: string;
    deepLink?: string;
    inAppPush?: {inAppTitle: string; actionText?: string};
    imageUrl?: string;
  }): BaseMessage {
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
    receiver: Pick<User, "fcmToken">;
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
    const {receiver, alarm} = args;
    const {title, body, deepLink, imageUrl, inAppPush} = alarm;
    const {fcmToken} = receiver;
    if (!fcmToken) {
      return;
    }
    try {
      await admin.messaging().send({
        token: fcmToken,
        ...this.generateFBBaseMessage({
          title,
          body,
          deepLink,
          imageUrl,
          inAppPush,
        }),
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  formatDateWithKoreanDay(args: {date: Date}): string {
    const {date} = args;
    const dayjsDate = dayjs(date).tz("Asia/Seoul");
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    const dayOfWeek = days[date.getDay()];

    const formatted = dayjsDate.format(`YYYY.MM.DD(${dayOfWeek}) A hh:mm`);

    return formatted;
  }

  // 일정 시간이 되면 알림을 보내는 함수
  async notifySchedule(args: {scheduleEntry: ScheduleEntry}) {
    const {scheduleEntry} = args;
    const {startAt, title, uid} = scheduleEntry;
    const user = await usersService.findBy({id: uid});
    if (!user) {
      return;
    }

    if (!startAt) {
      return;
    }

    // startAt을 yyyy.mm.dd(요일) 시간 형식으로 변환
    const formattedStartAt = this.formatDateWithKoreanDay({
      date: startAt.toDate(),
    });

    await this.sendMessage({
      receiver: {
        fcmToken: user.fcmToken ?? "",
      },
      alarm: {
        title,
        body: formattedStartAt,
      },
    });
  }
}

export default new NotificationService();
