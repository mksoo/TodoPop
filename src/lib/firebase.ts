import firebase from '@react-native-firebase/app';
import firestore from '@react-native-firebase/firestore';

export const db = firestore();

// 예시: 'todos' 컬렉션에 대한 참조
export const todosCollection = db.collection('todos'); 