import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../firebase";
import { doc, getDoc, updateDoc, arrayUnion, setDoc } from "firebase/firestore";
import { FaSearch, FaChevronDown } from "react-icons/fa";
import { MdCollections, MdStar } from "react-icons/md";

// Import set images
import celestialGuardians from '../../assets/pocketSets/celestial-guardians.png';
import shiningRevelry from '../../assets/pocketSets/shining-revelry.png';
import triumphantLight from '../../assets/pocketSets/triumphant-light.png';
import spaceTimeSmackdown from '../../assets/pocketSets/space-timesmackdown.png';
import mythicalIsland from '../../assets/pocketSets/mythical-island.png';
import geneticApex from '../../assets/pocketSets/genetic-apex.png';
import promo from '../../assets/pocketSets/promo.png';

function Explore() {
  const navigate = useNavigate();
  const [sets, setSets] = useState([]);
  const [cards, setCards] = useState([]);
  const [filteredSets, setFilteredSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tempSearchQuery, setTempSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("all");
  const [isSearchTypeOpen, setIsSearchTypeOpen] = useState(false);
  const [quantities, setQuantities] = useState({});
  const [isDigital, setIsDigital] = useState(() => {
    // Initialize from localStorage, default to false if not set
    const savedState = localStorage.getItem('isDigital');
    return savedState ? JSON.parse(savedState) : false;
  });
  const [selectedSet, setSelectedSet] = useState(null);
  const searchTypeRef = useRef(null);

  // Add click outside handler
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchTypeRef.current && !searchTypeRef.current.contains(event.target)) {
        setIsSearchTypeOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Define the valid pocket sets with their corresponding images
  const pocketSets = [
    { name: 'Genetic Apex', image: geneticApex },
    { name: 'Mythical Island', image: mythicalIsland },
    { name: 'Space-Time Smackdown', image: spaceTimeSmackdown },
    { name: 'Triumphant Light', image: triumphantLight },
    { name: 'Shining Revelry', image: shiningRevelry },
    { name: 'Celestial Guardians', image: celestialGuardians },
    { name: 'Promo V1', image: promo },
    { name: 'Promo V2', image: promo }
  ];

  // Function to get display name for a set
  const getDisplayName = (setName) => {
    // If the name starts with "Shared(", extract the name inside parentheses
    if (setName.startsWith('Shared(')) {
      return setName.match(/Shared\((.*?)\)/)[1];
    }
    return setName;
  };

  // Function to get the original set name for matching
  const getOriginalSetName = (displayName) => {
    // Check if this display name corresponds to a Shared set
    const sharedSet = pocketSets.find(set => 
      set.name === displayName && 
      !set.name.startsWith('Shared(')
    );
    if (sharedSet) {
      return `Shared(${displayName})`;
    }
    return displayName;
  };

  // Function to update quantity
  const updateQuantity = (cardId, change) => {
    setQuantities(prev => ({
      ...prev,
      [cardId]: Math.max(0, (prev[cardId] || 0) + change)
    }));
  };

  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(tempSearchQuery);
  };

  // Initial fetch of all sets
  useEffect(() => {
    const fetchSets = async () => {
      try {
        setLoading(true);
        if (isDigital) {
          // Fetch digital sets from Pocket JSON
          const response = await fetch('https://raw.githubusercontent.com/chase-manning/pokemon-tcg-pocket-cards/refs/heads/main/v4.json');
          if (!response.ok) {
            throw new Error(`Failed to fetch digital sets: ${response.status} ${response.statusText}`);
          }
          const data = await response.json();
          // Transform the data to group cards by pack
          const packGroups = {};
          
          // Check if data is an array of cards
          if (Array.isArray(data)) {
            data.forEach(card => {
              // Get the display name for the pack
              const displayName = getDisplayName(card.pack);
              // Get the original set name for matching
              const originalSetName = getOriginalSetName(displayName);
              
              // Only include cards from valid pocket sets
              if (pocketSets.some(pocketSet => 
                pocketSet.name === displayName || 
                `Shared(${pocketSet.name})` === card.pack
              )) {
                if (!packGroups[displayName]) {
                  packGroups[displayName] = {
                    cards: [],
                    name: displayName
                  };
                }
                packGroups[displayName].cards.push(card);
              }
            });
          } else {
            console.error("Unexpected data structure:", data);
            throw new Error("Invalid data format from Pocket JSON");
          }

          // Create sets only for the predefined pocket sets
          const transformedSets = pocketSets.map(pocketSet => {
            const packData = packGroups[pocketSet.name] || { cards: [] };
            return {
              id: pocketSet.name.toLowerCase().replace(/\s+/g, '-'),
              name: pocketSet.name,
              series: "Pokemon TCG Pocket",
              images: {
                logo: pocketSet.image
              },
              printedTotal: packData.cards.length,
              cards: packData.cards
            };
          });
          setSets(transformedSets);
          setFilteredSets(transformedSets);
        } else {
          // Fetch physical sets from Pokemon TCG API
          const response = await fetch("https://api.pokemontcg.io/v2/sets", {
            headers: {
              "X-Api-Key": process.env.REACT_APP_POKEMON_TCG_API_KEY,
            },
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error("API Error Response:", errorData);
            throw new Error(`Failed to fetch sets: ${response.status} ${response.statusText}`);
          }

          const data = await response.json();
          console.log("Sets data received:", data);
          
          if (!data.data) {
            throw new Error("Invalid response format from API");
          }

          setSets(data.data);
          setFilteredSets(data.data);
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching sets:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchSets();
  }, [isDigital]); // Add isDigital as a dependency

  // Fetch cards when searching by card name
  useEffect(() => {
    const fetchCards = async () => {
      if (searchType === "card" && searchQuery) {
        setLoading(true);
        try {
          console.log("Fetching cards with query:", searchQuery);
          const response = await fetch(
            `https://api.pokemontcg.io/v2/cards?q=name:"*${searchQuery}*"`,
            {
              headers: {
                "X-Api-Key": process.env.REACT_APP_POKEMON_TCG_API_KEY,
              },
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            console.error("API Error Response:", errorData);
            throw new Error(`Failed to fetch cards: ${response.status} ${response.statusText}`);
          }

          const data = await response.json();
          console.log("Cards data received:", data);
          
          if (!data.data) {
            throw new Error("Invalid response format from API");
          }

          const filteredCards = data.data.filter(card => 
            card.name.toLowerCase().includes(searchQuery.toLowerCase())
          );

          setCards(filteredCards);
          setLoading(false);
        } catch (err) {
          console.error("Error fetching cards:", err);
          setError(err.message);
          setLoading(false);
        }
      } else {
        setCards([]);
      }
    };

    fetchCards();
  }, [searchQuery, searchType]);

  // Fetch sets when searching by set name
  useEffect(() => {
    const fetchSetsBySearch = async () => {
      if (searchType === "set" && searchQuery) {
        setLoading(true);
        try {
          // Filter sets that contain the search query anywhere in their name
          const query = searchQuery.toLowerCase();
          const filtered = sets.filter(set => 
            set.name.toLowerCase().includes(query)
          );
          
          setFilteredSets(filtered);
          setLoading(false);
        } catch (err) {
          console.error("Error filtering sets:", err);
          setError(err.message);
          setLoading(false);
        }
      } else if (searchType === "all") {
        // Filter all sets based on search query
        const query = searchQuery.toLowerCase();
        const filtered = sets.filter(set => 
          set.name.toLowerCase().includes(query) || 
          set.series.toLowerCase().includes(query)
        );
        setFilteredSets(filtered);
      } else {
        setFilteredSets(sets);
      }
    };

    fetchSetsBySearch();
  }, [searchQuery, searchType, sets]);

  // Function to handle adding cards to inventory
  const handleAddToInventory = async (card) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }

      const quantity = quantities[card.id] || 0;
      if (quantity === 0) {
        alert('Please select a quantity greater than 0');
        return;
      }

      const userRef = doc(db, "users", user.uid);

      // Get current data
      const userSnap = await getDoc(userRef);
      const currentData = userSnap.exists() ? userSnap.data() : {};
      const existingInventory = currentData.inventory || [];

      // Create maps for fast lookup
      const inventoryMap = new Map();

      // Add existing cards to maps
      existingInventory.forEach(card => {
        inventoryMap.set(card.cardId, { ...card });
      });

      // Create new card data based on whether it's a digital or physical card
      const cardData = isDigital ? {
        cardId: card.id,
        name: card.name,
        image: card.image,
        quantity: quantity,
        setId: card.pack,
        setName: getDisplayName(card.pack)
      } : {
        cardId: card.id,
        name: card.name,
        image: card.images.small,
        quantity: quantity,
        setId: card.set.id,
        setName: card.set.name
      };

      // Add or update card in inventory
      inventoryMap.set(card.id, cardData);

      // Convert map back to array
      const mergedInventory = Array.from(inventoryMap.values());

      // Save to Firestore
      await setDoc(userRef, {
        inventory: mergedInventory
      }, { merge: true });

      alert('Cards added to inventory!');
      setQuantities(prev => ({ ...prev, [card.id]: 0 })); // Reset quantity after adding
    } catch (error) {
      console.error("Error adding card to inventory:", error);
      alert('Failed to add card to inventory. Please try again.');
    }
  };

  // Function to handle adding cards to wishlist
  const handleAddToWishlist = async (card) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }

      const quantity = quantities[card.id] || 0;
      if (quantity === 0) {
        alert('Please select a quantity greater than 0');
        return;
      }

      const userRef = doc(db, "users", user.uid);

      // Get current data
      const userSnap = await getDoc(userRef);
      const currentData = userSnap.exists() ? userSnap.data() : {};
      const existingWishlist = currentData.wishList?.cards || [];

      // Create maps for fast lookup
      const wishlistMap = new Map();

      // Add existing cards to maps
      existingWishlist.forEach(card => {
        wishlistMap.set(card.cardId, { ...card });
      });

      // Create new card data based on whether it's a digital or physical card
      const cardData = isDigital ? {
        cardId: card.id,
        name: card.name,
        image: card.image,
        quantity: quantity,
        setId: card.pack,
        setName: getDisplayName(card.pack)
      } : {
        cardId: card.id,
        name: card.name,
        image: card.images.small,
        quantity: quantity,
        setId: card.set.id,
        setName: card.set.name
      };

      // Add or update card in wishlist
      wishlistMap.set(card.id, cardData);

      // Convert map back to array
      const mergedWishlist = Array.from(wishlistMap.values());

      // Save to Firestore
      await setDoc(userRef, {
        wishList: {
          cards: mergedWishlist,
          favorites: currentData.wishList?.favorites || []
        }
      }, { merge: true });

      alert('Cards added to wishlist!');
      setQuantities(prev => ({ ...prev, [card.id]: 0 })); // Reset quantity after adding
    } catch (error) {
      console.error("Error adding card to wishlist:", error);
      alert('Failed to add card to wishlist. Please try again.');
    }
  };

  // Function to handle set click
  const handleSetClick = (set) => {
    if (isDigital) {
      console.log("Navigating to pocket set:", set);
      navigate(`/pocket-set/${set.name}`);
    } else {
      navigate(`/set/${set.id}`);
    }
  };

  // Function to handle digital/physical toggle
  const handleToggle = () => {
    const newState = !isDigital;
    setIsDigital(newState);
    // Save to localStorage
    localStorage.setItem('isDigital', JSON.stringify(newState));
    setSelectedSet(null);
    setCards([]);
    setSearchQuery("");
    setTempSearchQuery("");
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header and Search Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-300">
            {isDigital ? "Pokemon Pocket Sets" : "Pokemon TCG Sets"}
          </h1>
          <div className="flex gap-4 items-center">
            {/* Toggle Switch */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Physical</span>
              <button
                onClick={handleToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isDigital ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isDigital ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">Digital</span>
            </div>
            <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
              {/* Search Type Dropdown */}
              <div className="relative" ref={searchTypeRef}>
                <button
                  type="button"
                  onClick={() => setIsSearchTypeOpen(!isSearchTypeOpen)}
                  className="flex items-center justify-between gap-2 h-[42px] w-32 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 text-sm whitespace-nowrap"
                >
                  <span className="truncate">
                    {searchType === "all" ? "All" : 
                     searchType === "card" ? "Card Name" : "Set Name"}
                  </span>
                  <FaChevronDown className="text-xs flex-shrink-0" />
                </button>
                
                {isSearchTypeOpen && (
                  <div className="absolute top-full left-0 mt-1 w-32 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-10">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchType("all");
                        setIsSearchTypeOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 rounded-t-lg"
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchType("card");
                        setIsSearchTypeOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      Card Name
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchType("set");
                        setIsSearchTypeOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 rounded-b-lg"
                    >
                      Set Name
                    </button>
                  </div>
                )}
              </div>

              {/* Search Input */}
              <div className="relative flex-1 sm:w-96">
                <input
                  type="text"
                  placeholder={`Search by ${searchType === "all" ? "card name or set" : 
                             searchType === "card" ? "card name" : "set name"}...`}
                  value={tempSearchQuery}
                  onChange={(e) => setTempSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>

              {/* Search Button */}
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Search
              </button>
            </form>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-300">How the App Works:</h2>
          <ol className="list-decimal pl-5 space-y-2 text-gray-600 dark:text-gray-400">
            <li>Add cards to your inventory.</li>
            <li>Add cards to your wishlist.</li>
            <li>Browse other users who have the card you want.</li>
            <li>Send offers to other users.</li>
            <li>Trade cards with other users.</li>
          </ol>
        </div>

        {loading && !isDigital ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">{error}</div>
            <p className="text-gray-600">
              Please check your internet connection and try again.
              If the problem persists, the API might be temporarily unavailable.
            </p>
          </div>
        ) : (isDigital && selectedSet) ? (
          <div>
            <div className="mb-4">
              <button
                onClick={() => setSelectedSet(null)}
                className="text-blue-500 hover:text-blue-600 flex items-center gap-2"
              >
                <FaChevronDown className="transform rotate-90" />
                Back to Sets
              </button>
            </div>
            <div className="flex flex-col md:flex-row gap-8 items-start mb-8">
              <img
                src={selectedSet.images.logo}
                alt={`${selectedSet.name} logo`}
                className="w-full md:w-1/3 object-contain bg-gray-100 p-4 rounded-lg"
              />
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-300 pb-5">{selectedSet.name}</h1>
                <div className="space-y-4 text-gray-600 dark:text-gray-400">
                  <p>
                    <span className="font-semibold">Series:</span> {selectedSet.series}
                  </p>
                  <p>
                    <span className="font-semibold">Total Cards:</span> {selectedSet.printedTotal}
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 px-10">
              {cards.map((card) => (
                <div
                  key={card.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 dark:bg-gray-600"
                >
                  <img
                    src={card.image}
                    alt={card.name}
                    className="w-full h-auto object-contain bg-gray-100 p-2 dark:bg-gray-200"
                  />
                  <div className="flex flex-col justify-between items-start">
                    <div className="flex items-center justify-between w-full px-3 min-h-[4rem]">
                      <p className="font-semibold text-gray-600 dark:text-gray-300">{card.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{card.rarity}</p>
                    </div>
                    <div className="flex flex-col justify-start items-start w-full">
                      <p className="text-sm text-gray-500 px-3 dark:text-gray-300">{getDisplayName(card.pack)}</p>
                    </div>
                    <div className="flex flex-col gap-2 px-3 py-2 w-full">
                      <div className="flex justify-center items-center gap-2 mb-2">
                        <button
                          className="border border-gray-200 px-2 py-0 rounded-md hover:bg-gray-100 flex items-center justify-center"
                          onClick={() => updateQuantity(card.id, -1)}
                        >
                          -
                        </button>
                        <p className="text-gray-800 font-semibold p-0.5 text-center min-w-[2rem] dark:text-gray-300">
                          {quantities[card.id] || 0}
                        </p>
                        <button
                          className="border border-gray-200 px-2 py-0 rounded-md hover:bg-gray-100 flex items-center justify-center"
                          onClick={() => updateQuantity(card.id, 1)}
                        >
                          +
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleAddToWishlist(card)}
                          className="flex items-center justify-center gap-1 px-1 py-1.5 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors text-xs"
                        >
                          <MdStar className="text-base flex-shrink-0" />
                          <span>Add to Wishlist</span>
                        </button>
                        <button
                          onClick={() => handleAddToInventory(card)}
                          className="flex items-center justify-center gap-1 px-1 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-xs"
                        >
                          <MdCollections className="text-base flex-shrink-0" />
                          <span>Add to Inventory</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          filteredSets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredSets.map((set) => (
                <div
                  key={set.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 cursor-pointer"
                  onClick={() => handleSetClick(set)}
                >
                  <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                    <img
                      src={set.images.logo}
                      alt={`${set.name} logo`}
                      className="w-full h-48 object-contain p-4"
                    />
                  </div>
                  <div className="p-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-300 truncate dark:text-gray-300">
                      {set.name}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{set.series}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No sets found matching "{searchQuery}"</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default Explore;
