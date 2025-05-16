import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import Notifications from '../Notifications/Notifications';

function Navbar() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-gray-800 dark:text-white">
              PokeTCG Trading
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/inventory" className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white">
                  Inventory
                </Link>
                <Link to="/wishlist" className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white">
                  Wishlist
                </Link>
                <Link to="/friends" className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white">
                  Friends
                </Link>
                <Notifications />
                <Link to="/profile" className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white">
                  Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/sign-in" className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white">
                  Sign In
                </Link>
                <Link to="/sign-up" className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar; 