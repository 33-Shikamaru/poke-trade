import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/sign-in/landing';
// import Inventory from './pages/inventory/inventory'
// import Signup from './pages/sign-in/signup';
import Navbar from './components/navbar';
import Explore from './pages/explore/explore';
import Footer from './components/Footer';
/**
* This function allows one component to be rendered
* and mounted once. When navigating to other pages,
* the components (such as Navbar) will not refresh
* and the visual "refresh" will not be shown.
*
* @returns
* This funciton returns the page structure of the application.
*/
function AppLayout() {
 // Retrieves object details such as pathname, state, key.
 const location = useLocation();
 // A Boolean value that checks what page we are on
 const hideNavbar = location.pathname === '/';


 return (
   <>
     {!hideNavbar && <Navbar />}
     <Routes>
       <Route path="/" element={<Landing />} />
       <Route path="/explore" element={<Explore />} />
       {/* <Route path="/inventory" element={<Inventory />} /> */}
     </Routes>
   </>
 );
}


function App() {
  return (
    <Router>
      <div className="App">
        <AppLayout />
        <Footer />
      </div>
    </Router>
  );
}



export default App;