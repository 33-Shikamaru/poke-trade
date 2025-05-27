import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/landing/landing';
import Inventory from './pages/inventory/inventory';
import Friends from './pages/friends/friends';
import Trade from './pages/trade/trade';
import Wishlist from './pages/wishlist/wishlist';
import Search from './pages/search/search';
import Profile from './pages/profile/profile';
// import Signup from './pages/sign-in/signup';
import Navbar from './components/Navbar';
import Explore from './pages/explore/explore';
import Footer from './components/Footer';
import Set from './pages/explore/set';
import PocketSet from './pages/explore/pocketSet';
import Notifications from './pages/notifications/notifications';
import UserInventory from './pages/profile/UserInventory';
import UserWishlist from './pages/profile/UserWishlist';

/**
* This function allows one component to be rendered
* and mounted once. When navigating to other pages,
* the components (such as Navbar) will not refresh
* and the visual "refresh" will not be shown.
*
* @returns
* This function returns the page structure of the application.
*/
function AppLayout() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const hideNavbar = location.pathname === '/landing';

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      {!hideNavbar && <Navbar />}
      <main className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
        <Routes>
          <Route path="/landing" element={!user ? <Landing /> : <Navigate to="/explore" />} />
          <Route path="/explore" element={user ? <Explore /> : <Navigate to="/landing" />} />
          <Route path="/set/:setId" element={user ? <Set /> : <Navigate to="/landing" />} />
          <Route path="/pocket-set/:setId" element={user ? <PocketSet /> : <Navigate to="/landing" />} />
          <Route path="/friends" element={user ? <Friends /> : <Navigate to="/landing" />} />
          <Route path="/inventory" element={user ? <Inventory /> : <Navigate to="/landing" />} />
          <Route path="/trade" element={user ? <Trade /> : <Navigate to="/landing" />} />
          <Route path="/wishlist" element={user ? <Wishlist /> : <Navigate to="/landing" />} />
          <Route path="/search" element={user ? <Search /> : <Navigate to="/landing" />} />
          <Route path="/profile/:userId" element={user ? <Profile /> : <Navigate to="/landing" />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/landing" />} />
          <Route path="/notifications" element={user ? <Notifications /> : <Navigate to="/landing" />} />
          <Route path="/profile/:userId/inventory" element={user ? <UserInventory /> : <Navigate to="/landing" />} />
          <Route path="/profile/:userId/wishlist" element={user ? <UserWishlist /> : <Navigate to="/landing" />} />
          <Route path="/" element={<Navigate to="/landing" />} />
        </Routes>
      </main>
    </>
  );
}

/**
* This function initializes the dark mode preference.
* It checks for a saved dark mode preference in localStorage,
* and if none is found, it checks the system's preferred color scheme.
* It then toggles the 'dark' class on the document element based on the preference.
*/  
const initializeDarkMode = () => {
  const savedMode = localStorage.getItem('darkMode');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const shouldBeDark = savedMode ? JSON.parse(savedMode) : prefersDark;
  
  document.documentElement.classList.toggle('dark', shouldBeDark);
}

function App() {
  // Check for saved dark mode preference on initial load
  useEffect(() => {
    initializeDarkMode();
  }, []);

  return (
    <Router>
      <title>PokéTrade</title>
      <div className="App min-h-screen bg-white dark:bg-gray-900 dark:text-gray-200 transition-colors duration-200">
        <AppLayout />
        <Footer />
      </div>
    </Router>
  );
}

export default App;