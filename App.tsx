/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TodoListScreen from './src/features/todos/TodoListScreen'; // TodoListScreen 경로 수정
import { Text, View } from 'react-native';

const Stack = createNativeStackNavigator();

function App(): React.JSX.Element {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="TodoList" 
          component={TodoListScreen} 
          options={{ title: '나의 할 일' }} // 헤더 타이틀 설정
        />
        {/* 다른 화면들을 여기에 추가할 수 있습니다. */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
