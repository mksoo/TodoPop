import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export interface User {
  id: string;
  uid: string; // Firebase Authentication UID
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt: FirebaseFirestoreTypes.Timestamp;
} 