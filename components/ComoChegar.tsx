import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

type Section = {
  id: string;
  title: string;
  bullets: string[];
  image_url?: string | null;
  images?: string[] | null;
  cta_text?: string | null;
  cta_url?: string | null;
};

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string
);

const ComoChegarCard: React.FC<{ s: Section }> = ({ s }) => {
  const imgs = s.images && Array.isArray(s.images) ? s.images : s.image_url ? [s.image_url] : [];
  const [mainImage, setMainImage] = useState<string | undefined>(imgs[0]);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden mb-10 transition-all duration-300 hover:shadow-2xl hover:scale-[1.01]">
      {/* Cabeçalho */}
      <div className="bg-gradient-to-r from-[#003B63] to-[#0074B7] p-5">
        <h2 className="text-2xl sm:text-3xl font-bold text-white text-center drop-shadow-md">
          {s.title}
        </h2>
      </div>

      {/* Galeria */}
      {imgs.length > 0 && mainImage && (
        <div className="relative">
          <img
            src={mainImage}
            alt={s.title}
            className="w-full h-64 sm:h-80 object-cover"  // 🔹 bordas arredondadas da imagem principal
          />
          {imgs.length > 1 && (
            <div className="flex justify-center flex-wrap gap-2 mt-3 p-3 bg-white">
              {imgs.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setMainImage(img)}
                  className={`rounded-md overflow-hidden border-2 transition-all duration-200 ${
                    mainImage === img ? 'border-[#00A2FF]' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img src={img} alt="" className="w-20 h-20 object-cover rounded-md" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Texto */}
      {s.bullets?.length > 0 && (
        <div className="px-6 py-5">
          <h3 className="font-semibold text-[#003B63] mb-3 text-lg">
            Partindo de Salvador
          </h3>
          <div className="text-gray-700 space-y-3 leading-relaxed">
            {s.bullets.map((b, i) => (
              <p key={i} dangerouslySetInnerHTML={{ __html: b }} />
            ))}
          </div>
        </div>
      )}

      {/* Botão */}
      {s.cta_url && s.cta_text && (
        <div className="bg-gray-50 p-5 flex justify-center">
          <a
            href={s.cta_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-32 py-3 rounded-full bg-gradient-to-r from-[#003B63] to-[#00A2FF] hover:opacity-90 text-white font-semibold text-center shadow-md transition-all duration-300"
          >
            {s.cta_text}
          </a>
        </div>
      )}
    </div>
  );
};

const ComoChegar: React.FC<{ onBack: () => void; onNext: () => void }> = ({ onBack, onNext }) => {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('como_chegar_sections')
        .select('id, title, bullets, image_url, images, cta_text, cta_url')
        .eq('visible', true)
        .order('sort_order', { ascending: true });
      if (!error && Array.isArray(data)) setSections(data as Section[]);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-100">
      {/* Topo fixo */}
      <header className="backdrop-blur-md bg-white/80 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium transition"
          >
            ← Voltar
          </button>
          <h1 className="text-2xl font-extrabold text-[#003B63] tracking-tight">
            Como Chegar
          </h1>
          <button
            onClick={onNext}
            className="px-4 py-2 rounded-full bg-[#003B63] hover:bg-[#00558F] text-white font-semibold transition"
          >
            Próximo →
          </button>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="container mx-auto px-4 pt-8 pb-10">
        {loading ? (
          <div className="text-gray-600 text-center py-10 animate-pulse">
            Carregando informações...
          </div>
        ) : sections.length ? (
          sections.map((s) => <ComoChegarCard key={s.id} s={s} />)
        ) : (
          <div className="text-gray-600 text-center py-10">
            Nenhuma informação disponível no momento.
          </div>
        )}
      </main>
    </div>
  );
};

export default ComoChegar;
