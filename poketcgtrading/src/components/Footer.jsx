// src/Footer.jsx
import React from 'react';

/**
 * Footer component for the Pokémon Trading application using Tailwind CSS.
 * Displays copyright information, relevant links, and a disclaimer.
 * Links are placeholders and do not navigate.
 */
function Footer() {
    // Get the current year dynamically for the copyright notice
    const currentYear = new Date().getFullYear();

    return (
        // Footer element with Tailwind classes
        // mt-auto: Pushes footer down in a flex column layout (applied to parent .App)
        // bg-black: Black background
        // text-gray-300: Light grey text color
        // py-6: Vertical padding (adjust as needed, py-6 is 1.5rem)
        // text-sm: Smaller font size (0.875rem)
        // border-t border-gray-700: Subtle dark grey top border
        <footer
            className="mt-auto bg-black text-gray-300 py-6 text-sm border-t border-gray-700"
        >
            {/* Container div for centering content and managing padding */}
            {/* max-w-4xl: Limits content width (adjust as needed, e.g., max-w-5xl) */}
            {/* mx-auto: Centers the container horizontally */}
            {/* px-4 sm:px-6 lg:px-8: Horizontal padding, responsive */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Top section with copyright and links */}
                {/* flex: Use flexbox */}
                {/* flex-col md:flex-row: Stack vertically on small screens, row on medium+ */}
                {/* justify-between: Space out items */}
                {/* items-center: Center items vertically */}
                {/* mb-4 pb-4: Bottom margin and padding */}
                {/* border-b border-gray-700: Separator line */}
                <div
                    className="flex flex-col md:flex-row justify-between items-center mb-4 pb-4 border-b border-gray-700"
                >
                    {/* Copyright notice */}
                    {/* text-gray-400: Slightly lighter grey */}
                    {/* text-center md:text-left: Center text on small screens, left on medium+ */}
                    {/* mb-2 md:mb-0: Bottom margin on small screens */}
                    <p
                        className="text-gray-400 text-center md:text-left mb-2 md:mb-0"
                    >
                        &copy; {currentYear} PGT Development Team (School Project). Assets are property of their respective owners.
                    </p>

                    {/* Footer navigation */}
                    {/* text-center md:text-right: Center text on small screens, right on medium+ */}
                    <nav className="text-center md:text-right">
                        {/* Use flex and wrap for link layout */}
                        <ul className="flex flex-wrap justify-center md:justify-end space-x-4">
                            {/* Navigation links - Changed href to "#" to prevent navigation */}
                            <li><a href="#" className="text-white hover:text-gray-300 hover:underline">Changelog</a></li>
                            <li><a href="#" className="text-white hover:text-gray-300 hover:underline">Privacy Policy</a></li>
                            <li><a href="#" className="text-white hover:text-gray-300 hover:underline">Contact</a></li>
                            <li><a href="#" className="text-white hover:text-gray-300 hover:underline">Support Development</a></li>
                            {/* External links like Discord should keep their original href */}
                            <li><a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-300 hover:underline">Discord Community</a></li>
                        </ul>
                    </nav>
                </div>

                {/* Disclaimer section */}
                {/* text-xs: Even smaller text size (0.75rem) */}
                {/* text-gray-500: Medium grey text */}
                {/* text-center md:text-left: Center on small screens, left on medium+ */}
                {/* mt-4: Margin top */}
                <div className="text-xs text-gray-500 text-center md:text-left mt-4">
                    <p>
                        This website was created for educational purposes as a school project. It is not affiliated with Nintendo, Game Freak, Creatures Inc., Niantic, or The Pokémon Company and is not intended for commercial use. All Pokémon-related trademarks, characters, names, and images are ©1995-{currentYear} Nintendo/Creatures Inc./GAME FREAK Inc. and Niantic Inc., and are used here for demonstration and educational purposes only.
                    </p>
                </div>
            </div>
        </footer>
    );
}

// Export the component for use in other parts of the app
export default Footer;
