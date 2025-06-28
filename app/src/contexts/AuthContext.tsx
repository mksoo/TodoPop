import React, { useEffect, ReactNode } from 'react';
import auth from '@react-native-firebase/auth';
import useAuthStore from '@/stores/authStore';
import { listenUser } from '@/api/userApi';

interface AuthProviderProps {
  children: ReactNode;
}

// zustand만 사용하는 구조: Provider는 zustand 상태 초기화만 담당
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { setCurrentUser, setIsLoading } = useAuthStore();

  useEffect(() => {
    setIsLoading(true);
    let unSubscribeUser: (() => void) | undefined;
    const unsubscribe = auth().onAuthStateChanged(user => {
      if (!user) {
        setCurrentUser(null);
        setIsLoading(false);
        return;
      }
      const { uid, providerData } = user;
      const signInMethod = providerData[0]?.providerId === 'google.com' ? 'google' : 'email';
      unSubscribeUser = listenUser({
        uid,
        callback: (user) => {
          if (!user) {
            setIsLoading(false);
            return;
          }
          setCurrentUser({
            signInMethod,
            ...user
          });
          setIsLoading(false);
        }
      });
    });
    return () => {
      if (unSubscribeUser) {
        unSubscribeUser();
      }
      unsubscribe();
    };
  }, [setCurrentUser, setIsLoading]);

  return <>{children}</>;
}; 