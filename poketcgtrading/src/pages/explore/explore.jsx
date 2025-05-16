import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";

function Explore() {
  const navigate = useNavigate();
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    //This function will fetch the information of all of the database in the set
    const fetchSets = async () => {
      try {
        const response = await fetch("https://api.pokemontcg.io/v2/sets", {
          headers: {
            "X-Api-Key": process.env.REACT_APP_POKEMON_TCG_API_KEY,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch sets");
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
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            Explore All the Sets of Cards
          </h1>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 dark:bg-gray-800">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 dark:text-gray-100">How the App Works:</h2>
          <ol className="list-decimal pl-5 space-y-2 text-gray-600 dark:text-gray-300">
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
          <div className="text-red-500 text-center py-12">{error}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sets.map((set) => (
              <div
                key={set.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 cursor-pointer dark:bg-gray-600 dark:text-gray-300"
                onClick={() => navigate(`/set/${set.id}`)}
              >
                <div className="aspect-w-16 aspect-h-9 bg-gray-100 dark:bg-gray-400">
                  <img
                    src={set.images.logo}
                    alt={`${set.name} logo`}
                    className="w-full h-48 object-contain p-4"
                  />
                </div>
                <div className="p-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {set.name}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{set.series}</p>
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
