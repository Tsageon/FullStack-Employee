// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore"; 
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCyfDg19hH252XHhE9_2FkKO6slyCONcDE",
  authDomain: "aaaaaa-dd695.firebaseapp.com",
  projectId: "aaaaaa-dd695",
  storageBucket: "aaaaaa-dd695.appspot.com",
  messagingSenderId: "275789597775",
  appId: "1:275789597775:web:bcb1fbe40daaeb1703ee3a",
  measurementId: "G-TKE54PWWV7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { storage ,db};