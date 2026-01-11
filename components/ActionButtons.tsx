import React from 'react';

const ActionButtons: React.FC<{
  onGoToComoChegar?: () => void;
  onGoToHistory?: () => void;
  onGoToPhotos?: () => void;
  onGoToEvents?: () => void;
  onGoToTours?: () => void;
  pageConfigs?: Record<string, { title: string; cover_url: string; active: boolean; }>;
}> = ({ onGoToComoChegar, onGoToHistory, onGoToPhotos, onGoToEvents, onGoToTours, pageConfigs }) => {
  const defaults = {
    'como-chegar': { title: 'Como Chegar', cover_url: '/actions/como-chegar.png', active: true },
    'events': { title: 'Festas & Eventos', cover_url: '/actions/festas-eventos.png', active: true },
    'history': { title: 'Nossa História', cover_url: '/actions/nossa-historia.png', active: true },
    'tours': { title: 'Passeios & Atividades', cover_url: '/actions/passeios-atividades.png', active: true },
  };

  const getCfg = (slug: 'como-chegar' | 'events' | 'history' | 'tours') => {
    const fromDb = pageConfigs?.[slug];
    return {
      title: fromDb?.title || defaults[slug].title,
      cover_url: fromDb?.cover_url || defaults[slug].cover_url,
      active: fromDb?.active ?? defaults[slug].active
    };
  };

  const tiles = [
    { ...getCfg('como-chegar'), onClick: onGoToComoChegar },
    { ...getCfg('events'), onClick: onGoToEvents },
    { ...getCfg('history'), onClick: onGoToHistory },
    { ...getCfg('tours'), onClick: onGoToTours },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 mb-8">
      {tiles.map((t, i) => t.active && (
        <button
          key={i}
          onClick={t.onClick}
          className="relative w-full overflow-hidden rounded-xl shadow-md group focus:outline-none focus:ring-2 focus:ring-cyan-500"
          aria-label={t.title}
        >
          <img src={t.cover_url} alt={t.title} className="w-full h-28 md:h-36 lg:h-40 object-cover" />
          <div className="absolute inset-0 bg-black/35 group-hover:bg-black/40 transition-colors" />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <span className="text-center text-white font-extrabold leading-tight text-xl md:text-2xl drop-shadow">
              {t.title}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
};

export default ActionButtons;
