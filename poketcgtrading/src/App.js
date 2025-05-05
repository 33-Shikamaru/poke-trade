import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/sign-in/landing';
// import Inventory from './pages/inventory/inventory'
// import Signup from './pages/sign-in/signup';
import Navbar from './components/navbar';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/inventory" element={<Navbar />} />

        {/* <Route path="/signup" element={<div>Sign Up Page</div>} /> */}
      </Routes>
    </Router>
  );
}

export default App; 