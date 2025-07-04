import * as admin from "firebase-admin";
import NotificationService from "../notifications/notifications.service";
import {docToScheduleEntry} from "./scheduleEntries.interface";
import dayjs from "dayjs";

class ScheduleEntriesService {
  async sendNotificationsForUpcomingSchedules() {
    const now = dayjs().startOf("minute");
    const nextMinute = now.add(1, "minute");

    const scheduleSnapshot = await admin
      .firestore()
      .collectionGroup("ScheduleEntries")
      .where("startAt", ">=", now.toDate())
      .where("startAt", "<", nextMinute.toDate())
      .get();

    if (scheduleSnapshot.empty) {
      console.log("No upcoming schedules");
      return;
    }

    for (const doc of scheduleSnapshot.docs) {
      const scheduleEntry = docToScheduleEntry(doc);
      await NotificationService.notifySchedule({
        scheduleEntry: {
          ...scheduleEntry,
          uid: doc.ref.parent.parent?.id ?? "", // Assuming uid is the parent's parent ID
        },
      });
    }
  }
}

export default new ScheduleEntriesService();
