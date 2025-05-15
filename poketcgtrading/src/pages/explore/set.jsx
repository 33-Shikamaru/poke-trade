import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc, getFirestore } from "firebase/firestore";
import { auth } from "../../firebase";

function Set() {
  const { setId } = useParams();
  const navigate = useNavigate();
  const [set, setSet] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [haveQuantities, setHaveQuantities] = useState({});
  const [wantQuantities, setWantQuantities] = useState({});
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

  const updateHaveQuantity = (cardId, change) => {
    setHaveQuantities((prev) => ({
      ...prev,
      [cardId]: Math.max(0, (prev[cardId] || 0) + change),
    }));
  };
  // console.log(haveQuantities)

  const updateWantQuantity = (cardId, change) => {
    setWantQuantities((prev) => ({
      ...prev,
      [cardId]: Math.max(0, (prev[cardId] || 0) + change),
    }));
  };

  const handleSave = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }

      const userRef = doc(db, "users", user.uid);

      // Get current data
      const userSnap = await getDoc(userRef);
      const currentData = userSnap.exists() ? userSnap.data() : {};
      const existingInventory = currentData.inventory || [];
      const existingWishlist = currentData.wishlist || [];

      console.log("Existing inventory:", existingInventory);
      console.log("Have quantities:", haveQuantities);
      console.log("Want quantities:", wantQuantities);

      // Create maps for fast lookup
      const inventoryMap = new Map();
      const wishlistMap = new Map();

      // Add existing cards to maps
      existingInventory.forEach(card => {
        inventoryMap.set(card.cardId, { ...card });
      });
      existingWishlist.forEach(card => {
        wishlistMap.set(card.cardId, { ...card });
      });

      // Process inventory updates
      const newInventoryCards = [];
      Object.entries(haveQuantities).forEach(([cardId, quantity]) => {
        if (quantity > 0) {
          const card = cards.find(c => c.id === cardId);
          if (card) {
            const cardData = {
              cardId: card.id,
              name: card.name,
              image: card.images.small,
              quantity: quantity,
              setId: setId,
              setName: set.name
            };
            newInventoryCards.push(cardData);
          }
        }
      });

      // Process wishlist updates
      const newWishlistCards = [];
      Object.entries(wantQuantities).forEach(([cardId, quantity]) => {
        if (quantity > 0) {
          const card = cards.find(c => c.id === cardId);
          if (card) {
            const cardData = {
              cardId: card.id,
              name: card.name,
              image: card.images.small,
              quantity: quantity,
              setId: setId,
              setName: set.name
            };
            newWishlistCards.push(cardData);
          }
        }
      });

      console.log("New inventory cards:", newInventoryCards);
      console.log("New wishlist cards:", newWishlistCards);

      // Merge new cards with existing ones
      newInventoryCards.forEach(card => {
        inventoryMap.set(card.cardId, card);
      });
      newWishlistCards.forEach(card => {
        wishlistMap.set(card.cardId, card);
      });

      // Convert maps back to arrays
      const mergedInventory = Array.from(inventoryMap.values());
      const mergedWishlist = Array.from(wishlistMap.values());

      console.log("Final merged inventory:", mergedInventory);
      console.log("Final merged wishlist:", mergedWishlist);

      // Save merged data to Firestore
      await setDoc(userRef, {
        inventory: mergedInventory,
        wishlist: mergedWishlist
      }, { merge: true });

      navigate('/inventory');
    } catch (error) {
      console.error("Error saving card data:", error);
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

  if (!set) {
    return (
      <div className="text-center min-h-screen flex items-center justify-center">
        Set not found
      </div>
    );
  }

  return (
    <div className="min-h-screen p-5">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8 items-start mb-8 px-10">
          <img
            src={set.images.logo}
            alt={`${set.name} logo`}
            className="w-full md:w-1/3 object-contain bg-gray-100 p-4 rounded-lg"
          />
          <div className="flex-1">
            <h1 className="text-4xl font-bold pb-5">{set.name}</h1>
            <div className="space-y-4">
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
          <h2 className="text-2xl font-bold mb-4 px-10">Cards in this Set</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 px-10">
            {cards.map((card) => (
              <div
                key={card.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 dark:bg-gray-400"
              >
                <img
                  src={card.images.small}
                  alt={card.name}
                  className="w-full h-auto object-contain bg-gray-100 p-2"
                />
                <div className="flex flex-col justify-between items-center">
                  <div className="flex items-center justify-between w-full px-3 min-h-[4rem]">
                    <p className="font-semibold text-gray-600">{card.name}</p>
                    <p className="text-sm text-gray-600">
                      {card.number}/{set.printedTotal}
                    </p>
                  </div>

                  
                  <div className="grid grid-cols-2 gap-4 px-3 py-2">
                    <div className="grid justify-items-center">
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <button
                          className="border border-gray-200 px-2 py-0 rounded-md hover:bg-gray-100 flex items-center justify-center"
                          onClick={() => updateWantQuantity(card.id, -1)}
                        >
                          -
                        </button>
                        <p className="text-gray-800 font-semibold p-0.5 text-center">
                          {wantQuantities[card.id] || 0}
                        </p>
                        <button
                          className="border border-gray-200 px-2 py-0 rounded-md hover:bg-gray-100 flex items-center justify-center"
                          onClick={() => updateWantQuantity(card.id, 1)}
                        >
                          +
                        </button>
                      </div>
                      <p className="text-gray-800 p-0.5 text-center">Want</p>
                    </div>
                    <div className="grid justify-items-center">
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <button
                          className="border border-gray-200 px-2 py-0 rounded-md hover:bg-gray-100 flex items-center justify-center"
                          onClick={() => updateHaveQuantity(card.id, -1)}
                        >
                          -
                        </button>
                        <p className="text-gray-800 font-semibold p-0.5 text-center">
                          {haveQuantities[card.id] || 0}
                        </p>
                        <button
                          className="border border-gray-200 px-2 py-0 rounded-md hover:bg-gray-100 flex items-center justify-center"
                          onClick={() => updateHaveQuantity(card.id, 1)}
                        >
                          +
                        </button>
                      </div>
                      <p className="text-gray-800 p-0.5 text-center">Have</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center space-x-4 mt-10">
            <button
              onClick={handleSave}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              Save Changes
            </button>
            <button
              onClick={() => navigate('/explore')}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Set;
