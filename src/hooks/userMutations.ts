import { useMutation } from '@tanstack/react-query';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { checkAndCreateUserDocument } from '../api/userApi';
import { Alert } from 'react-native';

export const useCheckAndCreateUser = () => {
  return useMutation({
    mutationFn: (firebaseUser: FirebaseAuthTypes.User) => 
      checkAndCreateUserDocument(firebaseUser),
    onSuccess: (data) => {
      // API 함수에서 반환된 message를 사용하여 Alert 표시 -> 제거
      // Alert.alert(data.isNewUser ? '회원가입 완료' : '로그인 성공', data.message);
      console.log('User check/creation successful. Message:', data.message, 'UserData:', data.userData);
    },
    onError: (error) => {
      // API 함수에서 throw된 에러 또는 네트워크 에러 등을 처리
      Alert.alert('오류', error.message || '사용자 정보를 처리하는 중 문제가 발생했습니다.');
      console.error('Error in useCheckAndCreateUser mutation:', error);
    },
    // onSettled, onMutate 등 다른 옵션도 필요에 따라 추가할 수 있습니다.
  });
}; 