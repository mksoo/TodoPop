import React, { createContext, useEffect, useContext, ReactNode } from 'react';
import auth from '@react-native-firebase/auth';
import useAuthStore from '@/stores/authStore';
import { listenUser } from '@/api/userApi';
import { User } from '@/types/user.types';

// AuthContext가 제공할 데이터 타입 정의
interface AuthContextType {
  currentUser: User | null; // 로그인된 사용자 정보 또는 null
  isLoading: boolean;      // 인증 상태 확인 중 여부
}

// React Context 생성 (초기값 undefined로, Provider 외부 사용 방지)
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider의 props 타입 정의
interface AuthProviderProps {
  children: ReactNode; // 하위에 감쌀 컴포넌트들
}

// AuthProvider: zustand와 Firebase를 연동하여 인증 상태를 전역 제공
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // zustand에서 인증 상태와 setter 가져오기
  const { currentUser, isLoading, setCurrentUser, setIsLoading } = useAuthStore();

  // Firebase 인증 상태 변화 감지 및 사용자 정보 구독
  useEffect(() => {
    setIsLoading(true); // 인증 확인 시작
    let unSubscribeUser: (() => void) | undefined; // 사용자 정보 구독 해제 함수
    const unsubscribe = auth().onAuthStateChanged(user => {
      if (!user) {
        // 로그아웃 또는 인증 해제 시
        setCurrentUser(null);
        setIsLoading(false);
        return;
      }
      // 로그인된 경우, provider 정보로 signInMethod 추출
      const {uid, providerData} = user;
      const signInMethod = (() => {
        const providerId = providerData[0]?.providerId;
        if (providerId === 'google.com') {
          return 'google';
        }
        return 'email';
      })();

      // Firestore 등에서 사용자 정보 실시간 구독
      unSubscribeUser = listenUser({uid, callback: (user) => {
        if (!user) {
          setIsLoading(false);
          return;
        }
        setCurrentUser({
          signInMethod,
          ...user
        });
        setIsLoading(false);
      }});
    });
    // 언마운트 시 구독 해제
    return () => {
      if (unSubscribeUser) {
        unSubscribeUser();
      }
      unsubscribe();
    }
  }, []);

  // Context Provider로 인증 상태 제공
  return (
    <AuthContext.Provider value={{ currentUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// useAuth: 하위 컴포넌트에서 인증 상태 쉽게 사용하도록 하는 커스텀 훅
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 