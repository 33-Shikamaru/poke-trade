import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdNotifications, MdEdit, MdPerson, MdSecurity, MdHelp, MdStar, MdStarHalf, MdStarBorder } from 'react-icons/md';
import Gengar from '../../assets/gengar.png';

function Profile() {
  const navigate = useNavigate();

  // Dummy user data - replace with actual user data from database
  const userData = {
    username: "John Doe",
    userId: "1234-56-7890",
    joinDate: "01/01/2021",
    bio: "Life is like a box of chocolates. You never know what you're gonna get.",
    rating: 4.5,
    totalRatings: 28,
    stats: {
      trades: 42,
      friends: 15,
      cards: 156
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

  return (
    <div className='min-h-screen'>
      <div className='w-full max-w-lg mx-5 my-5'>
        <h1 className='text-4xl font-bold pb-5'>Profile</h1>
      </div>
      <div className="w-full min-h-screen p-4 flex justify-center items-start">
        <div className="w-full max-w-3xl bg-gray-100 dark:bg-gray-800 rounded-xl p-4 md:p-8 shadow-md">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-center gap-6 mb-8 p-6 bg-white dark:bg-gray-700 rounded-lg">
            <div className="relative">
              <img src={Gengar} alt="User Avatar" className='w-32 h-32 rounded-full' />
              <button className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors">
                <MdEdit className="text-xl" />
              </button>
            </div>
            <div className="flex-1 w-full">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div className="text-center md:text-left">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{userData.username}</h2>
                  <p className="text-gray-600 dark:text-gray-300">User ID: {userData.userId}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Joined on {userData.joinDate}</p>
                </div>
                <div className="flex flex-col items-center md:items-end">
                  <div className="flex">
                    {renderStars(userData.rating)}
                  </div>
                  <span className="text-gray-600 dark:text-gray-300 text-sm">
                    {userData.rating.toFixed(1)} ({userData.totalRatings} ratings)
                  </span>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 italic mt-4 text-center md:text-left">{userData.bio}</p>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg text-center">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{userData.stats.trades}</h3>
              <p className="text-gray-600 dark:text-gray-300">Trades</p>
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

          {/* Settings Section */}
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
        </div>
      </div>
    </div>
  );
}

export default Profile;
