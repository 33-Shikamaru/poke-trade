import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, getDocs, collection, query, setDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import Gengar from '../../assets/gengar.png'; // Default avatar
import { FaSearch, FaUserPlus, FaCheckCircle, FaUserMinus } from 'react-icons/fa'; // Icons
import Avatar1 from '../../assets/avatars/avatar1.png';
import Avatar2 from '../../assets/avatars/avatar2.png';
import Avatar3 from '../../assets/avatars/avatar3.png';
import Avatar4 from '../../assets/avatars/avatar4.png';
import Avatar5 from '../../assets/avatars/avatar5.png';
import Avatar6 from '../../assets/avatars/avatar6.png';
import Avatar7 from '../../assets/avatars/avatar7.png';
import Avatar8 from '../../assets/avatars/avatar8.png';
import Avatar9 from '../../assets/avatars/avatar9.png';

function Friends() {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [error, setError] = useState(null);

  // States for search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [sentRequests, setSentRequests] = useState({}); 

  const avatarOptions = [
    { image: Avatar1, name: "avatar1" },
    { image: Avatar2, name: "avatar2" },
    { image: Avatar3, name: "avatar3" },
    { image: Avatar4, name: "avatar4" },
    { image: Avatar5, name: "avatar5" },
    { image: Avatar6, name: "avatar6" },
    { image: Avatar7, name: "avatar7" },
    { image: Avatar8, name: "avatar8" },
    { image: Avatar9, name: "avatar9" },
    { image: null, name: "upload", isUpload: true }
  ];

  useEffect(() => {
    const fetchFriendsData = async () => {
      setLoadingFriends(true);
      setError(null);
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate('/login'); 
          return;
        }

        const userRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userRef); 
        if (!userDocSnap.exists()) {
          throw new Error('Current user not found in database');
        }

        const currentUserData = userDocSnap.data();
        const friendsListIds = currentUserData.friends || [];

        const friendsDetailsPromises = friendsListIds.map(async (friendId) => {
          const friendRef = doc(db, 'users', friendId);
          const friendDocSnap = await getDoc(friendRef); 
          if (friendDocSnap.exists()) {
            const data = friendDocSnap.data();
            // Get the avatar image based on the user's avatar selection
            const avatarIndex = data.avatarIndex || 0;
            const avatarImage = avatarOptions[avatarIndex]?.image || Gengar;
            
            return {
              userId: friendId,
              displayName: data.displayName || data.email,
              email: data.email,
              photoURL: data.photoURL,
              avatarImage: avatarImage,
              bio: data.bio,
              stats: {
                tradeComplete: data.stats?.tradeComplete || data.tradeComplete || 0,
                friends: data.friends?.length || 0,
                cards: (data.inventory || []).length,
              },
            };
          }
          return null;
        });

        const resolvedFriendsDetails = (await Promise.all(friendsDetailsPromises)).filter(friend => friend !== null);
        setFriends(resolvedFriendsDetails);
      } catch (err) {
        console.error('Error fetching friends:', err);
        setError(err.message);
      } finally {
        setLoadingFriends(false);
      }
    };

    fetchFriendsData();
  }, [navigate]);

  const handleSearchUsers = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);
    const currentUser = auth.currentUser;

    try {
      let potentialUsers = [];
      const lowerCaseQuery = searchQuery.toLowerCase();

      // Function to process user data and get avatar
      const processUserData = (userData, userId) => {
        // Parse avatar name from photoURL if it's in the format "avatar:avatarX"
        let avatarImage = Gengar;
        if (userData.photoURL && userData.photoURL.startsWith('avatar:')) {
          const avatarName = userData.photoURL.split(':')[1];
          const avatarOption = avatarOptions.find(option => option.name === avatarName);
          if (avatarOption) {
            avatarImage = avatarOption.image;
          }
        }

        return {
          userId: userId,
          displayName: userData.displayName || userData.email,
          email: userData.email,
          photoURL: userData.photoURL,
          avatarImage: avatarImage
        };
      };

      // Search by user ID if query is long enough
      if (searchQuery.length > 15) {
        try {
          const userDocRef = doc(db, "users", searchQuery);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            potentialUsers.push(processUserData(userData, userDocSnap.id));
          }
        } catch (idError) {
          console.log("Not a valid user ID or user not found by ID:", idError.message);
        }
      }

      // Search by name/email if no results from ID search
      if (potentialUsers.length === 0) {
        const usersCollectionRef = collection(db, 'users');
        const q = query(usersCollectionRef);
        const querySnapshot = await getDocs(q);
        
        querySnapshot.forEach((docSnap) => {
          const userData = docSnap.data();
          if (
            (userData.displayName && userData.displayName.toLowerCase().includes(lowerCaseQuery)) ||
            (userData.email && userData.email.toLowerCase().includes(lowerCaseQuery))
          ) {
            potentialUsers.push(processUserData(userData, docSnap.id));
          }
        });
      }

      // Filter out current user and existing friends
      const currentUserFriends = friends.map(f => f.userId);
      const filteredResults = potentialUsers.filter(user =>
        user.userId !== currentUser.uid && 
        !currentUserFriends.includes(user.userId)
      );

      setSearchResults(filteredResults);
      if (filteredResults.length === 0) {
        setSearchError('No users found matching your query, or they are already your friend.');
      }
    } catch (err) {
      console.error('Error searching users:', err);
      setSearchError('Failed to search users. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendFriendRequest = async (targetUserId, targetUserName) => {
    const currentUser = auth.currentUser;
    if (!currentUser || !targetUserId) return;

    setSentRequests(prev => ({ ...prev, [targetUserId]: true }));

    try {
      // Check if notifications sub-collection exists
      const recipientNotificationsRef = collection(db, 'users', targetUserId, 'notifications');
      const notificationsQuery = query(recipientNotificationsRef);
      const notificationsSnapshot = await getDocs(notificationsQuery);

      // Create the notification
      const newNotificationRef = doc(recipientNotificationsRef);
      await setDoc(newNotificationRef, {
        type: 'friend_request',
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email,
        senderPhotoURL: currentUser.photoURL || null,
        message: `${currentUser.displayName || currentUser.email} sent you a friend request.`,
        timestamp: new Date(),
        read: false,
        status: 'pending'
      });

    } catch (error) {
      console.error('Error sending friend request:', error);
      alert(`Failed to send friend request to ${targetUserName}. Please try again.`);
      setSentRequests(prev => {
        const newState = { ...prev };
        delete newState[targetUserId];
        return newState;
      });
    }
  };

  const handleRemoveFriend = async (friendId, friendName, e) => {
    e.stopPropagation(); // Prevent navigation to profile
    if (!window.confirm(`Are you sure you want to remove ${friendName} from your friends list?`)) {
      return;
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Remove friend from both users' friend lists
      const currentUserRef = doc(db, 'users', currentUser.uid);
      const friendUserRef = doc(db, 'users', friendId);
      
      await updateDoc(currentUserRef, {
        friends: arrayRemove(friendId)
      });
      
      await updateDoc(friendUserRef, {
        friends: arrayRemove(currentUser.uid)
      });

      // Create a notification for the other user
      const friendNotificationsRef = collection(db, 'users', friendId, 'notifications');
      const newNotificationRef = doc(friendNotificationsRef);
      await setDoc(newNotificationRef, {
        type: 'friend_removed',
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email,
        message: `${currentUser.displayName || currentUser.email} removed you from their friends list`,
        timestamp: new Date(),
        read: false
      });

      // Update local state
      setFriends(prevFriends => prevFriends.filter(friend => friend.userId !== friendId));

    } catch (error) {
      console.error('Error removing friend:', error);
      alert('Failed to remove friend. Please try again.');
    }
  };

  const renderFriendAvatar = (friend) => {
    if (friend.photoURL && friend.photoURL.startsWith('avatar:')) {
      const avatarName = friend.photoURL.split(':')[1];
      const avatar = avatarOptions.find(opt => opt.name === avatarName);
      if (avatar && !avatar.isUpload) {
        return <img src={avatar.image} alt={avatar.name} className="w-16 h-16 rounded-full object-cover" />;
      }
    }
    return <img src={friend.photoURL || Gengar} alt={friend.displayName} className="w-16 h-16 rounded-full object-cover" />;
  };

  if (loadingFriends) {
    return (
      <div className="min-h-screen flex justify-center items-center dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center dark:bg-gray-900">
        <div className="text-red-500 dark:text-red-400 text-center p-4 bg-red-100 dark:bg-red-900 dark:bg-opacity-30 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">My Friends</h1>
        <form onSubmit={handleSearchUsers} className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Find New Friends</h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or User ID..."
              className="flex-grow w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSearching ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
              ) : (
                <FaSearch className="mr-2" />
              )}
              Search
            </button>
          </div>
        </form>
        <>
          {isSearching && (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
          {searchError && (
            <div className="mb-6 text-center py-4 px-3 bg-red-50 dark:bg-red-900 dark:bg-opacity-50 rounded-md">
              <p className="text-red-600 dark:text-red-300">{searchError}</p>
            </div>
          )}
          {searchResults.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Search Results</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((user) => (
                  <div
                    key={user.userId}
                    className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-6 transition-shadow"
                  >
                    <div className="flex items-center space-x-4 mb-4">
                      <img
                        src={user.avatarImage || user.photoURL || Gengar}
                        alt={user.displayName}
                        className="w-16 h-16 rounded-full object-cover cursor-pointer"
                        onClick={() => navigate(`/profile/${user.userId}`)}
                      />
                      <div>
                        <h3
                          className="text-xl font-semibold text-gray-900 dark:text-white hover:underline cursor-pointer"
                          onClick={() => navigate(`/profile/${user.userId}`)}
                        >
                          {user.displayName}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSendFriendRequest(user.userId, user.displayName)}
                      disabled={sentRequests[user.userId]}
                      className={`w-full mt-4 px-4 py-2 rounded-lg text-white font-medium flex items-center justify-center transition-colors
                                  ${sentRequests[user.userId]
                                    ? 'bg-green-500 cursor-default'
                                    : 'bg-blue-500 hover:bg-blue-600'
                                  } disabled:opacity-70 disabled:cursor-not-allowed`}
                    >
                      {sentRequests[user.userId] ? (
                        <>
                          <FaCheckCircle className="mr-2" /> Request Sent
                        </>
                      ) : (
                        <>
                          <FaUserPlus className="mr-2" /> Add Friend
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <hr className="my-8 border-gray-300 dark:border-gray-700" />
          {friends.length === 0 && !loadingFriends && searchResults.length === 0 && !searchQuery ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                You haven't added any friends yet. Use the search above to find and add friends!
              </p>
            </div>
          ) : friends.length > 0 ? (
            <div>
              <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">Your Friends ({friends.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {friends.map((friend) => (
                  <div
                    key={friend.userId}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                  >
                    <div 
                      className="cursor-pointer"
                      onClick={() => navigate(`/profile/${friend.userId}`)}
                    >
                      <div className="flex items-center space-x-4">
                        {renderFriendAvatar(friend)}
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {friend.displayName}
                          </h2>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            {friend.email}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-xl font-bold text-gray-900 dark:text-white">
                            {friend.stats.tradeComplete}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Trades
                          </p>
                        </div>
                        <div>
                          <p className="text-xl font-bold text-gray-900 dark:text-white">
                            {friend.stats.friends}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Friends
                          </p>
                        </div>
                        <div>
                          <p className="text-xl font-bold text-gray-900 dark:text-white">
                            {friend.stats.cards}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Cards
                          </p>
                        </div>
                      </div>
                      {friend.bio && (
                        <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm italic">
                          "{friend.bio.substring(0, 60)}{friend.bio.length > 60 ? '...' : ''}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      </div>
    </div>
  );
}

export default Friends;