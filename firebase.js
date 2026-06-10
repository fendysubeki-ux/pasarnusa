import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDq9vebvgycrR27JMQ4Mlnf5JsgZu5KeQk",
  authDomain: "pasarnusa-18aa0.firebaseapp.com",
  projectId: "pasarnusa-18aa0",
  storageBucket: "pasarnusa-18aa0.firebasestorage.app",
  messagingSenderId: "866998011671",
  appId: "1:866998011671:web:5555115feb82741ab55952",
  measurementId: "G-Q861Y1J3RJ"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);