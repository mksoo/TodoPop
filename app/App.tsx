/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
// Firebase auth 관련 로직은 AuthProvider로 이동했습니다.
import { AuthProvider } from './src/contexts/AuthContext'; // AuthProvider import
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'; // isSameOrAfter 플러그인 import
import ko from 'dayjs/locale/ko';
import lunar from 'dayjs-lunar';

dayjs.extend(customParseFormat);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(lunar);
dayjs.locale(ko);

// Google Sign-In 초기 설정
// webClientId는 Google Cloud Console에서 가져온 웹 클라이언트 ID입니다.
GoogleSignin.configure({
  webClientId: '245277363399-m9h3a896ifqqfnortvcc68nd779bq3oj.apps.googleusercontent.com',
});

// React Query 클라이언트 인스턴스 생성
const queryClient = new QueryClient();

// 앱의 메인 컴포넌트
function App(): React.JSX.Element {

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
