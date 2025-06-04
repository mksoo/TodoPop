import React from 'react';
import { View, Button, StyleSheet, Alert, Platform, Text } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import { useCheckAndCreateUser } from '../hooks/userMutations';

const LoginScreen = () => {
  const { mutate: checkAndCreateUser, isPending: isCheckingUser } = useCheckAndCreateUser();

  const signInWithGoogle = async () => {
    try {
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      const userInfo = await GoogleSignin.signIn();

      if (!userInfo || !userInfo.data || !userInfo.data.idToken) {
        Alert.alert('Google Sign-In Error', 'ID Token is missing or user info is invalid.');
        return;
      }

      const googleCredential = auth.GoogleAuthProvider.credential(userInfo.data.idToken);
      const firebaseUserCredential = await auth().signInWithCredential(googleCredential);
      const user = firebaseUserCredential.user;

      if (user) {
        checkAndCreateUser(user);
      } else {
        Alert.alert('Firebase Sign-In Error', 'Failed to get Firebase user object after credential sign-in.');
      }

    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert('Login Cancelled', 'User cancelled the login flow.');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        Alert.alert('Login In Progress', 'Operation (e.g. sign in) is in progress already.');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Play Services Error', 'Play services not available or outdated.');
      } else {
        Alert.alert('Google Sign-In Error', error.message || 'An unknown error occurred.');
        console.error('Google Sign-In Error:', error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TodoPop</Text>
      <Button 
        title={isCheckingUser ? "로그인 중..." : "Google 계정으로 로그인"} 
        onPress={signInWithGoogle} 
        disabled={isCheckingUser}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 48,
    color: '#333',
  }
});

export default LoginScreen; 