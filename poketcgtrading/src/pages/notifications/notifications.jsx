import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { MdSwapHoriz, MdPeople, MdMessage, MdCheck, MdClose } from "react-icons/md";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!auth.currentUser) return;

      try {
        const notificationsRef = collection(db, 'notifications');
        const q = query(
          notificationsRef,
          where('recipientId', '==', auth.currentUser.uid),
          orderBy('timestamp', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const fetchedNotifications = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setNotifications(fetchedNotifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleAccept = async (notification) => {
    try {
      // Mark notification as read
      const notificationRef = doc(db, 'notifications', notification.id);
      await updateDoc(notificationRef, {
        read: true,
        status: 'accepted'
      });

      // Handle different types of accept actions
      switch (notification.type) {
        case 'trade_request':
          // Navigate to trade page with the trade ID
          window.location.href = `/trade/${notification.senderId}`;
          break;
        case 'friend_request':
          // Add friend to both users' friend lists
          const currentUserRef = doc(db, 'users', auth.currentUser.uid);
          const senderUserRef = doc(db, 'users', notification.senderId);
          
          await updateDoc(currentUserRef, {
            friends: arrayUnion(notification.senderId)
          });
          
          await updateDoc(senderUserRef, {
            friends: arrayUnion(auth.currentUser.uid)
          });
          break;
      }

      // Update local state
      setNotifications(prev => prev.map(n => 
        n.id === notification.id ? { ...n, read: true, status: 'accepted' } : n
      ));
    } catch (error) {
      console.error('Error accepting notification:', error);
    }
  };

  const handleDecline = async (notification) => {
    try {
      // Mark notification as read and declined
      const notificationRef = doc(db, 'notifications', notification.id);
      await updateDoc(notificationRef, {
        read: true,
        status: 'declined'
      });

      // Update local state
      setNotifications(prev => prev.map(n => 
        n.id === notification.id ? { ...n, read: true, status: 'declined' } : n
      ));
    } catch (error) {
      console.error('Error declining notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'trade_request':
        return <MdSwapHoriz className="text-blue-500 dark:text-blue-400 text-xl" />;
      case 'friend_request':
        return <MdPeople className="text-green-500 dark:text-green-400 text-xl" />;
      case 'message':
        return <MdMessage className="text-purple-500 dark:text-purple-400 text-xl" />;
      default:
        return null;
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
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
                  
                  {/* Action Buttons */}
                  {(notification.type === 'trade_request' || notification.type === 'friend_request') && 
                   !notification.status && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleAccept(notification)}
                        className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                      >
                        <MdCheck /> Accept
                      </button>
                      <button
                        onClick={() => handleDecline(notification)}
                        className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                      >
                        <MdClose /> Decline
                      </button>
                    </div>
                  )}
                  
                  {/* Status */}
                  {notification.status && (
                    <div className={`mt-2 text-sm ${
                      notification.status === 'accepted' 
                        ? 'text-green-500 dark:text-green-400' 
                        : 'text-red-500 dark:text-red-400'
                    }`}>
                      {notification.status === 'accepted' ? 'Accepted' : 'Declined'}
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