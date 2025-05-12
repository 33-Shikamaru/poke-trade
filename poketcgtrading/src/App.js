import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/landing/landing';
import Inventory from './pages/inventory/inventory';
import Friends from './pages/friends/friends';
import Trade from './pages/trade/trade';
import Wishlist from './pages/wishlist/wishlist';
// import Signup from './pages/sign-in/signup';
import Navbar from './components/Navbar';
import Explore from './pages/explore/explore';
import Footer from './components/Footer';
import Set from './pages/explore/set';

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
 // Retrieves object details such as pathname, state, key.
 const location = useLocation();
 // A Boolean value that checks what page we are on
 const hideNavbar = location.pathname === '/';


 return (
   <>
     {!hideNavbar && <Navbar />}
     <main className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
       <Routes>
         <Route path="/" element={<Landing />} />
         <Route path="/explore" element={<Explore />} />
         <Route path="/set/:setId" element={<Set />} />
         <Route path="/friends" element={<Friends />}/>
         <Route path="/inventory" element={<Inventory />} />
         <Route path="/trade" element={<Trade />} />
         <Route path="/wishlist" element={<Wishlist />} />
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
      <div className="App min-h-screen bg-white dark:bg-gray-900 dark:text-gray-200 transition-colors duration-200">
        <AppLayout />
        <Footer />
      </div>
    </Router>
  );
}

export default App;