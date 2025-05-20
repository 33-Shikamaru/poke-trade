import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoClose } from "react-icons/io5";
import { MdSwapHoriz, MdPeople, MdCheck, MdClose } from "react-icons/md";
import { doc, collection, query, where, orderBy, limit, getDocs, updateDoc, deleteDoc, arrayUnion, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

const AlertMenu = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = async () => {
    if (!auth.currentUser) {
      console.log('No current user found');
      setError('Please sign in to view notifications');
      setLoading(false);
      return;
    }
    
    try {
      setError(null);
      console.log('Fetching notifications for user:', auth.currentUser.uid);
      const userNotificationsRef = collection(db, 'users', auth.currentUser.uid, 'notifications');
      
      // Get all notifications for the current user
      const querySnapshot = await getDocs(userNotificationsRef);
      console.log('Query snapshot size:', querySnapshot.size);
      console.log('Raw query snapshot:', querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      
      if (querySnapshot.empty) {
        console.log('No notifications found');
        setNotifications([]);
        return;
      }
      
      const fetchedNotifications = querySnapshot.docs
        .map(doc => {
          const data = doc.data();
          console.log('Raw notification data:', data);
          return {
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp)
          };
        })
        .filter(notification => {
          // Filter out status update notifications
          const shouldKeep = !notification.type?.includes('_accepted') && !notification.type?.includes('_declined');
          console.log('Filtering notification:', notification.type, 'shouldKeep:', shouldKeep);
          return shouldKeep;
        })
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5);
      
      console.log('Final processed notifications:', fetchedNotifications);
      setNotifications(fetchedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Error loading notifications. Please try again.');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      console.log('AlertMenu opened, fetching notifications...');
      fetchNotifications();
    }
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
          // Navigate to trade page with the trade ID
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
          
          // Create a new notification for the sender
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

      // Remove the notification from the list
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    } catch (error) {
      console.error('Error accepting notification:', error);
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

      // Handle different types of decline actions
      switch (notification.type) {
        case 'friend_request':
          // Create a new notification for the sender
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
          break;
      }

      // Remove the notification from the list
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    } catch (error) {
      console.error('Error declining notification:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'trade_request':
        return <MdSwapHoriz className="text-blue-500 dark:text-blue-400 text-xl" />;
      case 'friend_request':
      case 'friend_request_accepted':
      case 'friend_request_declined':
        return <MdPeople className="text-green-500 dark:text-green-400 text-xl" />;
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
      setError('Please sign in to clear notifications');
      return;
    }

    try {
      setError(null);
      const userNotificationsRef = collection(db, 'users', auth.currentUser.uid, 'notifications');
      const querySnapshot = await getDocs(userNotificationsRef);
      
      // Delete each notification
      const deletePromises = querySnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      
      await Promise.all(deletePromises);
      console.log('All notifications cleared successfully');
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing notifications:', error);
      setError('Error clearing notifications. Please try again.');
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
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
              >
                Clear All ({notifications.length})
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
            notifications.map((notification) => {
              console.log('Rendering notification:', notification);
              return (
                <div
                  key={notification.id}
                  className="p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
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
                        {notification.message || 'No message available'}
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
              );
            })
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