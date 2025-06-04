/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack'; // AppNavigator로 이동
// import TodoListScreen from './src/screens/TodoListScreen'; // AppNavigator로 이동
import AppNavigator from './src/navigation/AppNavigator'; // AppNavigator import
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

GoogleSignin.configure({
  webClientId: '245277363399-m9h3a896ifqqfnortvcc68nd779bq3oj.apps.googleusercontent.com',
});

const queryClient = new QueryClient();

function App(): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<FirebaseAuthTypes.User | null>(null);

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(user => {
      setCurrentUser(user);
      // onAuthStateChanged가 처음 호출될 때 로딩 상태를 false로 설정
      if (isLoading) { 
        setIsLoading(false);
      }
    });
    return subscriber; // unsubscribe on unmount
  }, [isLoading]); 

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <AppNavigator currentUser={currentUser} isLoading={isLoading} />
      </NavigationContainer>
    </QueryClientProvider>
  );
}

export default App;
