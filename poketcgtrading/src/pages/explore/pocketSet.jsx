import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth, db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { FaChevronDown } from "react-icons/fa";
import { MdCollections, MdStar } from "react-icons/md";

// Import set images
import celestialGuardians from '../../assets/pocketSets/celestial-guardians.png';
import shiningRevelry from '../../assets/pocketSets/shining-revelry.png';
import triumphantLight from '../../assets/pocketSets/triumphant-light.png';
import spaceTimeSmackdown from '../../assets/pocketSets/space-timesmackdown.png';
import mythicalIsland from '../../assets/pocketSets/mythical-island.png';
import geneticApex from '../../assets/pocketSets/genetic-apex.png';
import promo from '../../assets/pocketSets/promo.png';

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

function PocketSet() {
  const navigate = useNavigate();
  const { setId } = useParams();
  const [set, setSet] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantities, setQuantities] = useState({});

  // Function to update quantity
  const updateQuantity = (cardId, change) => {
    setQuantities(prev => ({
      ...prev,
      [cardId]: Math.max(0, (prev[cardId] || 0) + change)
    }));
  };

  // Function to get display name for a set
  const getDisplayName = (setName) => {
    if (setName.startsWith('Shared(')) {
      return setName.match(/Shared\((.*?)\)/)[1];
    }
    return setName;
  };

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

      // Create new card data
      const cardData = {
        cardId: card.id,
        name: card.name,
        image: card.image,
        quantity: quantity,
        setId: card.pack,
        setName: getDisplayName(card.pack)
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

      // Create new card data
      const cardData = {
        cardId: card.id,
        name: card.name,
        image: card.image,
        quantity: quantity,
        setId: card.pack,
        setName: getDisplayName(card.pack)
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

  // Fetch set and cards data
  useEffect(() => {
    const fetchSetData = async () => {
      try {
        setLoading(true);
        console.log("Fetching data for setId:", setId);
        const response = await fetch('https://raw.githubusercontent.com/chase-manning/pokemon-tcg-pocket-cards/refs/heads/main/v4.json');
        if (!response.ok) {
          throw new Error(`Failed to fetch digital sets: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        
        if (Array.isArray(data)) {
          console.log("Total cards in data:", data.length);
          
          // Filter cards for this set - try both the ID and the display name
          const filteredCards = data.filter(card => {
            const cardPack = card.pack;
            const displayName = getDisplayName(cardPack);
            console.log("Checking card:", {
              cardPack,
              displayName,
              setId,
              matches: displayName === setId || cardPack === setId || cardPack === `Shared(${setId})`
            });
            return displayName === setId || cardPack === setId || cardPack === `Shared(${setId})`;
          });

          console.log("Filtered cards:", filteredCards.length);

          if (filteredCards.length > 0) {
            // Get the first card's pack to determine the set name
            const firstCard = filteredCards[0];
            const setDisplayName = getDisplayName(firstCard.pack);
            
            // Find the matching pocket set for the image
            const pocketSet = pocketSets.find(p => p.name === setDisplayName);
            
            console.log("Setting set data:", {
              id: setId,
              name: setDisplayName,
              totalCards: filteredCards.length
            });

            setSet({
              id: setId,
              name: setDisplayName,
              series: "Pokemon TCG Pocket",
              printedTotal: filteredCards.length,
              cards: filteredCards,
              images: {
                logo: pocketSet?.image || firstCard.image
              }
            });
            setCards(filteredCards);
          } else {
            console.error("No cards found for set:", setId);
            throw new Error("Set not found");
          }
        } else {
          console.error("Invalid data format:", data);
          throw new Error("Invalid data format from Pocket JSON");
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching set data:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchSetData();
  }, [setId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">{error}</div>
        <p className="text-gray-600">
          Please check your internet connection and try again.
          If the problem persists, the API might be temporarily unavailable.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4">
          <button
            onClick={() => navigate('/explore')}
            className="text-blue-500 hover:text-blue-600 flex items-center gap-2"
          >
            <FaChevronDown className="transform rotate-90" />
            Back to Sets
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start mb-8">
          <img
            src={set?.images?.logo}
            alt={`${set?.name} logo`}
            className="w-full md:w-1/3 object-contain bg-gray-100 p-4 rounded-lg"
          />
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-300 pb-5">{set?.name}</h1>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                <span className="font-semibold">Series:</span> {set?.series}
              </p>
              <p>
                <span className="font-semibold">Total Cards:</span> {set?.printedTotal}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
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
    </div>
  );
}

export default PocketSet; 