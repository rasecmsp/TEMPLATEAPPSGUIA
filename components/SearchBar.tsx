import React from 'react';

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  setSearchTerm,
  placeholder = 'Buscar por nome ou serviço',
}) => {
  return (
    <div className="relative w-full flex justify-center">
      <div className="relative w-full max-w-[21rem]"> {/* ajuste sutil de largura */}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className="w-full py-2.5 px-5 pr-12 bg-white text-gray-800 placeholder:text-gray-500 rounded-full shadow-md focus:outline-none focus:ring-0 transition-all duration-200"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#003B63] pointer-events-none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </span>
      </div>
    </div>
  );
};

export default SearchBar;
