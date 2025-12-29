import React, { useState, useEffect, useCallback } from 'react';

type CarouselItem = {
  image_url: string;
  is_ad?: boolean;
  cta_text?: string | null;
  cta_url?: string | null;
};

interface CarouselProps {
  images?: string[];
  items?: CarouselItem[];
}

const Carousel: React.FC<CarouselProps> = ({ images = [], items = [] }) => {
  const slides: CarouselItem[] = items.length
    ? items
    : images.map((url) => ({ image_url: url }));

  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) =>
      prevIndex === slides.length - 1 ? 0 : prevIndex + 1
    );
  }, [slides.length]);

  useEffect(() => {
    const slideInterval = setInterval(nextSlide, 5000);
    return () => clearInterval(slideInterval);
  }, [nextSlide]);

  if (!slides.length) return null;

  return (
    <div className="relative w-full h-64 md:h-96 overflow-hidden rounded-b-[2rem] shadow-lg">
      <div
        className="flex transition-transform duration-700 ease-in-out h-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div key={index} className="w-full flex-shrink-0 h-full relative">
            {slide.is_ad && slide.cta_url ? (
              <a
                href={slide.cta_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full h-full"
              >
                <img
                  src={slide.image_url}
                  alt={slide.cta_text || `Slide ${index + 1}`}
                  className="w-full h-full object-cover rounded-b-[2rem]"
                />
              </a>
            ) : (
              <img
                src={slide.image_url}
                alt={`Slide ${index + 1}`}
                className="w-full h-full object-cover rounded-b-[2rem]"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Carousel;
