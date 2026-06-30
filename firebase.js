// ============================================================================
// firebase.js
// Konfigurasi utama Firebase PasarNusa
// Seluruh halaman mengimpor file ini.
// ============================================================================

// ======================
// IMPORT FIREBASE SDK
// ======================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {
    getStorage
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";


// ============================================================================
// FIREBASE CONFIG
// Untuk production gunakan Environment Variable / App Hosting Config.
// Fallback di bawah hanya untuk pengembangan lokal.
// ============================================================================

const firebaseConfig = {

    apiKey:
        window.__ENV__?.FIREBASE_API_KEY ??
        "AIzaSyDq9vebvgycrR27JMQ4Mlnf5JsgZu5KeQk",

    authDomain:
        window.__ENV__?.FIREBASE_AUTH_DOMAIN ??
        "pasarnusa-18aa0.firebaseapp.com",

    projectId:
        window.__ENV__?.FIREBASE_PROJECT_ID ??
        "pasarnusa-18aa0",

    storageBucket:
        window.__ENV__?.FIREBASE_STORAGE_BUCKET ??
        "pasarnusa-18aa0.firebasestorage.app",

    messagingSenderId:
        window.__ENV__?.FIREBASE_MESSAGING_SENDER_ID ??
        "866998011671",

    appId:
        window.__ENV__?.FIREBASE_APP_ID ??
        "1:866998011671:web:5555115feb82741ab55952",

    measurementId:
        window.__ENV__?.FIREBASE_MEASUREMENT_ID ??
        "G-Q861Y1J3RJ"

};


// ============================================================================
// INISIALISASI
// ============================================================================

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);

export const storage = getStorage(app);


// ============================================================================
// AUTH
// ============================================================================

export async function login(email, password) {
    return await signInWithEmailAndPassword(
        auth,
        email,
        password
    );
}

export async function register(email, password) {
    return await createUserWithEmailAndPassword(
        auth,
        email,
        password
    );
}

export async function logout() {
    return await signOut(auth);
}

export function authListener(callback) {
    return onAuthStateChanged(auth, callback);
}


// ============================================================================
// FIRESTORE HELPER
// ============================================================================

export async function getDocument(collectionName, id) {
    return await getDoc(doc(db, collectionName, id));
}

export async function getCollection(collectionName) {
    return await getDocs(collection(db, collectionName));
}

export async function createDocument(collectionName, id, data) {

    return await setDoc(
        doc(db, collectionName, id),
        {
            ...data,
            createdAt: serverTimestamp()
        }
    );

}

export async function updateDocument(collectionName, id, data) {

    return await updateDoc(
        doc(db, collectionName, id),
        data
    );

}

export async function deleteDocument(collectionName, id) {

    return await deleteDoc(
        doc(db, collectionName, id)
    );

}

export async function addDocument(collectionName, data) {

    return await addDoc(
        collection(db, collectionName),
        {
            ...data,
            createdAt: serverTimestamp()
        }
    );

}