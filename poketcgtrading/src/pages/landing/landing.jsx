import landingLogo from '../../assets/landing-logo.jpg';
import google from '../../assets/Google_"G"_logo.svg.png'
import { Link, useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase';
import { useState, useEffect } from "react"
import { doc, setDoc, getFirestore } from 'firebase/firestore';

function Landing() {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [appUsers, setAppUsers] = useState([]);
    const db = getFirestore();

    const handleGoogleSignIn = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            navigate('/explore');
        } catch (error) {
            console.error('Error with Google sign-in', error);
            setError(error.message);
        }
    }

    const handleGoogleSignUp = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            
            // Create user document in Firestore
            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                createdAt: new Date().toISOString(),
                age : 0,
                firstName: "",
                lastName: "",
                friendCode: "",
                friendList: [],
                inventory: [],
                offers: [],
                rating: 0,
                tradeComplete: 0,
                trades: [],
                wishList: {
                    cards: [],
                    favorites: []
                }
            });

            navigate('/explore');
        } catch (error) {
            console.error('Error with Google sign-up', error);
            setError(error.message);
        }
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row items-center justify-center gap-20 p-4">
            <div className="w-full max-w-lg mx-5 flex flex-col justify-center p-8 border border-black rounded-lg">
                <h1 className="text-4xl font-bold pb-5">Sign In</h1>
                <div className='flex justify-start'>
                    <p className='text-gray-400 pr-2'>Don't have an account?</p>
                    <button className="text-blue-500 hover:text-blue-700"
                    onClick={handleGoogleSignUp}>Create now</button>
                </div>
                <div className='py-3'>
                    <label className='block text-gray-600 text-sm'>Email</label>
                    <input type="email"
                    id='email'
                    className='w-full bg-gray-50 border border-gray rounded-lg text-sm p-2 mt-2'
                    placeholder='example@gmail.com' />
                </div>
                <div className='pb-3'>
                    <label className='block text-gray-600 text-sm'>Password</label>
                    <input type="password"
                    id='password'
                    className='w-full bg-gray-50 border border-gray rounded-lg text-sm p-2 mt-2'
                    placeholder='enter your password' />
                </div>
                <div className="pb-3 flex flex-row justify-between items-center">
                    <span>
                    <input type="checkbox"
                    id='remember'
                    className='w-4 h-4 text-blue-600 border border-gray-200 rounded' />
                    <label className='ml-2 text-sm text-gray-600'>Remember me</label>
                    </span>
                    <Link to="/signup" className="text-sm text-blue-500 hover:text-blue-700">Forgot Password?</Link>
                </div>
                <button className='w-full bg-black text-white p-2 border rounded-lg my-3'
                onClick={()=>navigate('/explore')}>Sign in</button>
                <div className="relative flex items-center my-5">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="flex-shrink mx-4 text-gray-500 text-xs">OR</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                </div>
                <button 
                    onClick={handleGoogleSignIn}
                    className='flex flex-row items-center justify-center space-x-4 text-black p-2 border border-gray rounded-xl my-3 hover:bg-gray-100'
                >
                    <img className="w-5 h-5" src={google} alt="Google logo" />
                    <span>Continue with Google</span>
                </button>
            </div>
            <div className="w-full max-w-lg mx-5 flex flex-col items-center justify-center">
                <img className='size-64 mx-auto' src={landingLogo} alt="The logo of the page on the landing page" />
                <h1 className="text-4xl font-bold">How does it works?</h1>
                <ol className="list-decimal py-5 leading-relax space-y-2">
                    <li>Look for the card you want</li>
                    <li>Send offer for that card</li>
                    <li>Other trader accepts your offer/ send counter-offer</li>
                    <li>Accept the counter-offer</li>
                    <li>Add friend on TCG Pocket App</li>
                    <li>Complete the trade</li>
                    <li>Rate the transaction</li>
                    <li>Enjoy your new card!!!</li>
                </ol>
            </div>
        </div>
    );
}

export default Landing;