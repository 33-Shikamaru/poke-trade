import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { MdNotifications, MdPersonAdd, MdCheck, MdClose, MdSwapHoriz, MdInfo } from 'react-icons/md';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationTypes, setNotificationTypes] = useState({
    friendRequests: 0,
    tradeOffers: 0
  });

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Listen for notifications
    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications = [];
      let friendRequests = 0;
      let tradeOffers = 0;

      snapshot.forEach((doc) => {
        const notification = { id: doc.id, ...doc.data() };
        newNotifications.push(notification);
        
        if (!notification.read) {
          if (notification.type === 'friend_request') {
            friendRequests++;
          } else if (notification.type === 'trade_offer') {
            tradeOffers++;
          }
        }
      });
      
      // Sort notifications by timestamp
      newNotifications.sort((a, b) => b.timestamp - a.timestamp);
      setNotifications(newNotifications);
      
      // Update counts
      setUnreadCount(friendRequests + tradeOffers);
      setNotificationTypes({
        friendRequests,
        tradeOffers
      });
    });

    return () => unsubscribe();
  }, []);

  const handleAcceptFriend = async (notification) => {
    try {
      const currentUserRef = doc(db, 'users', auth.currentUser.uid);
      const senderRef = doc(db, 'users', notification.senderId);

      // Add to both users' friends lists
      await updateDoc(currentUserRef, {
        friends: arrayUnion(notification.senderId)
      });
      await updateDoc(senderRef, {
        friends: arrayUnion(auth.currentUser.uid)
      });

      // Delete the notification
      await deleteDoc(doc(db, 'notifications', notification.id));
    } catch (error) {
      console.error('Error accepting friend request:', error);
      alert('Failed to accept friend request. Please try again.');
    }
  };

  const handleRejectFriend = async (notification) => {
    try {
      await deleteDoc(doc(db, 'notifications', notification.id));
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      alert('Failed to reject friend request. Please try again.');
    }
  };

  const handleTradeOffer = async (notification, action) => {
    try {
      if (action === 'accept') {
        // Handle trade acceptance logic here
        // This would involve updating both users' inventories
      }
      // Delete the notification regardless of action
      await deleteDoc(doc(db, 'notifications', notification.id));
    } catch (error) {
      console.error('Error handling trade offer:', error);
      alert('Failed to process trade offer. Please try again.');
    }
  };

  const markAsRead = async (notification) => {
    if (!notification.read) {
      try {
        await updateDoc(doc(db, 'notifications', notification.id), {
          read: true
        });
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'friend_request':
        return <MdPersonAdd className="text-blue-500" />;
      case 'trade_offer':
        return <MdSwapHoriz className="text-green-500" />;
      default:
        return <MdInfo className="text-gray-500" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
      >
        <MdNotifications className="text-2xl" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1">
            <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount}
            </span>
            {notificationTypes.friendRequests > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-3 w-3"></span>
            )}
            {notificationTypes.tradeOffers > 0 && (
              <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-3 w-3"></span>
            )}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-200 dark:border-gray-700 ${
                    !notification.read ? 'bg-blue-50 dark:bg-gray-700' : ''
                  }`}
                  onClick={() => markAsRead(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-grow">
                      {notification.type === 'friend_request' && (
                        <>
                          <p className="text-gray-900 dark:text-white">
                            <span className="font-semibold">{notification.senderName}</span> sent you a friend request
                          </p>
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAcceptFriend(notification);
                              }}
                              className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                            >
                              <MdCheck /> Accept
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRejectFriend(notification);
                              }}
                              className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                              <MdClose /> Reject
                            </button>
                          </div>
                        </>
                      )}
                      {notification.type === 'trade_offer' && (
                        <>
                          <p className="text-gray-900 dark:text-white">
                            <span className="font-semibold">{notification.senderName}</span> wants to trade with you
                          </p>
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTradeOffer(notification, 'accept');
                              }}
                              className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                            >
                              <MdCheck /> Accept
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTradeOffer(notification, 'reject');
                              }}
                              className="flex items-center gap-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                              <MdClose /> Reject
                            </button>
                          </div>
                        </>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(notification.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Notifications; 