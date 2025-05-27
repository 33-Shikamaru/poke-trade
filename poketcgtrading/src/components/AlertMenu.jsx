import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoClose } from "react-icons/io5";
import { MdSwapHoriz, MdPeople, MdMessage, MdCheck, MdClose } from "react-icons/md";
import { doc, collection, query, orderBy, limit, onSnapshot, updateDoc, arrayUnion, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

// Create a custom event for notification updates
const NOTIFICATION_UPDATE_EVENT = 'notificationUpdate';

const AlertMenu = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !auth.currentUser) {
      setLoading(false);
      return;
    }

    // Set up real-time listener for notifications
    const notificationsRef = collection(db, 'users', auth.currentUser.uid, 'notifications');
    const q = query(
      notificationsRef,
      orderBy('timestamp', 'desc'),
      limit(3) // Only get the 3 most recent notifications
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
  }, [isOpen]);

  const handleAlertClick = () => {
    navigate('/notifications');
    onClose();
  };

  const handleAccept = async (notification) => {
    try {
      // Mark notification as read
      const notificationRef = doc(db, 'users', auth.currentUser.uid, 'notifications', notification.id);
      await updateDoc(notificationRef, {
        read: true,
        status: 'accepted'
      });

      // Handle different types of accept actions
      switch (notification.type) {
        case 'trade_request':
          navigate(`/trade/${notification.senderId}`);
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

          // Create a notification for the sender
          const senderNotificationsRef = collection(db, 'users', notification.senderId, 'notifications');
          const newNotificationRef = doc(senderNotificationsRef);
          await setDoc(newNotificationRef, {
            type: 'friend_request_accepted',
            senderId: auth.currentUser.uid,
            senderName: auth.currentUser.displayName || auth.currentUser.email,
            message: `${auth.currentUser.displayName || auth.currentUser.email} accepted your friend request`,
            timestamp: new Date(),
            read: false
          });
          break;
      }
    } catch (error) {
      console.error('Error accepting notification:', error);
      setError('Error accepting notification. Please try again.');
    }
  };

  const handleDecline = async (notification) => {
    try {
      // Mark notification as read and declined
      const notificationRef = doc(db, 'users', auth.currentUser.uid, 'notifications', notification.id);
      await updateDoc(notificationRef, {
        read: true,
        status: 'declined'
      });

      // Create a notification for the sender
      const senderNotificationsRef = collection(db, 'users', notification.senderId, 'notifications');
      const newNotificationRef = doc(senderNotificationsRef);
      await setDoc(newNotificationRef, {
        type: 'friend_request_declined',
        senderId: auth.currentUser.uid,
        senderName: auth.currentUser.displayName || auth.currentUser.email,
        message: `${auth.currentUser.displayName || auth.currentUser.email} declined your friend request`,
        timestamp: new Date(),
        read: false
      });
    } catch (error) {
      console.error('Error declining notification:', error);
      setError('Error declining notification. Please try again.');
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

  const getNotificationTitle = (type) => {
    switch (type) {
      case 'trade_request':
        return 'New Trade Request';
      case 'friend_request':
        return 'Friend Request';
      case 'friend_request_accepted':
        return 'Friend Request Accepted';
      case 'friend_request_declined':
        return 'Friend Request Declined';
      default:
        return 'Notification';
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

  const clearAllNotifications = async () => {
    if (!auth.currentUser) {
      setError('Please sign in to mark notifications as read');
      return;
    }

    try {
      setError(null);
      // Mark all displayed notifications as read
      const updatePromises = notifications.map(notification => 
        updateDoc(doc(db, 'users', auth.currentUser.uid, 'notifications', notification.id), {
          read: true
        })
      );
      
      await Promise.all(updatePromises);
      console.log('Notifications marked as read successfully');
      
      // Update local state to mark notifications as read
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({
          ...notification,
          read: true
        }))
      );

      // Dispatch event to update notification count
      const event = new CustomEvent(NOTIFICATION_UPDATE_EVENT);
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      setError('Error marking notifications as read. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-10 dark:bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Alert Menu */}
      <div className="fixed right-4 top-16 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center gap-2 dark:text-white">
            Notifications
          </h2>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button 
                onClick={clearAllNotifications}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                Read All ({notifications.length})
              </button>
            )}
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-white rounded-lg p-1 hover:bg-red-300 dark:text-gray-400"
            >
              <IoClose className="text-xl" />
            </button>
          </div>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              Loading notifications...
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500 dark:text-red-400">
              {error}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <p>No new notifications</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  !notification.read ? 'bg-blue-50 dark:bg-gray-800' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center gap-2">
                      <p className="font-medium dark:text-gray-200">
                        {getNotificationTitle(notification.type)}
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
                     notification.status === 'pending' && (
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
                    {notification.status && notification.status !== 'pending' && (
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
            ))
          )}
        </div>
        
        <div className="p-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <button 
            className="w-full text-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            onClick={handleAlertClick}
          >
            View All Notifications
          </button>
        </div>
      </div>
    </>
  );
};

export default AlertMenu; 