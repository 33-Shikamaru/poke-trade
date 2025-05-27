import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc, getFirestore } from "firebase/firestore";
import { auth } from "../../firebase";
import { MdStar, MdCollections } from "react-icons/md";

function Set() {
  const { setId } = useParams();
  const navigate = useNavigate();
  const [set, setSet] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantities, setQuantities] = useState({});
  const db = getFirestore();

  useEffect(() => {
    const fetchSetAndCards = async () => {
      try {
        // Fetch set details
        const setResponse = await fetch(
          `https://api.pokemontcg.io/v2/sets/${setId}`,
          {
            headers: {
              "X-Api-Key": process.env.REACT_APP_POKEMON_TCG_API_KEY,
            },
          }
        );

        if (!setResponse.ok) {
          throw new Error("Failed to fetch set details");
        }
        const setData = await setResponse.json();
        setSet(setData.data);

        // Fetch cards in the set
        const cardsResponse = await fetch(
          `https://api.pokemontcg.io/v2/cards?q=set.id:${setId}`,
          {
            headers: {
              "X-Api-Key": process.env.REACT_APP_POKEMON_TCG_API_KEY,
            },
          }
        );

        if (!cardsResponse.ok) {
          throw new Error("Failed to fetch cards");
        }
        const cardsData = await cardsResponse.json();
        setCards(cardsData.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchSetAndCards();
  }, [setId]);

  const updateQuantity = (cardId, change) => {
    setQuantities(prev => ({
      ...prev,
      [cardId]: Math.max(0, (prev[cardId] || 0) + change)
    }));
  };

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

      // Create new card data
      const cardData = {
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

      // Create new card data
      const cardData = {
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

  if (!set) {
    return (
      <div className="text-center min-h-screen flex items-center justify-center">
        Set not found
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header and Set Info Section */}
        <div className="flex flex-col md:flex-row gap-8 items-start mb-8">
          <img
            src={set.images.logo}
            alt={`${set.name} logo`}
            className="w-full md:w-1/3 object-contain bg-gray-100 p-4 rounded-lg"
          />
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-300 pb-5">{set.name}</h1>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                <span className="font-semibold">Series:</span> {set.series}
              </p>
              <p>
                <span className="font-semibold">Release Date:</span>{" "}
                {set.releaseDate}
              </p>
              <p>
                <span className="font-semibold">Total Cards:</span> {set.total}
              </p>
              <p>
                <span className="font-semibold">Printed Total:</span>{" "}
                {set.printedTotal}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-300 mb-4">Cards in this Set</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {cards.map((card) => (
              <div
                key={card.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 
                dark:bg-gray-600"
              >
                <img
                  src={card.images.small}
                  alt={card.name}
                  className="w-full h-auto object-contain bg-gray-100 p-2 dark:bg-gray-200"
                />
                <div className="flex flex-col justify-between items-start">
                  <div className="flex items-center justify-between w-full px-3 min-h-[4rem]">
                    <p className="font-semibold text-gray-600 dark:text-gray-300">{card.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {card.number}/{set.printedTotal}
                    </p>
                  </div>
                  <div className="flex flex-col justify-start items-start w-full">
                    <p className="text-sm text-gray-500 px-3 dark:text-gray-300">{set.name}</p>
                  </div>
                  <div className="flex flex-col gap-2 px-3 py-2 w-full dark:text-gray-300">
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
      </div>
    </div>
  );
}

export default Set;
