import { useState, useEffect, useRef } from "react"
import { IoChevronDown } from "react-icons/io5";

function Dropdown({ typeFilter }) {
  const [selectedFilter, setSelectedFilter] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const filterOptions = {
    platform: [
      { name: 'All', code: 'ALL' },
      { name: 'Trading Card Game', code: 'TCG' },
      { name: 'TCG Pocket', code: 'PCK' }
    ],
    sort: [
      { name: 'Newest', code: 'NEW' },
      { name: 'Oldest', code: 'OLD' },
      { name: 'Price: Low to High', code: 'PLH' },
      { name: 'Price: High to Low', code: 'PHL' },
      { name: 'Name: A to Z', code: 'NAZ' },
      { name: 'Name: Z to A', code: 'NZA' }
    ],
    filter: [
      { name: 'All', code: 'ALL' },
      { name: 'Sets', code: 'SET' },
      { name: 'Number', code: 'NUM' },
      { name: 'Rarity', code: 'RAR' }
    ]
  };

  const filters = filterOptions[typeFilter] || [];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (filter) => {
    setSelectedFilter(filter.code);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full sm:w-auto" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex flex-row justify-between items-center text-xs sm:text-sm w-full sm:w-48 px-2 sm:px-4 py-1.5 text-left bg-white border-2 border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
      >
        <span className="truncate">
          {filters.find(f => f.code === selectedFilter)?.name || filters[0]?.name || 'Select...'}
        </span>
        <IoChevronDown className={`ml-2 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'scale-y-[-1]' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-300 rounded-md shadow-lg dark:bg-gray-800 dark:border-gray-700 max-h-60 overflow-y-auto">
          {filters.map((filter) => (
            <div
              key={filter.code}
              onClick={() => handleSelect(filter)}
              className={`px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                selectedFilter === filter.code ? 'bg-blue-50 dark:bg-gray-700' : ''
              }`}
            >
              {filter.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export default Dropdown;