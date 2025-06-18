import * as functions from "firebase-functions";
import TodosService from "./todos.service";
import {docToTodo} from "./todos.interface";
import TodoInstancesService from "../todo-instances/todo-instances.service";

export const markOverdueTodosOnSchedule = functions
  .pubsub
  .schedule("0 0 * * *")
  .timeZone("Asia/Seoul")
  .onRun(async () => {
    await TodosService.markOverdueTodosFailed();
    return null;
  });

export const todoOnCreated = functions.firestore
  .document("todos/{todoId}")
  .onCreate(async (snapshot) => {
    const todo = docToTodo(snapshot);

    try {
      const instances =
        await TodoInstancesService.generateTodoInstances({todo});
      for (const instance of instances) {
        await TodoInstancesService.create({instance});
      }
    } catch (error) {
      console.error("Error generating todo instances:", error);
      throw error;
    }
  });
