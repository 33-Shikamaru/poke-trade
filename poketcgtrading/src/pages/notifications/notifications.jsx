import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { MdSwapHoriz, MdPeople, MdMessage } from "react-icons/md";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    // Set up real-time listener for notifications
    const notificationsRef = collection(db, 'users', auth.currentUser.uid, 'notifications');
    const q = query(
      notificationsRef,
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedNotifications = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date(doc.data().timestamp)
      }));
      setNotifications(fetchedNotifications);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching notifications:', error);
      setError('Error loading notifications. Please try again.');
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'trade_request':
        return <MdSwapHoriz className="text-blue-500 dark:text-blue-400 text-xl" />;
      case 'friend_request':
      case 'friend_request_accepted':
      case 'friend_request_declined':
        return <MdPeople className="text-green-500 dark:text-green-400 text-xl" />;
      case 'message':
        return <MdMessage className="text-purple-500 dark:text-purple-400 text-xl" />;
      default:
        return null;
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hour${Math.floor(diffInMinutes / 60) > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500 dark:text-red-400 text-center p-4 bg-red-100 dark:bg-red-900 dark:bg-opacity-30 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">Notifications</h1>
      
      {notifications.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          No notifications yet
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border ${
                notification.read 
                  ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' 
                  : 'bg-blue-50 dark:bg-gray-800 border-blue-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <p className="font-medium dark:text-gray-200">
                      {notification.type === 'trade_request' ? 'New Trade Request' :
                       notification.type === 'friend_request' ? 'Friend Request' :
                       notification.type === 'message' ? 'New Message' : 'Notification'}
                    </p>
                    {!notification.read && (
                      <span className="w-2 h-2 rounded-full bg-red-500 dark:bg-red-300 flex-shrink-0"></span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {formatTime(notification.timestamp)}
                  </p>
                  
                  {/* Status */}
                  {notification.status && (
                    <div className={`mt-2 text-sm ${
                      notification.status === 'accepted' 
                        ? 'text-green-500 dark:text-green-400' 
                        : notification.status === 'pending'
                        ? 'text-yellow-500 dark:text-yellow-400'
                        : 'text-red-500 dark:text-red-400'
                    }`}>
                      {notification.status === 'accepted' 
                        ? 'Accepted' 
                        : notification.status === 'pending'
                        ? 'Pending'
                        : 'Declined'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;