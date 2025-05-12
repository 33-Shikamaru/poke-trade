import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdDarkMode, MdNotifications } from "react-icons/md";
import { IoClose } from "react-icons/io5";
import Gengar from '../assets/gengar.png';

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

const UserMenu = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => {
    // Check if user has a saved preference
    const savedMode = localStorage.getItem('darkMode');
    // Check if user's system prefers dark mode
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
    // Save preference to localStorage
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  if (!isOpen) return null;

  const handleDarkModeToggle = () => {
    setDarkMode(!darkMode);
  };

  const handleNotificationsToggle = () => {
    setNotifications(!notifications);
    // TODO: Implement notifications toggle logic
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
            <img src={Gengar} alt="User Avatar" className='w-16 h-16 rounded-full m-2' />
            <div className='text-left dark:text-gray-200'>
              {/* TODO: Remove this user template data and use the actual user data */}
              <p className='text-sm'><span className='font-bold'>Username:</span> John Doe</p>
              <p className='text-sm'><span className='font-bold'>User ID:</span> 1234-56-7890</p>
            </div>
              <p className='text-xs text-center text-gray-500 dark:text-gray-400'>Joined on 01/01/2021</p>
              <p className='text-xs text-center mx-3 pt-2 italic dark:text-gray-300'>"Life is like a box of chocolates. You never know what you're gonna get."</p>
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