import { Todo } from "../todo.types";
import { PlainObject } from "./PlainObject";

export const plainToTodo = (data: PlainObject): Todo => {
  return {
    id: data.id,
    title: data.title,
    completedAt: data.completedAt,
    status: data.status,
    createdAt: data.createdAt,
    dueDate: data.dueDate,
    repeatSettings: data.repeatSettings,
    calendarEventId: data.calendarEventId,
  }
}