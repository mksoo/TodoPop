import { Todo } from "../todo.types";
import { PlainObject } from "./PlainObject";

export const plainToTodo = (data: PlainObject): Todo => {
  return {
    id: data.id,
    title: data.title,
    completed: data.completed,
    failed: data.failed,
    createdAt: data.createdAt,
    dueDate: data.dueDate,
    repeat: data.repeat,
    googleCalendarEventId: data.googleCalendarEventId,
  }
}