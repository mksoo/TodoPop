import { ScheduleEntry } from "../scheduleEntry.types";

export const plainToScheduleEntry = (plain: any): ScheduleEntry => {
  return {
    id: plain.id,
    type: plain.type,
    title: plain.title,
    description: plain.description,
    completed: plain.completed,
    startAt: plain.startAt,
    endAt: plain.endAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  }
}