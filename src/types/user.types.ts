import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

/**
 * Firestore의 'users' 컬렉션에 저장될 사용자 정보의 구조를 정의하는 인터페이스입니다.
 */
export interface FirestoreUser {
  uid: string; // Firebase Authentication UID
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt: FirebaseFirestoreTypes.Timestamp; // 계정 생성(또는 Firestore 문서 첫 생성) 시각
  // 여기에 추가적인 사용자 관련 필드를 정의할 수 있습니다.
  // 예: lastLoginAt?: FirebaseFirestoreTypes.Timestamp;
  // 예: customProfileField?: string;
} 