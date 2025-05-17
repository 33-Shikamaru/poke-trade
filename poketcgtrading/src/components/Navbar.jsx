import React from 'react';
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { TbBellRinging } from "react-icons/tb";
import { FaRegUserCircle } from "react-icons/fa";
import TCGLogo from "../assets/tcgLogo.png";
import { RxHamburgerMenu } from "react-icons/rx";
import { RxCross2 } from "react-icons/rx";
import AlertMenu from './AlertMenu';
import UserMenu from './UserMenu';
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

function Navbar() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  
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
    if (!user) return;

    // Query for unread notifications in the user's notifications subcollection
    const userNotificationsRef = collection(db, 'users', user.uid, 'notifications');
    const q = query(
      userNotificationsRef,
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const count = snapshot.docs.filter(doc => {
        const data = doc.data();
        // Only count notifications that are not status updates
        return !data.type?.includes('_accepted') && !data.type?.includes('_declined');
      }).length;
      console.log('Unread notifications count:', count);
      setUnreadCount(count);
    });

    return () => unsubscribe();
  }, [user]);
  
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
        <img className='flex items-center' src={TCGLogo} width={80} alt='Poke Trader Logo' onClick={() => navigate('/explore')}/>

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
              <img src={user?.photoURL || 'https://api.dicebear.com/6.x/initials/svg?seed=' + user?.email} alt="User profile" className="w-8 h-8 rounded-full" />
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
      />
    </>
  );
}

export default Navbar;
