import React from 'react';
import { View, TouchableOpacity, StyleSheet, Alert, Platform, Text } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { getAuth, GoogleAuthProvider } from '@react-native-firebase/auth';
import { useCheckAndCreateUser } from '../hooks/useuserMutations';
import { colors } from '../styles';

const LoginScreen = () => {
  const { mutate: checkAndCreateUser, isPending: isCheckingUser } = useCheckAndCreateUser();

  const signInWithGoogle = async () => {
    if (isCheckingUser) return;

    try {
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      const userInfo = await GoogleSignin.signIn();

      if (!userInfo || !userInfo.data || !userInfo.data.idToken) {
        Alert.alert('Google Sign-In Error', 'ID Token is missing or user info is invalid.');
        return;
      }

      const googleCredential = GoogleAuthProvider.credential(userInfo.data.idToken);
      const firebaseUserCredential = await getAuth().signInWithCredential(googleCredential);
      const user = firebaseUserCredential.user;

      if (user) {
        checkAndCreateUser(user);
      } else {
        Alert.alert('Firebase Sign-In Error', 'Failed to get Firebase user object after credential sign-in.');
      }

    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled the login flow.');
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
      <TouchableOpacity 
        style={[styles.googleButton, isCheckingUser && styles.googleButtonDisabled]} 
        onPress={signInWithGoogle} 
        disabled={isCheckingUser}
      >
        <View style={styles.googleIconWrapper}>
          <Text style={styles.googleIcon}>G</Text>
        </View>
        <Text style={styles.googleButtonText}>
          {isCheckingUser ? "로그인 중..." : "Google 계정으로 로그인"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background.secondary,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 64,
    color: colors.text.primary,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    minWidth: 250,
    justifyContent: 'center',
  },
  googleButtonDisabled: {
    backgroundColor: colors.text.disabled,
  },
  googleIconWrapper: {
    backgroundColor: colors.background.primary,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 24,
  },
  googleIcon: {
    color: '#4285F4',
    fontSize: 18,
    fontWeight: 'bold',
  },
  googleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  }
});

export default LoginScreen; 