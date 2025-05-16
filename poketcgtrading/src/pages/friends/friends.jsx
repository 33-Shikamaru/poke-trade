import { Link, useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase';
import { useState, useEffect } from "react"
import { doc, setDoc, getDoc, getFirestore } from 'firebase/firestore';

function Friends() {
    const [friendList, setFriendList] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const db = getFirestore();

    const fetchFriendList = async () => {
        try {
            const user = auth.currentUser;
            if(!user) {
                throw new Error("User not authenticated");
            }

            const userRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userRef);

            if(userDoc.exists()) {
                const userData = userDoc.data();
                setFriendList(userData.friendList || []);
            }
            setLoading(false);
        } catch (error) {
            console.error("Error fetching friend list", error);
            setError(error.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFriendList();
    }, []);

    if (loading) {
        return (
          <div className="flex justify-center items-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        );
      }
    
      if (error) {
        return (
          <div className="text-red-500 text-center min-h-screen flex items-center justify-center">
            {error}
          </div>
        );
      }

    return (
        <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold mb-8">Friend List</h1>
          
          {friendList.length === 0 ? (
            <div className="text-center py-12 bg-gray-100">
              <p className="text-gray-600">Your friend list is empt</p>
            </div>
          ) : (
            <div>Hello</div>
          )}
        </div>
        </div>
    );
}

export default Friends;