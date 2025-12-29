import React from 'react';
import { Business } from '../types';
import BusinessCard from './BusinessCard';

interface BusinessListProps {
  businesses: Business[];
  onBusinessSelect: (business: Business) => void;
  hideTitle?: boolean;
  title?: string;
}

const BusinessList: React.FC<BusinessListProps> = ({ businesses, onBusinessSelect, hideTitle = false, title = 'Estabelecimentos' }) => {
  return (
    <div>
      {!hideTitle && (
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">{title}</h2>
      )}
      {businesses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map(business => (
            <BusinessCard key={business.id} business={business} onSelect={onBusinessSelect} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-500">Nenhum estabelecimento encontrado.</p>
            <p className="text-sm text-gray-400 mt-2">Tente ajustar seus filtros de busca.</p>
        </div>
      )}
    </div>
  );
};

export default BusinessList;
