import { Link, useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase';
import { useState, useEffect } from "react"
import { doc, setDoc, getFirestore } from 'firebase/firestore';


function Friends() {
    return (
        <div>
        <h1>Friend List</h1>
        </div>
    )
}

export default Friends;