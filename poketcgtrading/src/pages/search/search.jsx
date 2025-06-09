import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { FaSearch, FaTimes, FaExchangeAlt } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import Avatar1 from '../../assets/avatars/avatar1.png';
import Avatar2 from '../../assets/avatars/avatar2.png';
import Avatar3 from '../../assets/avatars/avatar3.png';
import Avatar4 from '../../assets/avatars/avatar4.png';
import Avatar5 from '../../assets/avatars/avatar5.png';
import Avatar6 from '../../assets/avatars/avatar6.png';
import Avatar7 from '../../assets/avatars/avatar7.png';
import Avatar8 from '../../assets/avatars/avatar8.png';
import Avatar9 from '../../assets/avatars/avatar9.png';

const avatarOptions = [
  { image: Avatar1, name: "avatar1" },
  { image: Avatar2, name: "avatar2" },
  { image: Avatar3, name: "avatar3" },
  { image: Avatar4, name: "avatar4" },
  { image: Avatar5, name: "avatar5" },
  { image: Avatar6, name: "avatar6" },
  { image: Avatar7, name: "avatar7" },
  { image: Avatar8, name: "avatar8" },
  { image: Avatar9, name: "avatar9" },
  { image: null, name: "upload", isUpload: true }
];

function TradeOfferModal({ isOpen, onClose, targetCard, targetUser, onTrade }) {
    const [userInventory, setUserInventory] = useState([]);
    const [selectedCards, setSelectedCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [commonCards, setCommonCards] = useState([]);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!isOpen) return;
            
            try {
                const user = auth.currentUser;
                if (!user) return;

                // Fetch current user's inventory
                const userRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userRef);
                
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const inventory = userData.inventory || [];
                    setUserInventory(inventory);

                    // Check for common cards with target user's wishlist
                    const targetUserWishlist = targetUser.userData.wishList?.cards || [];
                    const common = inventory.filter(myCard => 
                        targetUserWishlist.some(theirCard => 
                            theirCard.cardId === myCard.cardId
                        )
                    );
                    setCommonCards(common);
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [isOpen, targetUser]);

    const toggleCardSelection = (card) => {
        setSelectedCards(prev => {
            if (prev.find(c => c.cardId === card.cardId)) {
                return prev.filter(c => c.cardId !== card.cardId);
            }
            return [...prev, card];
        });
    };

    const handleTrade = async () => {
        try {
            const user = auth.currentUser;
            if (!user) return;

            // Create trade document in trades collection
            const tradeRef = doc(collection(db, 'trades'));
            const tradeData = {
                fromUser: user.uid,
                toUser: targetUser.userId,
                targetCard: {
                    cardId: targetCard.cardId,
                    name: targetCard.name,
                    image: targetCard.image,
                    setId: targetCard.setId,
                    setName: targetCard.setName,
                    quantity: targetCard.quantity
                },
                offeredCards: selectedCards.map(card => ({
                    cardId: card.cardId,
                    name: card.name,
                    image: card.image,
                    setId: card.setId,
                    setName: card.setName,
                    quantity: card.quantity
                })),
                status: 'pending',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };
            await setDoc(tradeRef, { ...tradeData, id: tradeRef.id });

            // Add trade reference to both users' tradeList array
            const fromUserRef = doc(db, 'users', user.uid);
            const toUserRef = doc(db, 'users', targetUser.userId);

            // Add new trade ID to existing tradeList array
            await updateDoc(fromUserRef, {
                tradeList: arrayUnion(tradeRef.id)
            });

            await updateDoc(toUserRef, {
                tradeList: arrayUnion(tradeRef.id)
            });

            onClose();
        } catch (error) {
            console.error('Error creating trade:', error);
            alert('Failed to create trade. Please try again.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Make a Trade Offer
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <FaTimes className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Target Card Section */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            Card You Want
                        </h3>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center">
                            <img
                                src={targetCard.image}
                                alt={targetCard.name}
                                className="w-24 h-24 object-contain rounded-lg mr-4"
                            />
                            <div>
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                    {targetCard.name}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {targetCard.setName}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Owner: {targetUser.userData.displayName || targetUser.userData.email}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Common Cards Section */}
                    {loading ? (
                        <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : commonCards.length > 0 ? (
                        <div className="mb-6">
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-4">
                                <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-2">
                                    Great News! You have cards they want!
                                </h3>
                                <p className="text-green-700 dark:text-green-400">
                                    The following cards are in your inventory and on their wishlist:
                                </p>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {commonCards.map((card) => (
                                    <div
                                        key={card.cardId}
                                        onClick={() => toggleCardSelection(card)}
                                        className={`bg-gray-50 dark:bg-gray-700 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                                            selectedCards.find(c => c.cardId === card.cardId)
                                                ? 'ring-2 ring-blue-500 transform scale-105'
                                                : 'hover:shadow-md'
                                        }`}
                                    >
                                        <img
                                            src={card.image}
                                            alt={card.name}
                                            className="w-full h-auto rounded-lg mb-2"
                                        />
                                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                                            {card.name}
                                        </h4>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            {card.setName}
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            Quantity: {card.quantity}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="mb-6">
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 mb-4">
                                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                                    No Common Cards Found
                                </h3>
                                <p className="text-yellow-700 dark:text-yellow-400">
                                    You don't have any cards from their wishlist. Select cards from your inventory to make an offer:
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Your Inventory Section */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            Your Inventory
                        </h3>
                        {loading ? (
                            <div className="flex justify-center items-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                            </div>
                        ) : userInventory.length === 0 ? (
                            <p className="text-gray-600 dark:text-gray-400 text-center py-4">
                                Your inventory is empty. Add some cards to make trade offers!
                            </p>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {userInventory.map((card) => (
                                    <div
                                        key={card.cardId}
                                        onClick={() => toggleCardSelection(card)}
                                        className={`bg-gray-50 dark:bg-gray-700 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                                            selectedCards.find(c => c.cardId === card.cardId)
                                                ? 'ring-2 ring-blue-500 transform scale-105'
                                                : 'hover:shadow-md'
                                        }`}
                                    >
                                        <img
                                            src={card.image}
                                            alt={card.name}
                                            className="w-full h-auto rounded-lg mb-2"
                                        />
                                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                                            {card.name}
                                        </h4>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            {card.setName}
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            Quantity: {card.quantity}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 flex justify-end gap-4">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleTrade}
                            disabled={selectedCards.length === 0}
                            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                                selectedCards.length === 0
                                    ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                        >
                            <FaExchangeAlt />
                            Make Offer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Search() {
    console.log("Search component rendered"); // Debug log

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedCard, setSelectedCard] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        console.log("Search component mounted"); // Debug log
    }, []);

    const searchCards = async () => {
        if (!searchQuery.trim()) return;

        console.log("Searching for:", searchQuery); // Debug log
        setLoading(true);
        setError(null);

        try {
            // Get all users
            const usersRef = collection(db, 'users');
            const usersSnapshot = await getDocs(usersRef);
            console.log("Found users:", usersSnapshot.size); // Debug log
            const results = [];

            // For each user, check their inventory for matching cards
            for (const userDoc of usersSnapshot.docs) {
                const userData = userDoc.data();
                console.log("Checking user:", userData.email); // Debug log
                
                // Skip if user has no inventory or if it's the current user
                if (!userData.inventory || userData.inventory.length === 0 || userDoc.id === auth.currentUser?.uid) {
                    console.log("Skipping user - no inventory or current user"); // Debug log
                    continue;
                }

                const matchingCards = userData.inventory.filter(card => 
                    card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    card.setName.toLowerCase().includes(searchQuery.toLowerCase())
                );

                if (matchingCards.length > 0) {
                    console.log("Found matching cards for user:", matchingCards.length); // Debug log
                    results.push({
                        userId: userDoc.id,
                        userData: userData,
                        cards: matchingCards
                    });
                }
            }

            console.log("Search results:", results.length); // Debug log
            setSearchResults(results);
        } catch (error) {
            console.error('Error searching cards:', error);
            setError('Failed to search cards. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Form submitted"); // Debug log
        searchCards();
    };

    const handleCardClick = (card, user) => {
        setSelectedCard(card);
        setSelectedUser(user);
    };

    const handleTrade = async (targetCard, offeredCards) => {
        try {
            const user = auth.currentUser;
            if (!user) return;

            // Create trade document in trades collection
            const tradeRef = doc(collection(db, 'trades'));
            const tradeData = {
                fromUser: user.uid,
                toUser: selectedUser.userId,
                targetCard: {
                    cardId: targetCard.cardId,
                    name: targetCard.name,
                    image: targetCard.image,
                    setId: targetCard.setId,
                    setName: targetCard.setName,
                    quantity: targetCard.quantity
                },
                offeredCards: offeredCards.map(card => ({
                    cardId: card.cardId,
                    name: card.name,
                    image: card.image,
                    setId: card.setId,
                    setName: card.setName,
                    quantity: card.quantity
                })),
                status: 'pending',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };
            await setDoc(tradeRef, { ...tradeData, id: tradeRef.id });

            // Add trade reference to both users' tradeList array
            const fromUserRef = doc(db, 'users', user.uid);
            const toUserRef = doc(db, 'users', selectedUser.userId);

            // Add new trade ID to existing tradeList array
            await updateDoc(fromUserRef, {
                tradeList: arrayUnion(tradeRef.id)
            });

            await updateDoc(toUserRef, {
                tradeList: arrayUnion(tradeRef.id)
            });

            setSelectedCard(null);
            setSelectedUser(null);
        } catch (error) {
            console.error('Error creating trade:', error);
            alert('Failed to create trade. Please try again.');
        }
    };

    const handleViewProfile = (user) => {
        console.log('Navigating to profile for user:', user);
        console.log('User ID:', user.userId);
        navigate(`/profile/${user.userId}`);
    };

    return (
        <div className="min-h-screen dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">Search Cards</h1>

                {/* Search Form */}
                <form onSubmit={handleSubmit} className="mb-8">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by card name or set..."
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        </div>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Search
                        </button>
                    </div>
                </form>

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center items-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="text-red-500 text-center py-4">{error}</div>
                )}

                {/* Search Results */}
                {!loading && !error && searchResults.length > 0 && (
                    <div className="space-y-6">
                        {searchResults.map((result) => (
                            <div key={result.userId} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                                <div className="flex items-center mb-4">
                                    <img
                                        src={result.userData.photoURL?.startsWith('avatar:') ? 
                                            avatarOptions.find(avatar => avatar.name === result.userData.photoURL.split(':')[1])?.image || Avatar1 :
                                            result.userData.photoURL || Avatar1
                                        }
                                        alt="User profile"
                                        className="w-12 h-12 rounded-full mr-4 object-cover"
                                    />
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                            {result.userData.displayName || result.userData.email}
                                        </h2>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            {result.cards.length} matching card{result.cards.length !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {result.cards.map((card) => (
                                        <div
                                            key={card.cardId}
                                            onClick={() => handleCardClick(card, result)}
                                            className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow duration-200"
                                        >
                                            <img
                                                src={card.image}
                                                alt={card.name}
                                                className="w-full h-auto rounded-lg mb-2"
                                            />
                                            <h3 className="font-medium text-gray-900 dark:text-white">
                                                {card.name}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {card.setName}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Quantity: {card.quantity}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4">
                                    <button
                                        onClick={() => {
                                            console.log('Search result user data:', result);
                                            handleViewProfile({
                                                userId: result.userId,
                                                userData: result.userData
                                            });
                                        }}
                                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                    >
                                        View Profile
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* No Results */}
                {!loading && !error && searchQuery && searchResults.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-gray-600 dark:text-gray-400">
                            No cards found matching "{searchQuery}"
                        </p>
                    </div>
                )}

                {/* Trade Offer Modal */}
                {selectedCard && selectedUser && (
                    <TradeOfferModal
                        isOpen={!!selectedCard}
                        onClose={() => {
                            setSelectedCard(null);
                            setSelectedUser(null);
                        }}
                        targetCard={selectedCard}
                        targetUser={selectedUser}
                        onTrade={handleTrade}
                    />
                )}
            </div>
        </div>
    );
}

export default Search; 