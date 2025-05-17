import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { FaSearch, FaChevronDown } from "react-icons/fa";

function Explore() {
  const navigate = useNavigate();
  const [sets, setSets] = useState([]);
  const [cards, setCards] = useState([]);
  const [filteredSets, setFilteredSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tempSearchQuery, setTempSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("all"); // "all", "card", "set"
  const [isSearchTypeOpen, setIsSearchTypeOpen] = useState(false);

  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(tempSearchQuery);
  };

  // Initial fetch of all sets
  useEffect(() => {
    const fetchSets = async () => {
      try {
        console.log("Fetching all sets");
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
        setLoading(false);
      } catch (err) {
        console.error("Error fetching sets:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchSets();
  }, []);

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

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header and Search Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-4xl font-bold text-gray-900">
            All the Sets of Cards
          </h1>
          <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
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
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">How the App Works:</h2>
          <ol className="list-decimal pl-5 space-y-2 text-gray-600">
            <li>Add cards to your inventory.</li>
            <li>Add cards to your wishlist.</li>
            <li>Browse other users who have the card you want.</li>
            <li>Send offers to other users.</li>
            <li>Trade cards with other users.</li>
          </ol>
        </div>

        {loading ? (
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
        ) : searchType === "card" && searchQuery ? (
          cards.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {cards.map((card) => (
                <div
                  key={card.id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 cursor-pointer"
                  onClick={() => navigate(`/set/${card.set.id}`)}
                >
                  <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                    <img
                      src={card.images.small}
                      alt={card.name}
                      className="w-full h-48 object-contain p-4"
                    />
                  </div>
                  <div className="p-4">
                    <h2 className="text-lg font-semibold text-gray-900 truncate">
                      {card.name}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">{card.set.name}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No cards found matching "{searchQuery}"</p>
            </div>
          )
        ) : (
          filteredSets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredSets.map((set) => (
                <div
                  key={set.id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 cursor-pointer"
                  onClick={() => navigate(`/set/${set.id}`)}
                >
                  <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                    <img
                      src={set.images.logo}
                      alt={`${set.name} logo`}
                      className="w-full h-48 object-contain p-4"
                    />
                  </div>
                  <div className="p-4">
                    <h2 className="text-lg font-semibold text-gray-900 truncate">
                      {set.name}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">{set.series}</p>
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
