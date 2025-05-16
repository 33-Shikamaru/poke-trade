import { useEffect, useState } from "react";
import { doc, getDoc, setDoc, getFirestore } from "firebase/firestore";
import { auth } from "../../firebase";
import { FaTrash, FaCheck, FaSearch, FaChevronDown } from "react-icons/fa";
import { FcCancel } from "react-icons/fc";
import Dropdown from "../../components/Dropdown";
import { Link } from "react-router-dom"

function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingChanges, setPendingChanges] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("all"); // "all", "card", "set"
  const [isSearchTypeOpen, setIsSearchTypeOpen] = useState(false);
  const db = getFirestore();

  const fetchInventory = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }

      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setInventory(userData.inventory || []);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const updateQuantity = (cardId, change) => {
    setPendingChanges(prev => {
      const originalCard = inventory.find(card => card.cardId === cardId);
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
      const updatedInventory = inventory.map(card => {
        if (card.cardId === cardId) {
          const newQuantity = Math.max(0, card.quantity + (pendingChanges[cardId] || 0));
          return { ...card, quantity: newQuantity };
        }
        return card;
      }).filter(card => card.quantity > 0);

      await setDoc(userRef, { inventory: updatedInventory }, { merge: true });
      setInventory(updatedInventory);
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
      const updatedInventory = inventory.filter(card => card.cardId !== cardId);

      await setDoc(userRef, { inventory: updatedInventory }, { merge: true });
      setInventory(updatedInventory);
    } catch (error) {
      console.error("Error deleting card:", error);
      setError(error.message);
    }
  };

  // Filter inventory based on search query
  const filteredInventory = inventory.filter(card => {
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
        {/* Header with Search */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-4xl font-bold">My Inventory</h1>
          
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
        
        {filteredInventory.length === 0 ? (
          <div className="text-center py-12 bg-gray-100">
            <p className="text-gray-600">
              {searchQuery ? 
                `No cards found matching "${searchQuery}"` :
                "Your inventory is empty. Start adding cards from the "}
              {!searchQuery && <Link to="/explore" className="text-blue-500 hover:text-blue-700">Explore page</Link>}
              {!searchQuery && "!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 bg-gray-100 dark:bg-gray-800 p-2 rounded-xl">
            {filteredInventory.map((card) => (
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
                  <button
                    onClick={() => deleteCard(card.cardId)}
                    className="text-red-500 bg-gray-200 p-1 rounded hover:text-red-700"
                  >
                    <FaTrash />
                  </button>
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
          </div>
        )}
      </div>
    </div>
  );
}

export default Inventory;