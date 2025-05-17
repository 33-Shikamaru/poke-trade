import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { FaSearch, FaChevronDown, FaStar } from "react-icons/fa";
import { useParams } from "react-router-dom";

function UserWishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("all");
  const [isSearchTypeOpen, setIsSearchTypeOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const { userId } = useParams();

  const fetchUserWishlist = async () => {
    try {
      if (!userId) {
        throw new Error("No user ID provided");
      }

      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error("User not found");
      }

      const data = userDoc.data();
      setUserData({
        displayName: data.displayName || data.email || 'Unknown User',
        email: data.email || '',
      });
      setWishlist(data.wishList?.cards || []);
      setFavorites(data.wishList?.favorites || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching user wishlist:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserWishlist();
  }, [userId]);

  // Filter wishlist based on search query
  const filteredWishlist = wishlist.filter(card => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    if (searchType === "all") {
      return card.name.toLowerCase().includes(query) || 
             card.setName.toLowerCase().includes(query);
    } else if (searchType === "card") {
      return card.name.toLowerCase().includes(query);
    } else {
      return card.setName.toLowerCase().includes(query);
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
        {/* Favorites Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-8 dark:text-gray-300">{userData?.displayName}'s Favorite Cards</h1>
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 max-w-3xl mx-auto gap-7">
            {favorites.length > 0 ? (
              favorites.map(cardId => {
                const card = wishlist.find(c => c.cardId === cardId);
                if (!card) return null;
                return (
                  <div
                    key={cardId}
                    className="shadow-[0_0_15px_2px_rgba(255,0,0,0.5)] bg-white rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 dark:bg-gray-600"
                  >
                    <img
                      src={card.image}
                      alt={card.name}
                      className="w-full p-2 h-auto object-contain bg-gray-200 dark:bg-transparent"
                    />
                    <div className="p-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-300 text-sm">{card.name}</h3>
                        <FaStar className="text-yellow-500" />
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{card.setName}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Quantity: {card.quantity}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-4 text-gray-600 dark:text-gray-400">
                No favorite cards yet.
              </div>
            )}
          </div>
        </div>

        {/* Search and Title Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-4xl font-bold dark:text-gray-300">{userData?.displayName}'s Wishlist</h1>
          <div className="flex gap-2 w-full sm:w-auto">
            {/* Search Type Dropdown */}
            <div className="relative">
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

        {filteredWishlist.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">
              {searchQuery ? 
                `No cards found matching "${searchQuery}"` :
                "This user's wishlist is empty."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 dark:bg-gray-800 p-2 rounded-xl">
            {filteredWishlist.map((card) => (
              <div
                key={card.cardId}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 dark:bg-gray-600"
              >
                <img
                  src={card.image}
                  alt={card.name}
                  className="w-full h-auto object-contain p-2 bg-gray-200 dark:bg-transparent"
                />
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-300">{card.name}</h3>
                    {favorites.includes(card.cardId) && (
                      <FaStar className="text-yellow-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{card.setName}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">Quantity: {card.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default UserWishlist; 