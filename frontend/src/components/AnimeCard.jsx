import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { FiStar } from 'react-icons/fi';

const AnimeCard = memo(({ anime }) => {
  // Get the most optimized image size for a thumbnail card
  const getMaxImage = () => {
    const imgs = anime.images;
    // Prefer small webp for thumbnails to drastically improve load time and scrolling lag
    return imgs?.webp?.image_url 
      || imgs?.jpg?.image_url 
      || imgs?.webp?.large_image_url 
      || imgs?.jpg?.large_image_url 
      || 'https://via.placeholder.com/225x318?text=No+Image';
  };

  return (
    <Link to={`/anime/${anime.mal_id}`} className="group relative rounded-xl overflow-hidden glass-card card-hover aspect-[2/3] block">
      {/* Anime Image - Maximum Quality */}
      <img
        src={getMaxImage()}
        alt={anime.title}
        loading="lazy"
        decoding="async"
        className="object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-110"
        style={{ imageRendering: 'high-quality' }}
      />
      
      {/* Overlay Gradient for Text Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-anime-900 via-anime-900/40 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>

      {/* Content */}
      <div className="absolute bottom-0 w-full p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
        <h3 className="font-semibold text-white truncate text-sm mb-1">{anime.title}</h3>
        
        <div className="flex items-center justify-between text-xs text-anime-muted">
          <span className="flex items-center gap-1">
            <FiStar className="text-anime-secondary fill-anime-secondary" /> 
            {anime.score || 'N/A'}
          </span>
          <span className="bg-white/10 px-2 py-0.5 rounded backdrop-blur-sm">
            {anime.type}
          </span>
        </div>
      </div>

      {/* Ep Count Badge */}
      {anime.episodes && (
        <div className="absolute top-2 right-2 bg-anime-primary/90 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg backdrop-blur-md">
          {anime.episodes} EPS
        </div>
      )}
    </Link>
  );
});

export default AnimeCard;
