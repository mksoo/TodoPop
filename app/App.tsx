import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Config from 'react-native-config';
// Firebase auth 관련 로직은 AuthProvider로 이동했습니다.
import { AuthProvider } from './src/contexts/AuthContext'; // AuthProvider import

import notifee, { EventType } from '@notifee/react-native';
import { getMessaging } from '@react-native-firebase/messaging';

import PermissionService from './src/services/PermissionService';
import FCMService from '@/services/FCMService';
import { Alert } from 'react-native';
import useDeeplink from '@/hooks/useDeeplink';



// Google Sign-In 초기 설정
// webClientId는 Google Cloud Console에서 가져온 웹 클라이언트 ID입니다.
GoogleSignin.configure({
  webClientId: Config.FIREBASE_WEB_CLIENT,
});

// React Query 클라이언트 인스턴스 생성
const queryClient = new QueryClient();

function App(): React.JSX.Element {
  // useDeeplink();
  useEffect(() => {
    const requestNotificationPermission = async () => FCMService.requestUserPermission();
    requestNotificationPermission();

    const unsubscribePushToken = FCMService.registerToken();
    const unsubscribeMessaging = getMessaging().onMessage(async remoteMessage => {
      // do something
      const {data, notification} = remoteMessage;

      // 여기서 팝업 표시하면 됨.
    });

    return () => {
      unsubscribePushToken();
      unsubscribeMessaging();
    };
  }, [PermissionService]);

  useEffect(() => {
    const unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
      switch (type) {
        case EventType.DISMISSED:
          console.log('User dismissed notification', detail.notification);
          break;
        case EventType.PRESS:
          console.log('User pressed notification', detail.notification);
          break;
      }
    });

    return () => {
      unsubscribe();
    }
  }, []);


  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
