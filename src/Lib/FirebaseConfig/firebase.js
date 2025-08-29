
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getAuth,deleteUser } from 'firebase/auth';
const firebaseConfig = {
 apiKey: "AIzaSyCdzJ10ykHhS5XxbZoMcCkijbhKv_Bho-4",
  authDomain: "ticketmanagementsystem-d8d52.firebaseapp.com",
  databaseURL: "https://ticketmanagementsystem-d8d52-default-rtdb.firebaseio.com",
  projectId: "ticketmanagementsystem-d8d52",
  storageBucket: "ticketmanagementsystem-d8d52.firebasestorage.app",
  messagingSenderId: "774785974949",
  appId: "1:774785974949:web:be58d1a5436776cb2a834c",
  measurementId: "G-3GQHZN2VPR"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
// const db = getDatabase(app) 

export {auth,db,deleteUser}
