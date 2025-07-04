import * as admin from "firebase-admin";
import NotificationService from "../notifications/notifications.service";
import {docToScheduleEntry} from "./scheduleEntries.interface";

class ScheduleEntriesService {
  async sendNotificationsForUpcomingSchedules() {
    const now = new Date();
    const nextMinute = new Date(now.getTime() + 60000);

    const scheduleSnapshot = await admin
      .firestore()
      .collectionGroup("ScheduleEntries")
      .where("startAt", ">=", now)
      .where("startAt", "<", nextMinute)
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
