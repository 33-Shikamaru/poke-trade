import { Link, useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase';
import { useState, useEffect } from "react"
import { doc, setDoc, getFirestore } from 'firebase/firestore';


function Trade() {
    return (
        <div>
        <h1>Trade</h1>
        </div>
    )
}

export default Trade;