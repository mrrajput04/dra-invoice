// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
	apiKey: "AIzaSyA0F9MlLg9H36F2FCiclvRDGSrLMV9_f8c",
	authDomain: "dra-invoice.firebaseapp.com",
	projectId: "dra-invoice",
	storageBucket: "dra-invoice.firebasestorage.app",
	messagingSenderId: "818739283601",
	appId: "1:818739283601:web:81bf9d917ba9feba76a130",
	measurementId: "G-Q6S6EQRF86"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);