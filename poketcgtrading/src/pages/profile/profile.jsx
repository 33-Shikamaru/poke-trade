import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MdDarkMode, MdNotifications, MdEdit, MdPerson, MdSecurity, MdHelp, MdStar, MdStarHalf, MdStarBorder, MdPersonAdd, MdCollections, MdClose } from 'react-icons/md';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import Gengar from '../../assets/gengar.png';

function Profile() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFriend, setIsFriend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    age: '',
    friendCode: '',
    bio: '',
    location: '',
    favoritePokemon: '',
    favoriteCard: ''
  });
  const isOwnProfile = !userId || userId === auth.currentUser?.uid;

  console.log('Profile component rendered with userId:', userId);
  console.log('Current user:', auth.currentUser?.uid);
  console.log('isOwnProfile:', isOwnProfile);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const targetUserId = userId || auth.currentUser?.uid;
        console.log('Fetching data for user:', targetUserId);

        if (!targetUserId) {
          console.log('No user ID provided');
          throw new Error('No user ID provided');
        }

        const userRef = doc(db, 'users', targetUserId);
        console.log('Fetching from Firestore path:', userRef.path);
        
        const userDoc = await getDoc(userRef);
        console.log('Firestore document exists:', userDoc.exists());

        if (!userDoc.exists()) {
          console.log('User document does not exist');
          throw new Error('User not found');
        }

        const data = userDoc.data();
        console.log('Raw user data from Firestore:', data);

        // Check if current user is in the target user's friends list
        const currentUser = auth.currentUser;
        if (currentUser && data.friends) {
          setIsFriend(data.friends.includes(currentUser.uid));
        }

        // Ensure all required fields exist with defaults
        const processedData = {
          ...data,
          userId: userDoc.id,
          displayName: data.displayName || data.email || 'Unknown User',
          email: data.email || '',
          photoURL: data.photoURL || null,
          bio: data.bio || 'No bio provided',
          createdAt: data.createdAt || new Date(),
          rating: data.rating || 0,
          totalRatings: data.totalRatings || 0,
          inventory: data.inventory || [],
          wishList: data.wishList || { cards: [] },
          stats: {
            tradeComplete: data.tradeComplete || 0,
            friends: data.friends?.length || 0,
            cards: (data.inventory || []).length
          }
        };

        console.log('Processed user data:', processedData);
        setUserData(processedData);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const handleAddFriend = async () => {
    if (!auth.currentUser || !userData) return;
    
    setIsLoading(true);
    try {
      // Create a notification in the recipient's notifications subcollection
      const recipientNotificationsRef = collection(db, 'users', userData.userId, 'notifications');
      const newNotificationRef = doc(recipientNotificationsRef);
      await setDoc(newNotificationRef, {
        type: 'friend_request',
        senderId: auth.currentUser.uid,
        senderName: auth.currentUser.displayName || auth.currentUser.email,
        message: `${auth.currentUser.displayName || auth.currentUser.email} sent you a friend request`,
        timestamp: new Date(),
        read: false
      });

      setIsFriend(true); // This will be updated when they accept
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('Failed to send friend request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!auth.currentUser || !userData) return;
    
    setIsLoading(true);
    try {
      const currentUserRef = doc(db, 'users', auth.currentUser.uid);
      const targetUserRef = doc(db, 'users', userData.userId);

      // Remove from current user's friends list
      await updateDoc(currentUserRef, {
        friends: arrayRemove(userData.userId)
      });

      // Remove from target user's friends list
      await updateDoc(targetUserRef, {
        friends: arrayRemove(auth.currentUser.uid)
      });

      setIsFriend(false);
      // Update the friends count in the UI
      setUserData(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          friends: Math.max(0, (prev.stats.friends || 0) - 1)
        }
      }));
    } catch (error) {
      console.error('Error removing friend:', error);
      alert('Failed to remove friend. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to render star rating
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<MdStar key={`full-${i}`} className="text-yellow-400 text-xl" />);
    }

    // Add half star if needed
    if (hasHalfStar) {
      stars.push(<MdStarHalf key="half" className="text-yellow-400 text-xl" />);
    }

    // Add empty stars
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<MdStarBorder key={`empty-${i}`} className="text-yellow-400 text-xl" />);
    }

    return stars;
  };

  const settings = [
    {
      id: 1,
      title: "Profile Settings",
      description: "Update your profile information and preferences",
      icon: <MdPerson className="text-blue-500 dark:text-blue-400 text-xl" />,
      onClick: () => navigate('/profile/settings')
    },
    {
      id: 2,
      title: "Security",
      description: "Manage your account security and privacy settings",
      icon: <MdSecurity className="text-green-500 dark:text-green-400 text-xl" />,
      onClick: () => navigate('/profile/security')
    },
    {
      id: 3,
      title: "Notifications",
      description: "Configure your notification preferences",
      icon: <MdNotifications className="text-purple-500 dark:text-purple-400 text-xl" />,
      onClick: () => navigate('/profile/notifications')
    },
    {
      id: 4,
      title: "Help & Support",
      description: "Get help and contact support",
      icon: <MdHelp className="text-orange-500 dark:text-orange-400 text-xl" />,
      onClick: () => navigate('/profile/help')
    }
  ];

  const handleEditClick = () => {
    setEditForm({
      displayName: userData.displayName || '',
      age: userData.age || '',
      friendCode: userData.friendCode || '',
      bio: userData.bio || '',
      location: userData.location || '',
      favoritePokemon: userData.favoritePokemon || '',
      favoriteCard: userData.favoriteCard || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setIsLoading(true);
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        ...editForm,
        updatedAt: new Date()
      });

      // Update local state
      setUserData(prev => ({
        ...prev,
        ...editForm
      }));

      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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

  if (!userData) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-gray-500 text-center">
          <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
          <p>The requested user profile could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen'>
      <div className='w-full max-w-lg mx-5 my-5'>
        <h1 className='text-4xl font-bold pb-5'>{isOwnProfile ? 'My Profile' : 'User Profile'}</h1>
      </div>
      <div className="w-full min-h-screen p-4 flex justify-center items-start">
        <div className="w-full max-w-3xl bg-gray-100 dark:bg-gray-800 rounded-xl p-4 md:p-8 shadow-md">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-center gap-6 mb-8 p-6 bg-white dark:bg-gray-700 rounded-lg">
            <div className="relative">
              <img 
                src={userData.photoURL || Gengar} 
                alt="User Avatar" 
                className='w-32 h-32 rounded-full object-cover'
              />
              {isOwnProfile && (
                <button 
                  onClick={handleEditClick}
                  className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
                >
                  <MdEdit className="text-xl" />
                </button>
              )}
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {userData.displayName || userData.email}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">User ID: {userData.userId}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Joined on {userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'Unknown date'}
                  </p>
                  {userData.age && (
                    <p className="text-gray-600 dark:text-gray-300 mt-1">
                      Age: {userData.age}
                    </p>
                  )}
                  {userData.location && (
                    <p className="text-gray-600 dark:text-gray-300 mt-1">
                      Location: {userData.location}
                    </p>
                  )}
                  {userData.friendCode && (
                    <p className="text-gray-600 dark:text-gray-300 mt-1">
                      TCGP Friend Code: {userData.friendCode}
                    </p>
                  )}
                  {userData.favoritePokemon && (
                    <p className="text-gray-600 dark:text-gray-300 mt-1">
                      Favorite Pokemon: {userData.favoritePokemon}
                    </p>
                  )}
                  {userData.favoriteCard && (
                    <p className="text-gray-600 dark:text-gray-300 mt-1">
                      Favorite Card: {userData.favoriteCard}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-center md:items-end">
                  <div className="flex">
                    {renderStars(userData.rating || 0)}
                  </div>
                  <span className="text-gray-600 dark:text-gray-300 text-sm">
                    {userData.rating?.toFixed(1) || '0.0'} ({userData.totalRatings || 0} ratings)
                  </span>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 italic mt-2">
                {userData.bio || 'No bio provided'}
              </p>
              {!isOwnProfile && (
                <div className="flex gap-2 w-full max-w-2xl">
                  <button
                    onClick={handleAddFriend}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-2 rounded-lg ${
                      isLoading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : isFriend
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    } transition-colors duration-200`}
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <MdPersonAdd className="text-xl" />
                        {isFriend ? 'Remove Friend' : 'Add Friend'}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => navigate(`/profile/${userData.userId}/inventory`)}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors duration-200"
                  >
                    <MdCollections className="text-xl" />
                    View Inventory
                  </button>
                  <button
                    onClick={() => navigate(`/profile/${userData.userId}/wishlist`)}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white transition-colors duration-200"
                  >
                    <MdStar className="text-xl" />
                    View Wishlist
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg text-center">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{userData.stats.tradeComplete}</h3>
              <p className="text-gray-600 dark:text-gray-300">Completed Trades</p>
            </div>
            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg text-center">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{userData.stats.friends}</h3>
              <p className="text-gray-600 dark:text-gray-300">Friends</p>
            </div>
            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg text-center">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{userData.stats.cards}</h3>
              <p className="text-gray-600 dark:text-gray-300">Cards</p>
            </div>
          </div>

          {/* Settings Section - Only show for own profile */}
          {isOwnProfile && (
            <div className="space-y-4">
              {settings.map((setting) => (
                <div 
                  key={setting.id}
                  className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={setting.onClick}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {setting.icon}
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                        {setting.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                        {setting.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Profile</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <MdClose className="text-2xl" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  placeholder="Enter your display name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Age
                </label>
                <input
                  type="number"
                  value={editForm.age}
                  onChange={(e) => setEditForm(prev => ({ ...prev, age: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  placeholder="Enter your age"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  TCG Pocket Friend Code
                </label>
                <input
                  type="text"
                  value={editForm.friendCode}
                  onChange={(e) => setEditForm(prev => ({ ...prev, friendCode: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  placeholder="Enter your friend code"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  placeholder="Enter your location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bio
                </label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                  rows="3"
                  placeholder="Tell us about yourself"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
