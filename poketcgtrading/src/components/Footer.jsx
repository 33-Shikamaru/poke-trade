import React from 'react';

function Footer() {
   const currentYear = new Date().getFullYear();
   
   return (
       <footer
           className="mt-auto bg-black text-gray-300 py-6 text-sm border-t border-gray-700">
           <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
               <div
                   className="flex flex-col md:flex-row justify-between items-center mb-4 pb-4 border-b border-gray-700"
               >
                   <p
                       className="text-gray-400 text-center md:text-left mb-2 md:mb-0"
                   >
                       &copy; {currentYear} PGT Development Team (School Project). Assets are property of their respective owners.
                   </p>
                   <nav className="text-center md:text-right">
                       <ul className="flex flex-wrap justify-center md:justify-end space-x-4">
                           <li><a href="/changelog" className="text-white hover:text-gray-300 hover:underline">Changelog</a></li>
                           <li><a href="/privacy" className="text-white hover:text-gray-300 hover:underline">Privacy Policy</a></li>
                           <li><a href="/contact" className="text-white hover:text-gray-300 hover:underline">Contact</a></li>
                           <li><a href="/support" className="text-white hover:text-gray-300 hover:underline">Support Development</a></li>
                           <li><a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-300 hover:underline">Discord Community</a></li>
                       </ul>
                   </nav>
               </div>
               <div className="text-xs text-gray-500 text-center md:text-left mt-4">
                   <p>
                       This website was created for educational purposes as a school project. It is not affiliated with Nintendo, Game Freak, Creatures Inc., Niantic, or The Pokémon Company and is not intended for commercial use. All Pokémon-related trademarks, characters, names, and images are ©1995-{currentYear} Nintendo/Creatures Inc./GAME FREAK Inc. and Niantic Inc., and are used here for demonstration and educational purposes only.
                   </p>
               </div>
           </div>
       </footer>
   );
}
export default Footer;
