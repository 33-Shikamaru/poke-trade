import React from 'react';
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { TbBellRinging } from "react-icons/tb";
import { FaRegUserCircle } from "react-icons/fa";
import Logo from "../assets/PoketradeLogo.png";
import { RxHamburgerMenu } from "react-icons/rx";
import { RxCross2 } from "react-icons/rx";
import AlertMenu from './AlertMenu';
import UserMenu from './UserMenu';
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import Gengar from '../assets/gengar.png';
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

const NOTIFICATION_UPDATE_EVENT = 'notificationUpdate';

function Navbar() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [userData, setUserData] = useState(null);
  
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  
  // This reduces the repetitive tailwindcss styling for each link
  const navClass = (path) => {
    return isActive(path)
          ? 'flex items-center justify-center rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-700 text-blue-400 dark:text-blue-300'
          : 'flex items-center justify-center rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-200';
  }
  const [isOpen, setIsOpen] = useState(false);
  const [isAlertMenuOpen, setIsAlertMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Query for unread notifications in the user's notifications subcollection
    const userNotificationsRef = collection(db, 'users', user.uid, 'notifications');
    const q = query(
      userNotificationsRef,
      where('read', '==', false)
    );

    let isFirstLoad = true;
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (isFirstLoad) {
        console.log('Initial notifications load, total docs:', snapshot.docs.length);
        isFirstLoad = false;
      }
      
      const count = snapshot.docs.filter(doc => {
        const data = doc.data();
        // Only count unread notifications that are not status updates
        return !data.read && 
               data.type !== 'friend_request_accepted' && 
               data.type !== 'friend_request_declined';
      }).length;
      
      if (count !== unreadCount) {
        console.log('Unread count updated:', count);
        setUnreadCount(count);
      }
    }, (error) => {
      console.error('Error in notifications listener:', error);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  // Add listener for user data changes
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        setUserData(doc.data());
      }
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Set up real-time listener for unread notifications
    const notificationsRef = collection(db, 'users', auth.currentUser.uid, 'notifications');
    const q = query(
      notificationsRef,
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setUnreadCount(querySnapshot.size);
    });

    // Listen for notification update events
    const handleNotificationUpdate = () => {
      // Force a refresh of the unread count
      getDocs(q).then(snapshot => {
        setUnreadCount(snapshot.size);
      });
    };

    window.addEventListener(NOTIFICATION_UPDATE_EVENT, handleNotificationUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener(NOTIFICATION_UPDATE_EVENT, handleNotificationUpdate);
    };
  }, []);

  const renderAvatar = () => {
    if (!userData?.photoURL) return Gengar;
    
    if (userData.photoURL.startsWith('avatar:')) {
      const avatarName = userData.photoURL.split(':')[1];
      const avatar = avatarOptions.find(opt => opt.name === avatarName);
      return avatar ? avatar.image : Gengar;
    }
    
    return userData.photoURL;
  };
  
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  const displayAlertMenu = () => {
    setIsAlertMenuOpen(true);
  }

  const displayUserMenu = () => {
    setIsUserMenuOpen(true);
  }
  
  return (
    <>
      <nav className='relative flex items-center justify-between border-b border-gray-400 dark:border-gray-700 px-4 py-2 bg-white dark:bg-gray-800 transition-colors duration-200'>
        {/* Logo */}
        <img className='flex items-center hover:bg-gray-200 rounded dark:hover:bg-gray-700 hover:cursor-pointer' src={Logo} width={80} alt='Poke Trader Logo' onClick={() => navigate('/explore')}/>

        {/* Desktop Navigation */}
        <div className='hidden md:flex absolute left-1/2 transform -translate-x-1/2 space-x-6 text-center'>
          <Link to='/explore' className={navClass('/explore')}>Explore</Link>
          <Link to='/inventory' className={navClass('/inventory')}>Inventory</Link>
          <Link to='/wishlist' className={navClass('/wishlist')}>Wish List</Link>
          <Link to='/search' className={navClass('/search')}>Search</Link>
          <Link to='/friends' className={navClass('/friends')}>Friends</Link>
          <Link to='/trade' className={navClass('/trade')}>Trade</Link>
        </div>

        {/* Burger Icon (mobile only) */}
        <div className='md:hidden'>
          <button onClick={() => setIsOpen(!isOpen)} className='text-2xl text-gray-800 dark:text-gray-200'>
            {isOpen ? <RxCross2 /> : <RxHamburgerMenu />}
          </button>
        </div>

        {/* Desktop Right Side Buttons */}
        <div className='hidden md:flex gap-2'>
          <button 
            className={`items-center rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-2xl p-2 text-gray-800 dark:text-gray-200 relative ${isActive('/notifications') ? 'text-blue-400 dark:text-blue-300' : ''}`}
            onClick={displayAlertMenu}>
              <TbBellRinging />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
          </button>
          <button 
            className={`items-center rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-2xl p-2 text-gray-800 dark:text-gray-200 ${isActive('/profile') ? 'text-blue-400 dark:text-blue-300' : ''}`}
            onClick={displayUserMenu}>
              <img src={renderAvatar()} alt="User profile" className="w-8 h-8 rounded-full object-cover" />
          </button>
          <Link 
          onClick={handleSignOut}
          className='flex items-center justify-center rounded-xl bg-black dark:bg-gray-700 text-white p-0.5 px-3 hover:bg-gray-500 dark:hover:bg-gray-600 text-sm transition-colors duration-200'>Sign Out</Link>
        </div>

        {/* Mobile Dropdown Menu */}
        <div
          className={`absolute top-full left-0 w-full flex flex-col items-center bg-gray-200 dark:bg-gray-800 py-4 space-y-3 border-t border-gray-200 dark:border-gray-700 md:hidden z-10 transform transition-transform duration-300 ease-in-out origin-top ${
            isOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0 pointer-events-none'
          }`}
        >
          <Link to='/explore' className={navClass('/explore')} onClick={() => setIsOpen(false)}>Explore</Link>
          <Link to='/inventory' className={navClass('/inventory')} onClick={() => setIsOpen(false)}>Inventory</Link>
          <Link to='/wishlist' className={navClass('/wishlist')} onClick={() => setIsOpen(false)}>Wish List</Link>
          <Link to='/search' className={navClass('/search')} onClick={() => setIsOpen(false)}>Search</Link>
          <Link to='/friends' className={navClass('/friends')} onClick={() => setIsOpen(false)}>Friends</Link>
          <Link to='/trade' className={navClass('/trade')} onClick={() => setIsOpen(false)}>Trade</Link>
          <hr className="border-t border-gray-400 dark:border-gray-600 w-1/4" />
          <Link to='/notifications' className={navClass('/notifications')} onClick={() => setIsOpen(false)}>
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Link>
          <Link to='/profile' className={navClass('/profile')} onClick={() => setIsOpen(false)}>Profile</Link>
          <button onClick={handleSignOut} className='flex justify-content align-items text-center rounded-xl bg-black dark:bg-gray-700 text-white p-1 px-3 hover:bg-gray-500 dark:hover:bg-gray-600 text-sm transition-colors duration-200'>Sign Out</button>
        </div>
      </nav>

      {/* Alert Menu Overlay */}
      <AlertMenu 
        isOpen={isAlertMenuOpen} 
        onClose={() => setIsAlertMenuOpen(false)} 
      />

      {/* User Menu Overlay */}
      <UserMenu 
        isOpen={isUserMenuOpen} 
        onClose={() => setIsUserMenuOpen(false)}
        userData={userData}
        setUserData={setUserData}
      />
    </>
  );
}

export default Navbar;
