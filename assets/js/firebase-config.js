const firebaseConfig = {
    apiKey: "AIzaSyAm8Mi4bW77nQ9m5JvIne5ZOByy9Pg7G0E",
    authDomain: "toko-april.firebaseapp.com",
    projectId: "toko-april",
    storageBucket: "toko-april.firebasestorage.app",
    messagingSenderId: "172719783506",
    appId: "1:172719783506:web:6db1c0789fe7504b18e98b",
    measurementId: "G-RVDGLLYGYB"
};

// Initialize Firebase (Compat mode for v8 scripts used in HTML)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();