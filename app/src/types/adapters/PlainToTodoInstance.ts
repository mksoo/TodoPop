import { TodoInstance } from "../todoInstance.types";
import { PlainObject } from "./PlainObject";

export const plainToTodoInstance = (data: PlainObject): TodoInstance => {
  return {
    id: data.id,
    title: data.title,
    description: data.description,
    status: data.status,
    createdAt: data.createdAt,
    completedAt: data.completedAt,
    dueDate: data.dueDate,
    templateId: data.templateId,
    instanceDate: data.instanceDate,
    tags: data.tags,
    calendarEventId: data.calendarEventId,
  }
}