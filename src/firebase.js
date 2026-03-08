// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDOjQXGY82B-UQ8D9O0ZXkiC6tnzb4cCT4",
  authDomain: "questionnairemanagementsystem.firebaseapp.com",
  projectId: "questionnairemanagementsystem",
  storageBucket: "questionnairemanagementsystem.firebasestorage.app",
  messagingSenderId: "225693433850",
  appId: "1:225693433850:web:464b8ddc5e66254424ee43",
  measurementId: "G-PH5WF9YXT2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };

