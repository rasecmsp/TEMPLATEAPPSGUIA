
import React from 'react';

interface HeaderProps {
  onHomeClick?: () => void;
  appName?: string;
}

const Header: React.FC<HeaderProps> = ({ onHomeClick, appName = 'Guia Boipeba' }) => {
  return (
    <header className="text-white shadow-lg sticky top-0 z-50" style={{ backgroundColor: '#003B63' }}>
      <div className="container mx-auto px-4 py-3 flex items-center justify-center">
        <h1
          className="text-xl font-bold tracking-tight cursor-pointer select-none text-center"
          onClick={onHomeClick}
        >
          <span className="inline-flex items-center gap-2">
            <img
              src="https://img.icons8.com/glyph-neue/64/palm-tree.png"
              alt="Palm tree"
              className="w-6 h-6"
              style={{ filter: 'invert(1)' }}
            />
            {appName}
          </span>
        </h1>
      </div>
    </header>
  );
};

export default Header;
