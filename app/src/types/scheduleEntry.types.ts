import { Timestamp } from "@react-native-firebase/firestore";

export interface ScheduleEntry {
  id: string;
  type: 'EVENT' | 'TASK' | 'HABIT';
  title: string;
  description?: string;
  completed: boolean;
  startAt?: Timestamp;
  endAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}