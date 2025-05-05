import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TbBellRinging } from "react-icons/tb";
import { FaRegUserCircle } from "react-icons/fa";
import TCGLogo from "../assets/tcgLogo.png";


const Navbar = () => {
  const navigate = useNavigate();
  return (
    <nav className='relative flex items-center justify-between border-b border-gray-400 px-4'>
      <img className='flex items-center' src={TCGLogo} width={80}/>

      <div className='absolute left-1/2 transform -translate-x-1/2 flex space-x-6'>
      {/* <div className='justify-center flex row gap-3'> */}
          <button className='rounded p-1 hover:bg-gray-200' onClick={() => navigate('/inventory')}>Inventory</button>
          <button className='rounded p-1 hover:bg-gray-200' onClick={() => navigate('/wishlist')}>Wish List</button>
          <button className='rounded p-1 hover:bg-gray-200' onClick={() => navigate('/friends')}>Friends</button>
          <button className='rounded p-1 hover:bg-gray-200' onClick={() => navigate('/trade')}>Trade</button>
          <button className='rounded p-1 hover:bg-gray-200' onClick={() => navigate('/explore')}>Explore</button>
      </div>

      <div className='flex gap-2'>
          {/* Alert Button */}
          <button className='items-center rounded hover:bg-gray-200 text-2xl p-2'><TbBellRinging /></button>

          {/* Profile Button */}
          <button className='items-center rounded hover:bg-gray-200 text-2xl p-2'><FaRegUserCircle /></button>

          {/* Sign Out Button */}
          <button className='rounded-xl bg-black text-white p-0.5 px-3 hover:bg-gray-500 text-sm'
            onClick={() => navigate('/')}
          >Sign Out</button>
      </div>
    </nav>
)};

export default Navbar;
