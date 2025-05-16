import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import Gengar from '../../assets/gengar.png';

function Friends() {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          throw new Error('User not found');
        }

        const userData = userDoc.data();
        const friendsList = userData.friends || [];

        // Fetch details for each friend
        const friendsDetails = await Promise.all(
          friendsList.map(async (friendId) => {
            const friendRef = doc(db, 'users', friendId);
            const friendDoc = await getDoc(friendRef);
            if (friendDoc.exists()) {
              const data = friendDoc.data();
              return {
                userId: friendId,
                displayName: data.displayName || data.email,
                email: data.email,
                photoURL: data.photoURL,
                bio: data.bio,
                stats: {
                  tradeComplete: data.tradeComplete || 0,
                  friends: data.friends?.length || 0,
                  cards: (data.inventory || []).length
                }
              };
            }
            return null;
          })
        );

        // Filter out any null values (deleted users)
        setFriends(friendsDetails.filter(friend => friend !== null));
      } catch (err) {
        console.error('Error fetching friends:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-red-500 text-center">
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">My Friends</h1>

        {friends.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">
              You haven't added any friends yet. Visit user profiles to add friends!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {friends.map((friend) => (
              <div
                key={friend.userId}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/profile/${friend.userId}`)}
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={friend.photoURL || Gengar}
                    alt={friend.displayName}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {friend.displayName}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {friend.email}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {friend.stats.tradeComplete}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Trades
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {friend.stats.friends}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Friends
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {friend.stats.cards}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Cards
                    </p>
                  </div>
                </div>
                {friend.bio && (
                  <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm italic">
                    "{friend.bio}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Friends;