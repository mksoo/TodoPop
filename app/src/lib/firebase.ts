import { getFirestore, collection, FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { Todo } from '../types/todo.types';

// Firebase 앱은 @react-native-firebase/app에 의해 자동으로 초기화되거나,
// 다른 Firebase 모듈(예: app-check)을 임포트할 때 초기화될 수 있습니다.
// 명시적인 initializeApp() 호출이 필수는 아닐 수 있습니다.

const db = getFirestore();

// 'todos' 컬렉션에 대한 참조입니다. Todo 타입을 명시적으로 사용하려면
// collection 함수 호출 시 두 번째 제네릭 인자로 전달하거나 (Firestore v9 Web SDK 방식),
// 또는 withConverter를 사용하는 것이 좋습니다.
// React Native Firebase에서는 아래와 같이 캐스팅 없이 사용해도 기본 타입으로 작동합니다.
// 필요하다면, todosCollection을 사용하는 곳에서 타입을 더 명확히 할 수 있습니다.
export const todosCollection = collection(db, 'Todos');

// --- [새로운 코드] users 컬렉션 참조 ---
// 'users' 컬렉션에 대한 참조입니다.
// 이 컬렉션에는 사용자 정보를 담은 문서들이 저장됩니다.
// 문서 ID는 Firebase Authentication의 사용자 UID (user.uid)를 사용하는 것이 일반적입니다.
export const usersCollection = collection(db, 'Users');

// db 인스턴스도 필요에 따라 export 할 수 있습니다.
export { db }; 