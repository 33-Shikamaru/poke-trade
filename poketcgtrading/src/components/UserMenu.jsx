import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdDarkMode, MdNotifications } from "react-icons/md";
import { IoClose } from "react-icons/io5";
import Gengar from '../assets/gengar.png';
import { auth } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Avatar1 from '../assets/avatars/avatar1.png';
import Avatar2 from '../assets/avatars/avatar2.png';
import Avatar3 from '../assets/avatars/avatar3.png';
import Avatar4 from '../assets/avatars/avatar4.png';
import Avatar5 from '../assets/avatars/avatar5.png';
import Avatar6 from '../assets/avatars/avatar6.png';
import Avatar7 from '../assets/avatars/avatar7.png';
import Avatar8 from '../assets/avatars/avatar8.png';
import Avatar9 from '../assets/avatars/avatar9.png';

const avatarOptions = [
  { image: Avatar1, name: "avatar1" },
  { image: Avatar2, name: "avatar2" },
  { image: Avatar3, name: "avatar3" },
  { image: Avatar4, name: "avatar4" },
  { image: Avatar5, name: "avatar5" },
  { image: Avatar6, name: "avatar6" },
  { image: Avatar7, name: "avatar7" },
  { image: Avatar8, name: "avatar8" },
  { image: Avatar9, name: "avatar9" }
];

const ToggleSwitch = ({ isOn, handleToggle, icon, label }) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-medium dark:text-gray-200">{label}</span>
      </div>
      <button
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
          isOn ? 'bg-blue-400' : 'bg-gray-200 dark:bg-gray-600'
        }`}
        onClick={handleToggle}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isOn ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};

const UserMenu = ({ isOpen, onClose, userData, setUserData }) => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return savedMode ? JSON.parse(savedMode) : prefersDark;
  });
  const [notifications, setNotifications] = useState(true);

  // Apply dark mode on initial load and when it changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  if (!isOpen) return null;

  const handleDarkModeToggle = () => {
    setDarkMode(!darkMode);
  };

  const handleNotificationsToggle = () => {
    setNotifications(!notifications);
  };

  const renderAvatar = () => {
    if (!userData?.photoURL) return Gengar;
    
    if (userData.photoURL.startsWith('avatar:')) {
      const avatarName = userData.photoURL.split(':')[1];
      const avatar = avatarOptions.find(opt => opt.name === avatarName);
      return avatar ? avatar.image : Gengar;
    }
    
    return userData.photoURL;
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-10 dark:bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* User Menu */}
      <div className="fixed right-4 top-16 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center gap-2 dark:text-white">
            Profile
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-white rounded-lg p-1 hover:bg-red-300 dark:text-gray-400"
          >
            <IoClose className='text-xl' />
          </button>
        </div>
        
        <div className='flex justify-center border-b border-gray-200 dark:border-gray-700'>
          <div className='p-2 flex flex-col justify-center items-center text-center'>
            <img src={renderAvatar()} alt="User Avatar" className='w-16 h-16 rounded-full m-2 object-cover' />
            <div className='text-left dark:text-gray-200'>
              <p className='text-sm'><span className='font-bold'>Username:</span> {userData?.displayName || auth.currentUser?.displayName || 'User'}</p>
              <p className='text-sm'><span className='font-bold'>User ID:</span> {auth.currentUser?.uid}</p>
            </div>
            <p className='text-xs text-center text-gray-500 dark:text-gray-400'>
              Joined on {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'Unknown date'}
            </p>
            <p className='text-xs text-center mx-3 pt-2 italic dark:text-gray-300'>
              {userData?.bio || 'No bio provided'}
            </p>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          <ToggleSwitch
            isOn={darkMode}
            handleToggle={handleDarkModeToggle}
            icon={<MdDarkMode className="text-xl text-gray-600 dark:text-gray-400" />}
            label="Dark Mode"
          />
          
          <ToggleSwitch
            isOn={notifications}
            handleToggle={handleNotificationsToggle}
            icon={<MdNotifications className="text-xl text-gray-600 dark:text-gray-400" />}
            label="Notification Overlays"
          />
        </div>
        
        <div className="p-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <button 
            className="w-full text-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            onClick={() => navigate('/profile')}
          >
            View Profile Settings
          </button>
        </div>
      </div>
    </>
  );
};
export default UserMenu;