import * as functions from "firebase-functions";
import TodosService from "./todos.service";

export const markOverdueTodosOnSchedule = functions
  .pubsub
  .schedule("0 0 * * *")
  .timeZone("Asia/Seoul")
  .onRun(async () => {
    await TodosService.markOverdueTodosFailed();
    return null;
  });
