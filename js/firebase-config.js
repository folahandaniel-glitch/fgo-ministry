// Firebase configuration for the FGO Kingdom Portal website.
// This project's config values are safe to expose in client-side code —
// Firebase web app config is not a secret. Security is enforced by Firestore
// security rules (see README.md), not by hiding this file.

const firebaseConfig = {
  apiKey: "AIzaSyBeSNrQRQALeATmeW-tJDr6OBWgjgyIRq4",
  authDomain: "fgo-kingdom-dd7e8.firebaseapp.com",
  projectId: "fgo-kingdom-dd7e8",
  storageBucket: "fgo-kingdom-dd7e8.firebasestorage.app",
  messagingSenderId: "240902694046",
  appId: "1:240902694046:web:fe69ef75340203ad62078f"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
