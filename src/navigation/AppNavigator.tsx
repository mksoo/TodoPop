import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TodoListScreen from '../screens/TodoListScreen'; // 경로 수정

const Stack = createNativeStackNavigator();

export type RootStackParamList = {
  TodoList: undefined; // TodoList 화면은 파라미터가 없음
  // TodoDetail: { todoId: string }; // 예시: 상세 화면은 todoId 파라미터 필요
};

const AppNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="TodoList" 
        component={TodoListScreen} 
        options={{ title: '나의 할 일' }}
      />
      {/* 다른 화면들을 여기에 추가할 수 있습니다. */}
    </Stack.Navigator>
  );
};

export default AppNavigator; 