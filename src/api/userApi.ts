import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { Timestamp } from '@react-native-firebase/firestore';
import { usersCollection } from '../lib/firebase';
import { FirestoreUser } from '../types/user.types';

interface CheckAndCreateUserResult {
  isNewUser: boolean;
  message: string;
  userData?: FirestoreUser; // 신규 생성 시 사용자 데이터 반환
}

/**
 * Firebase 인증 사용자를 받아 Firestore에 해당 사용자의 문서가 있는지 확인하고,
 * 존재하지 않으면 새로운 사용자 문서를 생성합니다.
 * @param firebaseUser Firebase Authentication을 통해 얻은 사용자 객체입니다.
 * @returns 작업 결과 객체 (isNewUser, message, userData?)
 */
export const checkAndCreateUserDocument = async (
  firebaseUser: FirebaseAuthTypes.User,
): Promise<CheckAndCreateUserResult> => {
  if (!firebaseUser) {
    throw new Error('Firebase user object is required.');
  }

  try {
    const userDocRef = usersCollection.doc(firebaseUser.uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists()) {
      // 신규 사용자: Firestore에 정보 저장
      const newUserData: FirestoreUser = {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL,
        createdAt: Timestamp.now(),
      };
      await userDocRef.set(newUserData);
      console.log('New user registered and data saved to Firestore:', newUserData);
      return {
        isNewUser: true,
        message: '회원가입이 완료되었습니다. TodoPop에 오신 것을 환영합니다!',
        userData: newUserData,
      };
    } else {
      // 기존 사용자
      console.log('Existing user logged in:', firebaseUser.uid);
      const existingUserData = userDoc.data() as FirestoreUser; // 타입 단언
      return {
        isNewUser: false,
        message: `${firebaseUser.displayName || firebaseUser.email || '사용자'}님, 다시 오신 것을 환영합니다!`,
        userData: existingUserData, // 기존 사용자 데이터도 반환 (API 호출 측에서 이름이 바뀐 경우 대비)
      };
    }
  } catch (error) {
    console.error('Error in checkAndCreateUserDocument:', error);
    // 실제 앱에서는 좀 더 정교한 오류 객체 또는 메시지를 반환하는 것이 좋습니다.
    throw new Error('사용자 정보를 확인하거나 생성하는 중 오류가 발생했습니다.');
  }
}; 