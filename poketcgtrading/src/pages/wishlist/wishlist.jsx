import { Link, useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase';
import { useState, useEffect, useRef } from "react"
import { doc, setDoc, getFirestore } from 'firebase/firestore';
import Dropdown from '../../components/Dropdown';

function Wishlist() {
  const filters = [
    {
      code: "1",
      name: "Pikachu",
      number: "025",
      rarity: "Common",
      set: "Base Set",
      platform: "TCG",
      image: "https://example.com/pikachu.jpg"
    },
    {
      code: "2",
      name: "Charizard",
      number: "004",
      rarity: "Rare",
      set: "Base Set",
      platform: "TCG",
      image: "https://example.com/charizard.jpg"
    }
  ];
  return (
    <div className='min-h-screen'>
      <div className='w-full max-w-lg mx-5 my-5'>
        <h1 className='text-4xl font-bold pb-5'>Wish List</h1>
      </div>
      {/* Body Wish List Container */}
      <div className='w-full'>
        <div className='flex flex-row justify-center items-center pb-1 mx-5 gap-5 text-md'>
          <div className='flex flex-row justify-center items-center gap-2'>
            <p>Platform:</p>
            <Dropdown typeFilter="platform" />
          </div>
          <div className='flex flex-row justify-center items-center gap-2'>
            <p>Sort By:</p>
            <Dropdown typeFilter="sort" />
          </div>
          <div className='flex flex-row justify-center items-center gap-2'>
            <p>Filter By:</p>
            <Dropdown typeFilter="filter" />
          </div>
        </div>
        <div className='flex flex-col justify-center items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-2 mx-5'>
          <div className='flex flex-col gap-4'>
            {/* Cards Loaded from Firebase Wish List */}
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'>
              {filters.map((card) => (
                  <div 
                      key={card.code} 
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 dark:bg-gray-400"
                  >
                      <img 
                          src={card.image}
                          alt={card.name}
                          className="w-full h-auto object-contain bg-gray-100 p-2"
                      />
                      <div className='flex flex-col justify-between items-center'>
                        <div className="p-3">
                            <h3 className="font-semibold text-gray-800">{card.name}</h3>
                            <p className="text-sm text-gray-600">{card.set}</p>
                        </div>
                      </div>
                  </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Wishlist;