import * as functions from "firebase-functions";
import ScheduleEntriesService from "./scheduleEntries.service";

export const ScheduleNotificationOnSchedule = functions
  .region("asia-northeast3")
  .runWith({timeoutSeconds: 540})
  .pubsub.schedule("* * * * *")
  .timeZone("Asia/Seoul")
  .onRun(async () => {
    await ScheduleEntriesService.sendNotificationsForUpcomingSchedules();
  });
