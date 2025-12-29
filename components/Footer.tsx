import React from 'react';
import { AnnounceIcon, GuideIcon, InfoIcon, PhoneBookIcon } from './Icons';

const Footer: React.FC<{ onGuide?: () => void; onAnuncie?: () => void; onUseful?: () => void; onPhones?: () => void }> = ({ onGuide, onAnuncie, onUseful, onPhones }) => {
    const navItems = [
        { label: 'Guia', icon: <GuideIcon />, active: true },
        { label: 'Info Úteis', icon: <InfoIcon /> },
        { label: 'Telefones', icon: <PhoneBookIcon /> },
        { label: 'Anuncie', icon: <AnnounceIcon /> },
    ];

    return (
        <footer className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.1)] z-50 border-t border-gray-200">
            <div className="container mx-auto px-4 grid grid-cols-4">
                {navItems.map(item => {
                    const isGuide = item.label === 'Guia';
                    const isAnuncie = item.label === 'Anuncie';
                    const isUseful = item.label === 'Info Úteis';
                    const isPhones = item.label === 'Telefones';
                    return (
                        <button 
                            key={item.label} 
                            className={`flex flex-col items-center justify-center py-2 text-xs font-medium transition-colors duration-300 ${
                                item.active ? 'text-cyan-600' : 'text-gray-500 hover:text-cyan-500'
                            }`}
                            onClick={isGuide ? onGuide : isAnuncie ? onAnuncie : isUseful ? onUseful : isPhones ? onPhones : undefined}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </footer>
    );
};

export default Footer;
