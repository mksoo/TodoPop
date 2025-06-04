import React from 'react';
import { View, Button, StyleSheet, Alert, Platform, Text } from 'react-native';
import { GoogleSignin, statusCodes, User } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';

const LoginScreen = () => {
  const signInWithGoogle = async () => {
    try {
      // Android에서는 Play Service 사용 가능 여부 확인
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }
      
      // 사용자 정보 가져오기
      const userInfo = await GoogleSignin.signIn();

      if (!userInfo || !userInfo.data || !userInfo.data.idToken) { // userInfo 객체 자체도 확인
        Alert.alert('Google Sign-In Error', 'ID Token is missing or user info is invalid.');
        return;
      }
      Alert.alert('Google Sign-In Success', 'ID Token acquired.');

      // Firebase credential 생성
      const googleCredential = auth.GoogleAuthProvider.credential(userInfo.data.idToken);
      Alert.alert('Firebase Credential Created');

      // Firebase에 로그인
      const firebaseUserCredential = await auth().signInWithCredential(googleCredential);
      const displayName = firebaseUserCredential.user.displayName;
      const email = firebaseUserCredential.user.email;
      Alert.alert('Firebase Sign-In Success', `User: ${displayName || email || 'Unknown'}`);
      
      // 로그인 성공 후 처리 (예: 메인 화면으로 이동)
      // 이 부분은 Navigation 설정과 연동하여 구현합니다.
      console.log('Signed in with Google and Firebase!', firebaseUserCredential.user);

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
      <Button title="Google 계정으로 로그인" onPress={signInWithGoogle} />
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