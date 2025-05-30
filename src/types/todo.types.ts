import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export interface RepeatSettings {
  type: 'daily' | 'weekly' | 'custom';
  days?: number[]; 
  interval?: number; 
}

export interface Todo {
  id: string;
  title: string;
  status: 'ONGOING' | 'COMPLETED' | 'FAILED';
  createdAt: FirebaseFirestoreTypes.Timestamp;
  dueDate?: FirebaseFirestoreTypes.Timestamp;
  repeat?: RepeatSettings;
  googleCalendarEventId?: string;
} 
