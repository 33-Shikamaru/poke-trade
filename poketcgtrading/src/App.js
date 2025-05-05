import React from 'react';
import Footer from './Footer';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/sign-in/landing';
// import Signup from './pages/sign-in/signup';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        {/* <Route path="/signup" element={<div>Sign Up Page</div>} /> */}
      </Routes>
      <Footer />
    </Router>
  );
}

export default App; 