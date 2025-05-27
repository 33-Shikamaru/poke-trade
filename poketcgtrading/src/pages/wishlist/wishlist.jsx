import { useEffect, useState, useRef } from "react";
import { doc, getDoc, setDoc, getFirestore } from "firebase/firestore";
import { auth } from "../../firebase";
import { FaTrash, FaCheck, FaStar, FaSearch, FaChevronDown, FaPlus } from "react-icons/fa";
import { FcCancel } from "react-icons/fc";
import { Link, useNavigate } from "react-router-dom"
import Dropdown from "../../components/Dropdown";


function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingChanges, setPendingChanges] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("all"); // "all", "card", "set"
  const [isSearchTypeOpen, setIsSearchTypeOpen] = useState(false);
  const [isDigital, setIsDigital] = useState(false);
  const db = getFirestore();
  const navigate = useNavigate();
  const searchTypeRef = useRef(null);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          throw new Error("User not authenticated");
        }

        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setWishlist(userData.wishList.cards || []);
          setFavorites(userData.wishList.favorites || []);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching wishlist:", error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchWishlist();
  }, []);

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

  const updateQuantity = (cardId, change) => {
    setPendingChanges(prev => {
      const originalCard = wishlist.find(card => card.cardId === cardId);
      const originalQuantity = originalCard?.quantity || 0;
      const newPending = (prev[cardId] || 0) + change;
      const finalQuantity = originalQuantity + newPending;
  
      const updatedChanges = { ...prev };
  
      if (finalQuantity === originalQuantity) {
        delete updatedChanges[cardId]; // remove no-op changes
      } else {
        updatedChanges[cardId] = newPending;
      }
  
      return updatedChanges;
    });
  };

  const confirmChanges = async (cardId) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();

      const updatedWishlist = wishlist.map(card => {
        if (card.cardId === cardId) {
          const newQuantity = Math.max(0, card.quantity + (pendingChanges[cardId] || 0));
          return { ...card, quantity: newQuantity };
        }
        return card;
      }).filter(card => card.quantity > 0);

      // Preserve all existing user data and only update the wishList field
      await setDoc(userRef, {
        ...userData,
        wishList: {
          cards: updatedWishlist,
          favorites: userData.wishList.favorites || []
        }
      });
      setWishlist(updatedWishlist);
      setPendingChanges(prev => {
        const newChanges = { ...prev };
        delete newChanges[cardId];
        return newChanges;
      });
    } catch (error) {
      console.error("Error updating quantity:", error);
      setError(error.message);
    }
  };

  const cancelChanges = (cardId) => {
    setPendingChanges(prev => {
      const newChanges = { ...prev };
      delete newChanges[cardId];
      return newChanges;
    });
  };

  const deleteCard = async (cardId) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();

      const updatedWishlist = wishlist.filter(card => card.cardId !== cardId);

      await setDoc(userRef, { 
        wishList: {
          cards: updatedWishlist,
          favorites: userData.wishList.favorites || []
        }
      }, { merge: true });
      setWishlist(updatedWishlist);
    } catch (error) {
      console.error("Error deleting card:", error);
      setError(error.message);
    }
  };

  const toggleFavorite = async (cardId) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      let updatedFavorites;

      if (favorites.includes(cardId)) {
        // Remove from favorites
        updatedFavorites = favorites.filter(id => id !== cardId);
      } else {
        // Add to favorites if under limit
        if (favorites.length >= 3) {
          const modal = document.createElement('div');
          modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
          modal.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-xl max-w-sm mx-4 flex flex-col items-center justify-center">
              <h3 class="text-lg font-semibold mb-4">Favorite Limit Reached</h3>
              <p class="text-gray-600 mb-6">You can only have up to 3 favorite cards.</p>
              <button class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">OK</button>
            </div>
          `;
          
          document.body.appendChild(modal);
          
          modal.querySelector('button').onclick = () => {
            modal.remove();
          };
          return;
        }
        updatedFavorites = [...favorites, cardId];
      }

      // Update both wishlist and favorites in the database
      await setDoc(userRef, {
        ...userData,
        wishList: {
          cards: userData.wishList.cards || [],
          favorites: updatedFavorites
        }
      });

      // Update local state
      setFavorites(updatedFavorites);
    } catch (error) {
      console.error("Error updating favorites:", error);
      setError(error.message);
    }
  };

  // Filter cards based on search query and type
  const filteredWishlist = wishlist.filter(card => {
    // First filter by digital/physical
    if (isDigital) {
      // For digital cards, check if the card is from a Pocket set
      const isPocketCard = card.setName.includes('Pocket') || 
                          card.setName.includes('Genetic Apex') ||
                          card.setName.includes('Mythical Island') ||
                          card.setName.includes('Space-Time Smackdown') ||
                          card.setName.includes('Triumphant Light') ||
                          card.setName.includes('Shining Revelry') ||
                          card.setName.includes('Celestial Guardians') ||
                          card.setName.includes('Promo');
      if (!isPocketCard) return false;
    } else {
      // For physical cards, exclude Pocket cards
      const isPocketCard = card.setName.includes('Pocket') || 
                          card.setName.includes('Genetic Apex') ||
                          card.setName.includes('Mythical Island') ||
                          card.setName.includes('Space-Time Smackdown') ||
                          card.setName.includes('Triumphant Light') ||
                          card.setName.includes('Shining Revelry') ||
                          card.setName.includes('Celestial Guardians') ||
                          card.setName.includes('Promo');
      if (isPocketCard) return false;
    }

    // Then apply search filter
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    switch (searchType) {
      case "card":
        return card.name.toLowerCase().includes(query);
      case "set":
        return card.setName.toLowerCase().includes(query);
      default:
        return card.name.toLowerCase().includes(query) || 
               card.setName.toLowerCase().includes(query);
    }
  });

  // Filter favorites based on digital/physical state
  const filteredFavorites = favorites.filter(cardId => {
    const card = wishlist.find(c => c.cardId === cardId);
    if (!card) return false;

    if (isDigital) {
      // For digital cards, check if the card is from a Pocket set
      const isPocketCard = card.setName.includes('Pocket') || 
                          card.setName.includes('Genetic Apex') ||
                          card.setName.includes('Mythical Island') ||
                          card.setName.includes('Space-Time Smackdown') ||
                          card.setName.includes('Triumphant Light') ||
                          card.setName.includes('Shining Revelry') ||
                          card.setName.includes('Celestial Guardians') ||
                          card.setName.includes('Promo');
      return isPocketCard;
    } else {
      // For physical cards, exclude Pocket cards
      const isPocketCard = card.setName.includes('Pocket') || 
                          card.setName.includes('Genetic Apex') ||
                          card.setName.includes('Mythical Island') ||
                          card.setName.includes('Space-Time Smackdown') ||
                          card.setName.includes('Triumphant Light') ||
                          card.setName.includes('Shining Revelry') ||
                          card.setName.includes('Celestial Guardians') ||
                          card.setName.includes('Promo');
      return !isPocketCard;
    }
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center min-h-screen flex items-center justify-center">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Favorites Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            <h1 className="text-4xl font-bold mb-8 dark:text-gray-00">Favorite Cards</h1>
            
            <div className="flex gap-4 items-center">
              {/* Toggle Switch */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Physical</span>
                <button
                  onClick={() => setIsDigital(!isDigital)}
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

              <div className="flex gap-2 w-full sm:w-auto">
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
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 max-w-3xl mx-auto gap-7 mb-18">
            {filteredFavorites.length > 0 ? (
              filteredFavorites.map(cardId => {
                const card = wishlist.find(c => c.cardId === cardId);
                if (!card) return null;
                return (
                  <div
                    key={cardId}
                    className="shadow-[0_0_15px_3px_rgba(255,0,0,0.3)] hover:shadow-[0_0_25px_5px_rgba(255,0,0,0.5)] bg-white rounded-lg overflow-hidden transition-shadow duration-300 dark:bg-gray-600 dark:shadow-[0_0_10px_2px_rgba(255,255,255,0.5)] dark:hover:shadow-[0_0_20px_2px_rgba(255,255,255,0.8)]"
                  >
                    <img
                      src={card.image}
                      alt={card.name}
                      className="w-full p-2 h-auto object-contain bg-gray-200 dark:bg-transparent"
                    />
                    <div className="p-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-300 text-sm">{card.name}</h3>
                        <button
                          onClick={() => toggleFavorite(cardId)}
                          className="text-yellow-500 p-1 rounded"
                          title="Remove from favorites"
                        >
                          <FaStar />
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{card.setName}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Quantity: {card.quantity}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-4 text-gray-600 dark:text-gray-400">
                {isDigital ? 
                  "No digital favorite cards yet. Click the star icon on any digital card to add it to your favorites!" :
                  "No physical favorite cards yet. Click the star icon on any physical card to add it to your favorites!"}
              </div>
            )}
          </div>
        </div>

        {/* Search and Title Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-4xl font-bold dark:text-gray-300">My Wishlist</h1>
          <div className="flex gap-2 w-full sm:w-auto">
            {/* Dropdown Filters */}
            <div className='flex flex-col sm:flex-row justify-center items-center pb-10 gap-2 sm:gap-5 text-md'>
              <div className='flex flex-row justify-center items-center gap-1 sm:gap-2 w-3/4 sm:w-auto'>
                <p className='w-full text-center sm:text-left'>Platform:</p>
                <Dropdown typeFilter="platform" />
              </div>
              <div className='flex flex-row justify-center items-center gap-1 sm:gap-2 w-3/4 sm:w-auto'>
                <p className='w-full text-center sm:text-left'>Sort By:</p>
                <Dropdown typeFilter="sort" />
              </div>
              <div className='flex flex-row justify-center items-center gap-1 sm:gap-2 w-3/4 sm:w-auto'>
                <p className='w-full text-center sm:text-left'>Filter By:</p>
                <Dropdown typeFilter="filter" />
              </div>
            </div>
          </div>
        </div>

        {filteredWishlist.length === 0 ? (
          <div className="text-center py-12 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <FaSearch className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-300">
              {searchQuery ? "No cards found matching your search" : "Your wishlist is empty"}
            </h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              {!searchQuery && (
                <>
                  Start adding cards from the{" "}
                  <Link to="/explore" className="text-blue-500 hover:text-blue-700">
                    Explore page
                  </Link>
                </>
              )}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredWishlist.map((card) => (
              <div
                key={card.cardId}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 dark:bg-gray-600 transform hover:-translate-y-1 hover:scale-[1.02]"
              >
                <img
                  src={card.image}
                  alt={card.name}
                  className="w-full h-auto object-contain p-2 bg-gray-200 dark:bg-transparent"
                />
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-300">{card.name}</h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleFavorite(card.cardId)}
                        className={`p-1 rounded ${
                          favorites.includes(card.cardId)
                            ? 'text-yellow-500'
                            : 'text-gray-400 hover:text-yellow-500'
                        }`}
                        title={favorites.includes(card.cardId) ? "Remove from favorites" : "Add to favorites"}
                      >
                        <FaStar />
                      </button>
                      <button
                        onClick={() => deleteCard(card.cardId)}
                        className="text-red-500 bg-gray-200 p-1 rounded hover:text-red-700"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{card.setName}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(card.cardId, -1)}
                        className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                      >
                        -
                      </button>
                      <span className="text-gray-600 dark:text-gray-300">
                        {card.quantity + (pendingChanges[card.cardId] || 0)}
                      </span>
                      <button
                        onClick={() => updateQuantity(card.cardId, 1)}
                        className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      {pendingChanges[card.cardId] && (
                        <>
                          <button
                            onClick={() => confirmChanges(card.cardId)}
                            className="text-green-500 bg-gray-200 p-1 rounded hover:text-green-700"
                          >
                            <FaCheck />
                          </button>
                          <button
                            onClick={() => cancelChanges(card.cardId)}
                            className="text-red-500 bg-gray-200 p-1 rounded hover:text-red-700"
                          >
                            <FcCancel />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {/* Add Cards Button */}
            <div
              onClick={() => navigate('/explore')}
              className="bg-gray-100 dark:bg-gray-700 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-500 hover:border-blue-500 dark:hover:border-blue-400 group hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <div className="w-full h-[200px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <FaPlus className="text-2xl text-blue-500 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-300 text-center group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors duration-300">
                    Add More Cards
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    Browse and add to your collection
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Wishlist;
