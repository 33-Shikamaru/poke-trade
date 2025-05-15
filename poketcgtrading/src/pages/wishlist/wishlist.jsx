import { useEffect, useState } from "react";
import { doc, getDoc, setDoc, getFirestore } from "firebase/firestore";
import { auth } from "../../firebase";
import { FaTrash, FaCheck } from "react-icons/fa";
import { FcCancel } from "react-icons/fc";

function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
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
          setWishlist(userData.wishlist || []);
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
      const updatedWishlist = wishlist.map(card => {
        if (card.cardId === cardId) {
          const newQuantity = Math.max(0, card.quantity + (pendingChanges[cardId] || 0));
          return { ...card, quantity: newQuantity };
        }
        return card;
      }).filter(card => card.quantity > 0);

      await setDoc(userRef, { wishlist: updatedWishlist }, { merge: true });
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
      const updatedWishlist = wishlist.filter(card => card.cardId !== cardId);

      await setDoc(userRef, { wishlist: updatedWishlist }, { merge: true });
      setWishlist(updatedWishlist);
    } catch (error) {
      console.error("Error deleting card:", error);
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
        <h1 className="text-4xl font-bold mb-8 dark:text-gray-300">My Wishlist</h1>

        {wishlist.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">
              Your wishlist is empty. Start adding cards from the Explore page!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
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

export default Wishlist;
