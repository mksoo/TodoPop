/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack'; // AppNavigator로 이동
// import TodoListScreen from './src/screens/TodoListScreen'; // AppNavigator로 이동
import AppNavigator from './src/navigation/AppNavigator'; // AppNavigator import
// const Stack = createNativeStackNavigator(); // AppNavigator로 이동

function App(): React.JSX.Element {
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
    // <View>
    //   <Text>Hello World</Text>
    // </View>
  );
}

export default App;
