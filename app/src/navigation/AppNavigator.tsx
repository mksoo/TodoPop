import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TodoListScreen from '../screens/TodoListScreen'; // 경로 수정
import TodoEditScreen from '../screens/TodoEditScreen'; // TodoEditScreen import
import LoginScreen from '../screens/LoginScreen'; // LoginScreen import
import { ActivityIndicator, View, StyleSheet } from 'react-native'; // 로딩 인디케이터
import { useAuth } from '../contexts/AuthContext'; // AuthContext로부터 인증 상태를 가져오기 위한 훅
import { colors } from '@/styles';
import CalendarScreen from '@/screens/CalendarScreen';
import { AuthStackParamList, MainStackParamList } from './navigation';
import ScheduleEntryAddScreen from '@/screens/ScheduleEntryAddScreen';
import ScheduleEntryEditScreen from '@/screens/ScheduleEntryEditScreen';

// --- 네비게이터 생성 --- 
// 각 스택에 대한 네비게이터 객체를 생성합니다.
const MainStack = createNativeStackNavigator<MainStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

// AppNavigator 컴포넌트: 앱의 전체적인 네비게이션 흐름을 관리합니다.
// 이제 props로 currentUser, isLoading을 받지 않고, useAuth() 훅을 사용하여
// AuthContext로부터 직접 인증 상태를 가져옵니다.
const AppNavigator: React.FC = () => {
  // useAuth 훅을 호출하여 현재 인증 상태(currentUser)와 로딩 상태(isLoading)를 가져옵니다.
  const { currentUser, isLoading } = useAuth();

  // 인증 상태를 확인하는 동안 (isLoading이 true일 때) 로딩 인디케이터를 표시합니다.
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // 로딩이 완료된 후, currentUser 값에 따라 다른 네비게이션 스택을 렌더링합니다.
  return currentUser ? (
    // currentUser가 존재하면 (로그인 상태이면) MainStack을 렌더링합니다.
    <MainStack.Navigator initialRouteName="Calendar">
      <MainStack.Screen 
        name="Calendar"
        component={CalendarScreen}
        options={{ headerShown: false }}
      />
      <MainStack.Screen 
        name="ScheduleEntryAdd"
        component={ScheduleEntryAddScreen}
        options={{ headerShown: false }}
      />
      <MainStack.Screen
        name="ScheduleEntryEdit"
        component={ScheduleEntryEditScreen}
        options={{ headerShown: false }}
      />
      <MainStack.Screen 
        name="TodoList" 
        component={TodoListScreen} 
        options={{ title: '나의 할 일' }}
      />
    </MainStack.Navigator>
  ) : (
    // currentUser가 존재하지 않으면 (로그아웃 상태이면) AuthStack을 렌더링합니다.
    <AuthStack.Navigator>
      <AuthStack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ headerShown: false }} // 로그인 화면에서는 헤더를 표시하지 않습니다.
      />
    </AuthStack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});


export default AppNavigator; 