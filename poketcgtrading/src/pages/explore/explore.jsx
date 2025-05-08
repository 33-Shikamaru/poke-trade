import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

function Explore()  {
  const navigate = useNavigate();
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    //This function will fetch the information of all of the database in the set
    const fetchSets = async () => {
      try {
        const response = await fetch('https://api.pokemontcg.io/v2/sets', {
          headers: {
            'X-Api-Key': process.env.REACT_APP_POKEMON_TCG_API_KEY 
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch sets');
        }
        const data = await response.json();
        setSets(data.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchSets();
  }, []);

  
  return (
    <div className='min-h-screen '>
      <div className='w-full max-w-lg mx-5 my-5'>
        <h1 className='text-4xl font-bold pb-5'>Explore All the Sets of Cards</h1>
      </div>
      <div>
      {loading ? (
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-5">
          {sets.map((set) => (
            <div 
              key={set.id} 
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
              onClick={() => navigate(`/set/${set.id}`)}
            >
              <img 
                src={set.images.logo} 
                alt={`${set.name} logo`}
                className="w-full h-48 object-contain bg-gray-100 p-4"
              />
              <div className="p-4">
                <h2 className="text-xl font-semibold text-gray-800">{set.name}</h2>
                <p className="text-gray-600 mt-2">{set.series}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      </div>
    </div>
  );
}

export default Explore;