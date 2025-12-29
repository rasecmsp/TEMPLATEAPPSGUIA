import React, { useEffect, useMemo, useState } from 'react';
import { Business, Review } from '../types';
// FIX: Removed unused 'LocationIcon' which was causing an import error.
import { ArrowLeftIcon, MapPinIcon, MegaphoneIcon, PhoneIcon, ShareIcon, StarIcon, GlobeIcon } from './Icons';
import BusinessCard from './BusinessCard';
import { createClient } from '@supabase/supabase-js';

interface BusinessDetailProps {
  business: Business;
  onBack: () => void;
  otherBusinesses: Business[];
  onSelectBusiness: (business: Business) => void;
  onAfterReview?: () => void;
  appName?: string;
  whatsappForCTA?: string;
}

const Rating: React.FC<{ rating: number; reviewCount: number }> = ({ rating, reviewCount }) => (
  <div className="flex items-center">
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <StarIcon key={i} filled={i < Math.round(rating)} className={`w-5 h-5 ${i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`} />
      ))}
    </div>
    <span className="ml-2 font-bold text-gray-800">{rating.toFixed(1)}</span>
    <span className="ml-1 text-gray-500">({reviewCount} avaliações)</span>
  </div>
);

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string
);

const ReviewForm: React.FC<{onSubmit: (review: Omit<Review, 'id' | 'date'>) => void}> = ({onSubmit}) => {
    const [name, setName] = useState('');
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(name && rating > 0 && comment) {
            onSubmit({ author: name, rating, comment });
            setName('');
            setRating(0);
            setComment('');
        };
    };

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-xl font-bold text-[#003B63] mb-4">Deixe sua avaliação</h3>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="name" className="block text-base font-medium text-gray-700 mb-1">Seu Nome</label>
                    <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="w-full text-base px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500" placeholder="Ex: João da Silva" required/>
                </div>
                <div className="mb-4">
                    <label className="block text-base font-medium text-gray-700 mb-1">Sua Classificação</label>
                    <div className="flex" onMouseLeave={() => setHoverRating(0)}>
                        {[...Array(5)].map((_, index) => {
                            const starValue = index + 1;
                            return (
                                <button type="button" key={starValue} 
                                    onClick={() => setRating(starValue)}
                                    onMouseEnter={() => setHoverRating(starValue)}
                                    className="focus:outline-none"
                                >
                                <StarIcon 
                                    className={`w-9 h-9 cursor-pointer transition-colors ${starValue <= (hoverRating || rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                                    filled={starValue <= (hoverRating || rating)}
                                />
                                </button>
                            );
                        })}
                    </div>
                </div>
                 <div className="mb-4">
                    <label htmlFor="comment" className="block text-base font-medium text-gray-700 mb-1">Seu Comentário</label>
                    <textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} rows={4} className="w-full text-base px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500" placeholder="Conte-nos sobre sua experiência..." required></textarea>
                </div>
                  <button type="submit" className="w-full bg-[#003B63] text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-cyan-400 transition-colors duration-300 flex items-center justify-center gap-2">
                    Enviar Avaliação
                  </button>
            </form>
        </div>
    );
};

const BusinessDetail: React.FC<BusinessDetailProps> = ({ business, onBack, otherBusinesses, onSelectBusiness, onAfterReview, appName = 'Guia Boipeba', whatsappForCTA }) => {
  const [mainImage, setMainImage] = useState(business.images[0]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [errorReviews, setErrorReviews] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);
  

  const fetchReviews = async () => {
    setLoadingReviews(true);
    setErrorReviews(null);
    const { data, error } = await supabase
      .from('reviews')
      .select('id, author, rating, comment, created_at')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false });
    if (error) {
      setErrorReviews(error.message);
    } else {
      const mapped: Review[] = (data || []).map((r: any) => ({
        id: r.id,
        author: r.author,
        rating: Number(r.rating) || 0,
        comment: r.comment || '',
        date: new Date(r.created_at).toLocaleDateString('pt-BR'),
      }));
      setReviews(mapped);
    }
    setLoadingReviews(false);
  };

  useEffect(() => {
    void fetchReviews();
  }, [business.id]);

  const handleAddReview = (newReview: Omit<Review, 'id' | 'date'>) => {
    void (async () => {
      // Garante que estamos avaliando uma empresa com ID UUID do banco
      const idStr = String(business.id);
      const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(idStr);
      if (!isUuid) {
        setErrorReviews('Esta empresa não está sincronizada com o banco. Abra a empresa a partir da lista principal para avaliar.');
        return;
      }

      // Insere a avaliação
      const { error: insErr } = await supabase.from('reviews').insert({
        business_id: idStr,
        author: newReview.author,
        rating: newReview.rating,
        comment: newReview.comment,
      });
      if (insErr) {
        setErrorReviews(insErr.message);
        return;
      }

      await fetchReviews();
      // avisa o App para atualizar a lista pública (média/contagem na Home)
      if (onAfterReview) onAfterReview();
    })();
  };

  const computedAvg = useMemo(() => {
    if (!reviews.length) return business.rating || 0;
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return Number((sum / reviews.length).toFixed(1));
  }, [reviews, business.rating]);
  const computedCount = reviews.length || business.reviewCount || 0;
  const shareUrl = `${window.location.origin}${window.location.pathname}?business=${encodeURIComponent(String(business.id))}`;
const shareMsg = `${appName}\n${business.name}\nConheça mais detalhes:\n${shareUrl}`;

  const handleShare = async () => {
    const shareData = {
      title: appName,
      text: `${business.name} - Conheça mais detalhes`,
      url: shareUrl,
    };

    try {
      if ((navigator as any).share) {
        await (navigator as any).share(shareData);
      } else {
        setShowShare((s) => !s);
      }
    } catch {
    }
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4">
        <button onClick={onBack} className="px-4 py-1.5 rounded-full bg-[#003B63] text-white text-sm font-semibold mb-4">Voltar</button>

        {/* Image Gallery */}
        <div className="relative mb-6">
            <img src={mainImage} alt={business.name} className="w-full h-64 sm:h-80 object-cover rounded-lg shadow-lg" />

            {/* Bolinha de logomarca (alinhada ao topo direito da imagem) */}
            <div className="absolute -top-12 right-4 w-24 h-24 bg-white rounded-full border-2 border-gray-200 shadow-lg flex items-center justify-center overflow-hidden">
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

            <div className="flex space-x-2 mt-2">
                {business.images.map((img, index) => (
                    <button key={index} onClick={() => setMainImage(img)} className={`focus:outline-none rounded-md overflow-hidden ${mainImage === img ? 'ring-2 ring-orange-500' : ''}`}>
                        <img src={img} alt={`${business.name} thumbnail ${index + 1}`} className="w-20 h-20 object-cover"/>
                    </button>
                ))}
            </div>
        </div>

        {/* Business Info */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6">
            <div className="mb-2">
              <Rating rating={computedAvg} reviewCount={computedCount} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#003B63]">{business.name}</h1>
            
            {business.isPremium && (
                 <div className="mt-2 inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 text-sm font-medium border border-yellow-300 px-2.5 py-0.5 rounded-md">
                    <StarIcon className="w-4 h-4" filled/> Premium
                </div>
            )}
            
            <div className="mt-3 mb-4">
            </div>

            <p className="text-gray-600 leading-relaxed mb-4">{business.description}</p>

            {Array.isArray(business.tags) && business.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {business.tags.map(tag => (
                  <span key={tag} className="text-sm text-gray-700 px-2 py-1 rounded-md border border-gray-300 bg-white">{tag}</span>
                ))}
              </div>
            )}

            <div className="space-y-4 text-gray-700">
                {business.address?.trim() && (
                  <div className="flex items-start">
                    <MapPinIcon />
                    <div className="ml-3">
                      <h4 className="font-semibold">Endereço</h4>
                      <p>{business.address}</p>
                    </div>
                  </div>
                )}
                {business.phone?.trim() && (
                  <div className="flex items-start">
                    <PhoneIcon className="w-5 h-5 mt-0.5"/>
                    <div className="ml-4">
                      <h4 className="font-semibold">Contato</h4>
                      <p>{business.phone}</p>
                    </div>
                  </div>
                )}
                {business.website?.trim() && (
                  <div className="flex items-start">
                    <GlobeIcon />
                    <div className="ml-3">
                      <h4 className="font-semibold">Site</h4>
                      <p className="mt-1">
                        <a
                          href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-600 font-semibold hover:underline"
                        >
                          {business.website.replace(/^https?:\/\//, '')}
                        </a>
                      </p>
                    </div>
                  </div>
                )}
            </div>

            {business.whatsapp?.trim() && (
              <a href={`https://wa.me/${business.whatsapp}`} target="_blank" rel="noopener noreferrer" className="mt-6 w-full bg-[#003B63] text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-cyan-400 transition-colors duration-300 flex items-center justify-center gap-2">
                Fazer Reserva
              </a>
            )}
            
            {(business.instagram?.trim() || business.whatsapp?.trim() || business.tripadvisor?.trim()) && (
              <div className="flex justify-between items-center mt-6 pt-4 border-t">
                 <div className="flex items-center space-x-3">
                    <span className="text-base font-semibold text-[#003B63]">Redes Sociais:</span>
                    {business.instagram?.trim() && (
                      <a href={`https://instagram.com/${business.instagram}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:opacity-90"><img src="https://img.icons8.com/fluency/96/instagram-new.png" alt="Instagram" className="w-7 h-7" /></a>
                    )}
                    {business.whatsapp?.trim() && (
                      <a href={`https://wa.me/${business.whatsapp}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-green-600"><img src="https://img.icons8.com/color/96/whatsapp--v1.png" alt="WhatsApp" className="w-7 h-7" /></a>
                    )}
                    {business.tripadvisor?.trim() && (
                      <a
                        href={business.tripadvisor.startsWith('http') ? business.tripadvisor : `https://${business.tripadvisor}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:opacity-90"
                        title="TripAdvisor"
                      >
                        <img src="https://img.icons8.com/external-tal-revivo-color-tal-revivo/96/external-tripadvisor-the-ultimate-travel-companion-travel-planning-tool-logo-color-tal-revivo.png" alt="TripAdvisor" className="w-7 h-7" />
                      </a>
                    )}
                </div>
                <div className="relative">
                  <button onClick={handleShare} className="flex items-center gap-2 text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors">
                      <ShareIcon className="w-4 h-4"/> Compartilhar
                  </button>
                  {showShare && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10">
                      <div className="text-xs font-semibold text-gray-600 mb-2">Compartilhar em</div>
                      <div className="flex flex-col gap-2">
                        <a href={`https://wa.me/?text=${encodeURIComponent(shareMsg)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#25D366] hover:underline">
                          <img src="https://img.icons8.com/color/48/whatsapp--v1.png" className="w-5 h-5"/> WhatsApp
                        </a>
                        <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#1877F2] hover:underline">
                          <img src="https://img.icons8.com/fluency/48/facebook-new.png" className="w-5 h-5"/> Facebook
                        </a>
                        <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(appName + ' - ' + business.name + ' | Conheça mais detalhes')}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#1DA1F2] hover:underline">
                          <img src="https://img.icons8.com/color/48/twitter--v1.png" className="w-5 h-5"/> X (Twitter)
                        </a>
                        <a href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(appName + '\n' + business.name + '\nConheça mais detalhes:')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#0088cc] hover:underline">
                          <img src="https://img.icons8.com/color/48/telegram-app.png" className="w-5 h-5"/> Telegram
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Rest of the code remains the same */}
            <div className="mt-8">
                <ReviewForm onSubmit={handleAddReview} />
                {loadingReviews && <p className="text-sm text-gray-500">Carregando avaliações...</p>}
                {errorReviews && <p className="text-sm text-red-600">{errorReviews}</p>}
                <div className="mt-4 space-y-3">
                    {reviews.map(review => (
                        <div key={review.id} className="bg-white p-4 rounded-lg shadow-sm border">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-gray-900">{review.author}</h4>
                                    <div className="flex items-center mt-1">
                                        {[...Array(5)].map((_, i) => (
                                            <StarIcon key={i} filled={i < review.rating} className={`w-5 h-5 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`} />
                                        ))}
                                    </div>
                                </div>
                                <span className="text-xs text-gray-500">{review.date}</span>
                            </div>
                            <p className="mt-2 text-gray-600">{review.comment}</p>
                        </div>
                    ))}
                </div>
            </div>
            </div>


        {/* Conheça também */}
        <div className="bg-cyan-50/50 p-4 sm:p-6 rounded-lg mb-6">
             <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Conheça também!</h2>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {otherBusinesses.map(b => (
                     <BusinessCard key={b.id} business={b} onSelect={onSelectBusiness} />
                 ))}
             </div>
        </div>
        
        {/* Destaque */}
        <div className="bg-[#003B63] text-center p-6 rounded-lg">
            <div className="flex justify-center mb-2">
                <MegaphoneIcon className="w-8 h-8 text-white"/>
            </div>
            <h3 className="text-xl font-bold text-white">Destaque seu negócio!</h3>
            <p className="text-white mt-1 mb-4">Faça parte do guia mais completo de Boipeba. Torne-se Premium!</p>
            <a
              href={whatsappForCTA ? `https://wa.me/${whatsappForCTA}` : 'https://wa.me/${whatsappForCTA'}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-[#003B63] font-bold py-2 px-6 rounded-lg shadow-md hover:bg-orange-600 transition-colors"
            >
                Saiba Mais
            </a>
        </div>
    </div>
  );
};

export default BusinessDetail;