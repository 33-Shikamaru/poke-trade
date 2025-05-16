import { useEffect, useState } from "react";
import { doc, getDoc, setDoc, getFirestore } from "firebase/firestore";
import { auth } from "../../firebase";
import { FaTrash, FaCheck, FaStar } from "react-icons/fa";
import { FcCancel } from "react-icons/fc";
import { Link } from "react-router-dom"
import Dropdown from "../../components/Dropdown";


function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingChanges, setPendingChanges] = useState({});
  const db = getFirestore();

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

      await setDoc(userRef, { 
        wishList: {
          cards: wishlist,
          favorites: updatedFavorites
        }
      }, { merge: true });
      setFavorites(updatedFavorites);
    } catch (error) {
      console.error("Error updating favorites:", error);
      setError(error.message);
    }
  };

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
          <h1 className="text-4xl font-bold mb-8 dark:text-gray-00">Favorite Cards</h1>
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 max-w-3xl mx-auto gap-7">
            {favorites.length > 0 ? (
              favorites.map(cardId => {
                const card = wishlist.find(c => c.cardId === cardId);
                if (!card) return null;
                return (
                  <div
                    key={cardId}
                    className="shadow-[0_0_15px_2px_rgba(255,0,0,0.5)] bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 dark:bg-gray-600"
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
                No favorite cards yet. Click the star icon on any card to add it to your favorites!
              </div>
            )}
          </div>
        </div>

        {/* Rest of Wishlist */}
        <h1 className="text-4xl font-bold mb-8 dark:text-gray-300">My Wishlist</h1>

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


        {wishlist.length === 0 ? (
          <div className="text-center py-12 bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-gray-800 dark:text-gray-300">
            <p className="text-gray-600 dark:text-gray-300">
              Your wishlist is empty. Start adding cards from the <Link to="/explore" className="text-blue-500 hover:text-blue-700">Explore page</Link>!
            </p>
          </div>
        ) : (
            <div className="grid grid-cols-2 sm:d-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 bg-gray-100 dark:bg-gray-800 p-2 rounded-xl">
            {wishlist.map((card) => (
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
          </div>
        )}
      </div>
    </div>
  );
}

export default Wishlist;
