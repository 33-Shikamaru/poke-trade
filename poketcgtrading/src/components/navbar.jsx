import React from 'react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { TbBellRinging } from "react-icons/tb";
import { FaRegUserCircle } from "react-icons/fa";
import TCGLogo from "../assets/tcgLogo.png";
import { RxHamburgerMenu } from "react-icons/rx";
import { RxCross2 } from "react-icons/rx";

const Navbar = () => {
  const navigate = useNavigate();
  
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  
  // This reduces the repetitive tailwindcss styling for each link
  const navClass = (path) => {
    return isActive(path)
          ? 'flex items-center justify-center rounded p-1 hover:bg-gray-200 text-blue-400'
          : 'flex items-center justify-center rounded p-1 hover:bg-gray-200';
  }
  const [isOpen, setIsOpen] = useState(false);
  
  const handleSignOut = () => {
    // TODO: Need to handle signing out authentication here before navigating to sign out page
    navigate('/');
  }
  
  return (
    <nav className='relative flex items-center justify-between border-b border-gray-400 px-4 py-2'>
      {/* Logo */}
      <img className='flex items-center' src={TCGLogo} width={80} alt='Poke Trader Logo' />

      {/* Desktop Navigation */}
      <div className='hidden md:flex absolute left-1/2 transform -translate-x-1/2 space-x-6 text-center'>
        <Link to='/explore' className={navClass('/explore')}>Explore</Link>
        <Link to='/inventory' className={navClass('/inventory')}>Inventory</Link>
        <Link to='/wishlist' className={navClass('/wishlist')}>Wish List</Link>
        <Link to='/friends' className={navClass('/friends')}>Friends</Link>
        <Link to='/trades' className={navClass('/trades')}>Trade</Link>
      </div>

      {/* Burger Icon (mobile only) */}
      <div className='md:hidden'>
        <button onClick={() => setIsOpen(!isOpen)} className='text-2xl'>
          {isOpen ? <RxCross2 /> : <RxHamburgerMenu />}
        </button>
      </div>

      {/* Desktop Right Side Buttons */}
      <div className='hidden md:flex gap-2'>
        <button className='items-center rounded hover:bg-gray-200 text-2xl p-2'><TbBellRinging /></button>
        <button className='items-center rounded hover:bg-gray-200 text-2xl p-2'><FaRegUserCircle /></button>
        <Link className='flex items-center justify-center rounded-xl bg-black text-white p-0.5 px-3 hover:bg-gray-500 text-sm'>Sign Out</Link>
      </div>

      {/* Mobile Dropdown Menu */}
      
      <div
        className={`absolute top-full left-0 w-full flex flex-col items-center bg-gray-200 py-4 space-y-3 border-t border-gray-200 md:hidden z-10 transform transition-transform duration-300 ease-in-out origin-top ${
          isOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0 pointer-events-none'
        }`}
      >
          <Link to='/explore' className={navClass('/explore')}>Explore</Link>
          <Link to='/inventory' className={navClass('/inventory')}>Inventory</Link>
          <Link to='/wishlist' className={navClass('/wishlist')}>Wish List</Link>
          <Link to='/friends' className={navClass('/friends')}>Friends</Link>
          <Link to='/trade' className={navClass('/trade')}>Trade</Link>
          <hr className="border-t border-gray-400 w-1/4" />
          <Link to='/alerts' className={navClass('/alerts')}>Alerts</Link>
          <Link to='/profile' className={navClass('/profile')}>Profile</Link>
          <button onClick={handleSignOut} className='flex justify-content align-items text-center rounded-xl bg-black text-white p-1 px-3 hover:bg-gray-500 text-sm'>Sign Out</button>
        </div>

    </nav>
)};

export default Navbar;
