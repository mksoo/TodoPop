import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export type RepeatFrequency = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface RepeatSettings {
  frequency: RepeatFrequency;
  daysOfWeek?: number[];  // 0-6 (일-토)
  daysOfMonth?: number[]; // 1-31
  interval?: number;      // n일/주/월마다
  endDate?: FirebaseFirestoreTypes.Timestamp;         // 반복 종료일
  lastCompleted?: FirebaseFirestoreTypes.Timestamp;   // 마지막 완료일
}

export interface Todo {
  id: string;
  title: string;
  status: 'ONGOING' | 'COMPLETED' | 'FAILED';
  createdAt: FirebaseFirestoreTypes.Timestamp;
  dueDate?: FirebaseFirestoreTypes.Timestamp;
  repeatSettings?: RepeatSettings;
  nextOccurrence?: FirebaseFirestoreTypes.Timestamp | null;
  googleCalendarEventId?: string;
} 
