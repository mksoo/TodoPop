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
  // currentUser, isLoading 상태 및 Firebase auth 리스너 로직은 AuthProvider 내부로 이동되었습니다.

  return (
    // React Query Provider: 앱 전체에서 React Query 기능을 사용할 수 있도록 설정합니다.
    <QueryClientProvider client={queryClient}>
      {/* AuthProvider: 앱 전체에 인증 관련 상태(currentUser, isLoading)를 제공합니다. */}
      {/* AuthProvider로 감싸진 모든 하위 컴포넌트들은 useAuth 훅을 통해 이 상태 값들에 접근할 수 있습니다. */}
      <AuthProvider>
        {/* NavigationContainer: React Navigation의 네비게이션 기능을 사용하기 위한 최상위 컨테이너입니다. */}
        <NavigationContainer>
          {/* AppNavigator: 앱의 전체 네비게이션 로직을 담당합니다. */}
          {/* AuthProvider 내부로 이동하면서 더 이상 currentUser, isLoading props를 직접 받지 않고, */}
          {/* AppNavigator 내부에서 useAuth 훅을 사용하여 인증 상태를 가져옵니다. */}
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
