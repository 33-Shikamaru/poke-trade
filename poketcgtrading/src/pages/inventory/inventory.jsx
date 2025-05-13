import Dropdown from '../../components/Dropdown';

function Inventory() {
  const filters = [
    {
      code: "1",
      name: "Pikachu",
      number: "025",
      rarity: "Common",
      set: "Base Set",
      platform: "TCG",
      image: "https://example.com/pikachu.jpg"
    }];

  return (
    <div className='min-h-screen'>
      <div className='w-full max-w-lg mx-5 my-5'>
        <h1 className='text-4xl font-bold pb-5'>Inventory</h1>
      </div>
      {/* Body Inventory Container */}
      <div className='w-full'>
        <div className='flex flex-row justify-center items-center pb-1 mx-5 gap-5 text-md'>
          <div className='flex flex-row justify-center items-center gap-2'>
            <p>Platform:</p>
            <Dropdown typeFilter="platform" />
          </div>
          <div className='flex flex-row justify-center items-center gap-2'>
            <p>Sort By:</p>
            <Dropdown typeFilter="sort" />
          </div>
          <div className='flex flex-row justify-center items-center gap-2'>
            <p>Filter By:</p>
            <Dropdown typeFilter="filter" />
          </div>
        </div>
        <div className='flex flex-col justify-center items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-2 mx-5'>
          <div className='flex flex-col gap-4'>
            {/* Cards Loaded from Firebase Wish List */}
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'>
              {filters.map((card) => (
                  <div 
                      key={card.code} 
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 dark:bg-gray-400"
                  >
                    <img 
                        src={card.image}
                        alt={card.name}
                        className="w-full h-auto object-contain bg-gray-100 p-2"
                    />
                    <div className='flex flex-col justify-between items-center'>
                      <div className="p-3">
                          <h3 className="font-semibold text-gray-800">Sample</h3>
                          <p className="text-sm text-gray-600">Test</p>
                      </div>
                    </div>
                  </div>
              ))}
            </div>
          </div>
        </div> 
      </div>
    </div>
  )
}

export default Inventory;