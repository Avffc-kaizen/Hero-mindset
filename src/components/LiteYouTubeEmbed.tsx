import React, { useState } from 'react';
import { Play } from 'lucide-react';

const LiteYouTubeEmbed: React.FC<{ videoId: string; title: string }> = ({ videoId, title }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="absolute inset-0 w-full h-full bg-black group cursor-pointer overflow-hidden rounded-xl">
      {!isLoaded ? (
        <button onClick={() => setIsLoaded(true)} className="w-full h-full" aria-label={`Play video: ${title}`}>
            <img 
              src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
              alt={title} 
              className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity" 
            />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="w-20 h-20 bg-red-600/80 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/20 group-hover:bg-red-500 transition-colors">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
          </div>
        </button>
      ) : (
        <iframe 
            width="100%" 
            height="100%" 
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`} 
            title={title} 
            allow="autoplay; encrypted-media; fullscreen" 
            allowFullScreen 
            className="w-full h-full" 
        />
      )}
    </div>
  );
};

export default LiteYouTubeEmbed;