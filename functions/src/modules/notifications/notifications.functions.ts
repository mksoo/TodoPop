import * as functions from "firebase-functions";
import usersService from "../users/users.service";
import notificationsService from "./notifications.service";
import {docToNotification} from "./notifications.interface";

export const NotificationOnCreate = functions
  .region("asia-northeast3")
  .firestore.document("Users/{uid}/notifications/{notificationId}")
  .onCreate(async (snapshot, context) => {
    const {uid} = context.params;
    const user = await usersService.findBy({id: uid});
    if (!user) {
      throw new functions.https.HttpsError("not-found", "User not found");
    }
    const {fcmToken} = user;
    if (!fcmToken) {
      throw new functions.https.HttpsError("not-found", "fcmToken not found");
    }

    const notification = docToNotification(snapshot);
    const {title, body, deepLink, imageUrl, inAppPush} = notification;

    await notificationsService.sendMessage({
      receiver: user,
      alarm: {
        title,
        body,
        deepLink,
        imageUrl,
        inAppPush,
      },
    });
  });
