// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAm8Mi4bW77nQ9m5JvIne5ZOByy9Pg7G0E",
    authDomain: "toko-april.firebaseapp.com",
    projectId: "toko-april",
    storageBucket: "toko-april.firebasestorage.app",
    messagingSenderId: "172719783506",
    appId: "1:172719783506:web:6db1c0789fe7504b18e98b",
    measurementId: "G-RVDGLLYGYB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);