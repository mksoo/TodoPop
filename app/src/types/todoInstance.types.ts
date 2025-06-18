import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import { TodoStatus } from "./todo.types";

export interface TodoInstance {
  id: string;
  title: string;
  description?: string;
  status: TodoStatus;
  createdAt: FirebaseFirestoreTypes.Timestamp;
  completedAt?: FirebaseFirestoreTypes.Timestamp | null;
  dueDate?: FirebaseFirestoreTypes.Timestamp;
  templateId: string;
  instanceDate: FirebaseFirestoreTypes.Timestamp;
  tags?: string[];
  calendarEventId?: string;
}

