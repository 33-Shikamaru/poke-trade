import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

function Set() {
    const { setId } = useParams();
    const [set, setSet] = useState(null);
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantities, setQuantities] = useState({});
    
    useEffect(() => {
        const fetchSetAndCards = async () => {
            try {
                // Fetch set details
                const setResponse = await fetch(`https://api.pokemontcg.io/v2/sets/${setId}`, {
                    headers: {
                        'X-Api-Key': process.env.REACT_APP_POKEMON_TCG_API_KEY
                    }
                });

                if (!setResponse.ok) {
                    throw new Error('Failed to fetch set details');
                }
                const setData = await setResponse.json();
                setSet(setData.data);

                // Fetch cards in the set
                const cardsResponse = await fetch(`https://api.pokemontcg.io/v2/cards?q=set.id:${setId}`, {
                    headers: {
                        'X-Api-Key': process.env.REACT_APP_POKEMON_TCG_API_KEY
                    }
                });

                if (!cardsResponse.ok) {
                    throw new Error('Failed to fetch cards');
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
        <div className='min-h-screen p-5'>
            <div className='max-w-7xl mx-auto'>
                <div className='flex flex-col md:flex-row gap-8 items-start mb-8'>
                    <img 
                        src={set.images.logo} 
                        alt={`${set.name} logo`}
                        className="w-full md:w-1/3 object-contain bg-gray-100 p-4 rounded-lg"
                    />
                    <div className='flex-1'>
                        <h1 className='text-4xl font-bold pb-5'>{set.name}</h1>
                        <div className='space-y-4'>
                            <p><span className='font-semibold'>Series:</span> {set.series}</p>
                            <p><span className='font-semibold'>Release Date:</span> {set.releaseDate}</p>
                            <p><span className='font-semibold'>Total Cards:</span> {set.total}</p>
                            <p><span className='font-semibold'>Printed Total:</span> {set.printedTotal}</p>
                        </div>
                    </div>
                </div>

                <div className='mt-8'>
                    <h2 className='text-2xl font-bold mb-4'>Cards in this Set</h2>
                    <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'>
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
                                <div className='flex flex-col justify-between items-center'>
                                  <div className="p-3">
                                      <h3 className="font-semibold text-gray-800">{card.name}</h3>
                                      <p className="text-sm text-gray-600">{card.number}/{set.printedTotal}</p>
                                  </div>
                                  <div className='flex items-center justify-center gap-2 p-3'>
                                    <button className='border border-gray-200 px-4 py-2 rounded-md hover:bg-gray-100' onClick={() => updateQuantity(card.id, -1)}>-</button>
                                    <p className='text-gray-800 font-semibold p-0.5 w-8 text-center'>{quantities[card.id] || 0}</p>
                                    <button className='border border-gray-200 px-4 py-2 rounded-md hover:bg-gray-100' onClick={() => updateQuantity(card.id, 1)}>+</button>
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