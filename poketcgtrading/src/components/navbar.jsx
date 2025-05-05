import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TbBellRinging } from "react-icons/tb";
import { FaRegUserCircle } from "react-icons/fa";
import TCGLogo from "../assets/tcgLogo.png";

const Navbar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  
  // This reduces the repetitive tailwindcss styling for each link
  const navClass = (path) => {
    return isActive(path)
          ? 'rounded p-1 hover:bg-gray-200 text-blue-400'
          : 'rounded p-1 hover:bg-gray-200';
  }
  
  return (
    <nav className='relative flex items-center justify-between border-b border-gray-400 px-4'>
      <img className='flex items-center' src={TCGLogo} width={80} alt={'Poke Trader Logo'} />

      <div className='absolute left-1/2 transform -translate-x-1/2 flex space-x-6'>
      {/* <div className='justify-center flex row gap-3'> */}
        <Link to='/inventory' className={navClass('/inventory')}>Inventory</Link>
        <Link to='/wishlist' className={navClass('/wishlist')}>Wish List</Link>
        <Link to='/friends' className={navClass('/friends')}>Friends</Link>
        <Link to='/trade' className={navClass('/trade')}>Trade</Link>
        <Link to='/explore' className={navClass('/explore')}>Explore</Link>

      </div>

      <div className='flex gap-2'>
        {/* Alert Button */}
        <button className='items-center rounded hover:bg-gray-200 text-2xl p-2'><TbBellRinging /></button>

        {/* Profile Button */}
        <button className='items-center rounded hover:bg-gray-200 text-2xl p-2'><FaRegUserCircle /></button>

        {/* Sign Out Button */}
        <Link className='flex items-center justify-center rounded-xl bg-black text-white p-0.5 px-3 hover:bg-gray-500 text-sm'>Sign Out</Link>
      </div>
    </nav>
)};

export default Navbar;
