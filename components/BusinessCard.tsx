import React from 'react';
import { Business } from '../types';
import { StarIcon } from './Icons';

interface BusinessCardProps {
  business: Business;
  onSelect: (business: Business) => void;
}

const BusinessCard: React.FC<BusinessCardProps> = ({ business, onSelect }) => {
  const safeRating = Number.isFinite(business.rating) ? business.rating : 0;
  const safeReviewCount = Number.isFinite(business.reviewCount) ? business.reviewCount : 0;

  return (
    <button onClick={() => onSelect(business)} className="w-full text-left bg-white rounded-xl shadow-md overflow-hidden transform hover:scale-105 transition-transform duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
      <div className="relative">
        <img className="h-56 w-full object-cover" src={business.images[0]} alt={business.name} />
        {business.isPremium && (
          <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full uppercase">
            Premium
          </div>
        )}
        {/* Área circular para logomarca */}
        <div className="absolute top-44 right-4 w-24 h-24 bg-white rounded-full border-2 border-gray-200 shadow-lg flex items-center justify-center overflow-hidden">
          {business.logo ? (
            <img 
              src={business.logo} 
              alt={`Logo ${business.name}`} 
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
      </div>
      <div className="p-6">
        <div className="flex flex-wrap items-center gap-3 mb-1">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-white text-cyan-700 border border-cyan-700">{business.category}</span>
        </div>
        <h3 className="block mt-1 text-2xl leading-tight font-extrabold text-cyan-700">{business.name}</h3>
        <p className="mt-2 text-gray-500 text-sm truncate">{business.description}</p>
        <div className="flex items-center mt-3">
          <StarIcon filled className="text-yellow-500" />
          <span className="text-cyan-700 font-bold ml-1">{safeRating.toFixed(1)}</span>
          <span className="text-gray-500 text-sm ml-2">({safeReviewCount} avaliações)</span>
        </div>
      </div>
    </button>
  );
};

export default BusinessCard;
