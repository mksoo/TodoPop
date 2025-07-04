import { DocumentSnapshot, Timestamp } from "firebase-admin/firestore";

export interface ScheduleEntry {
    id: string;
    type: "EVENT" | "TASK" | "HABIT";
    title: string;
    description?: string;
    completed: boolean;
    startAt?: Timestamp;
    endAt?: Timestamp;
    createdAt: Timestamp;
    updatedAt?: Timestamp;
    uid: string;
  }

export const docToScheduleEntry = (doc: DocumentSnapshot) => {
  const data = doc.data();
  return {
    id: doc.id,
    type: data?.type,
    title: data?.title,
    description: data?.description,
    completed: data?.completed,
    startAt: data?.startAt,
    endAt: data?.endAt,
    createdAt: data?.createdAt,
    updatedAt: data?.updatedAt,
    uid: data?.uid,
  }
}