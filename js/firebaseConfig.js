import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBY2dL-RKSCKuPWCK091hlfJKTPXq9tLA0",
    authDomain: "rumah-digicraft-e1bbb.firebaseapp.com",
    projectId: "rumah-digicraft-e1bbb",
    storageBucket: "rumah-digicraft-e1bbb.firebasestorage.app",
    messagingSenderId: "1094755607741",
    appId: "1:1094755607741:web:ca823337664351694ac3d4",
    measurementId: "G-7YN8V5LDBM"
  };

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

export { db, collection, getDocs };