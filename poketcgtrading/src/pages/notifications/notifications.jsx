import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase';
import { useState, useEffect } from "react"
import { doc, setDoc, getFirestore } from 'firebase/firestore';
import { MdNotifications, MdPeople, MdSwapHoriz } from 'react-icons/md';

function Notifications() {
  const navigate = useNavigate();
  // Dummy notifications data
  const notifications = [
    {
      id: 1,
      type: 'trade',
      title: 'Trade Request',
      message: 'TrainerRed wants to trade their Charizard V for your Blastoise VMAX',
      timestamp: '2024-03-15T10:30:00',
      read: false,
      icon: <MdSwapHoriz className="text-blue-500 dark:text-blue-400 text-xl" />
    },
    {
      id: 2,
      type: 'friend',
      title: 'Friend Request',
      message: 'PokeMaster99 wants to be your friend',
      timestamp: '2024-03-14T15:45:00',
      read: true,
      icon: <MdPeople className="text-green-500 dark:text-green-400 text-xl" />
    },
    {
      id: 3,
      type: 'trade',
      title: 'Trade Request',
      message: 'AshKetchum wants to trade their Charizard V for your Blastoise VMAX',
      timestamp: '2024-03-14T09:20:00',
      read: false,
      icon: <MdSwapHoriz className="text-blue-500 dark:text-blue-400 text-xl" />
    }
  ];

  // Function to format the timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className='min-h-screen'>
      <div className='w-full max-w-lg mx-5 my-5'>
        <h1 className='text-4xl font-bold pb-5'>Notifications</h1>
      </div>
      <div className="w-full min-h-screen p-4 flex justify-center items-start">
        <div className="w-full max-w-3xl bg-gray-100 dark:bg-gray-800 rounded-xl p-4 md:p-8 shadow-md">
          {notifications.length === 0 ? (
            <div className="text-center py-12 px-4 text-gray-600 dark:text-gray-400 text-lg">
              No notifications here yet! 📬
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
                  onClick={() => navigate(`/trade=${notification.id}`)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {notification.icon}
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="w-2 h-2 rounded-full bg-red-500 dark:bg-red-300 flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                        {notification.message}
                      </p>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-2 block">
                        {formatTime(notification.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Notifications;