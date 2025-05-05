import React from 'react';
import './Footer.css';


/**
* Footer component for the Pokémon Trading application.
* Displays copyright information, relevant links, and a disclaimer.
*/
function Footer() {
 const currentYear = new Date().getFullYear();


 return (
   <footer className="app-footer"> {/* Use className for CSS targeting in React */}
     {/* Container div for centering content and managing padding */}
     <div className="footer-content">
       {/* Top section with copyright and links */}
       <div className="footer-top-section">
         {/* Copyright notice - Update 'TCP' if your site name is different */}
         <p className="footer-copyright">&copy; {currentYear} TCP. All rights reserved by their respective owners.</p>


         {/* Footer navigation - Links from the example image */}
         <nav className="footer-nav">
           <ul>
             <li><a href="/changelog">Changelog</a></li>
             <li><a href="/privacy">Privacy Policy</a></li>
             <li><a href="/contact">Contact</a></li>
             <li><a href="/support">Support Development</a></li>
             <li><a href="https://discord.com" target="_blank" rel="noopener noreferrer">Discord Community</a></li> {/* Example external link */}
             {/* Add more links as needed */}
           </ul>
         </nav>
       </div>


       {/* Disclaimer section */}
       <div className="footer-disclaimer">
         <p>
         This website was created for educational purposes as a school project. It is not affiliated with Nintendo, Game Freak, Creatures Inc., or The Pokémon Company and is not intended for commercial use. All Pokémon-related trademarks, characters, names, and images are ©1995-{currentYear} Nintendo/Creatures Inc./GAME FREAK Inc. and Niantic Inc., and are used here for demonstration and educational purposes only.
         </p>
       </div>
     </div>
   </footer>
 );
}




export default Footer;