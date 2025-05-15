import { Link, useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase';
import { useState, useEffect } from "react"
import { doc, setDoc, getFirestore } from 'firebase/firestore';


function Friends() {
    return (
      <div className='min-h-screen'>
        <div className='w-full max-w-lg mx-5 my-5'>
          <h1 className='text-4xl font-bold pb-5'>Friends</h1>
        </div>
        
      </div>
    )
}

export default Friends;