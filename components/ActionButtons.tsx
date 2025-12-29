import React from 'react';

const ActionButtons: React.FC<{ onGoToComoChegar?: () => void; onGoToHistory?: () => void; onGoToPhotos?: () => void; onGoToEvents?: () => void; onGoToTours?: () => void }> = ({ onGoToComoChegar, onGoToHistory, onGoToPhotos, onGoToEvents, onGoToTours }) => {
  const tiles: Array<{ label: string; image: string; onClick?: () => void }> = [
    { label: 'Como Chegar', image: '/actions/como-chegar.png', onClick: onGoToComoChegar },
    { label: 'Festas & Eventos', image: '/actions/festas-eventos.png', onClick: onGoToEvents },
    { label: 'Nossa História', image: '/actions/nossa-historia.png', onClick: onGoToHistory },
    { label: 'Passeios & Atividades', image: '/actions/passeios-atividades.png', onClick: onGoToTours },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 mb-8">
      {tiles.map((t, i) => (
        <button
          key={i}
          onClick={t.onClick}
          className="relative w-full overflow-hidden rounded-xl shadow-md group focus:outline-none focus:ring-2 focus:ring-cyan-500"
          aria-label={t.label}
        >
          <img src={t.image} alt={t.label} className="w-full h-28 md:h-36 lg:h-40 object-cover" />
          <div className="absolute inset-0 bg-black/35 group-hover:bg-black/40 transition-colors" />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <span className="text-center text-white font-extrabold leading-tight text-xl md:text-2xl drop-shadow">
              {t.label}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
};

export default ActionButtons;
