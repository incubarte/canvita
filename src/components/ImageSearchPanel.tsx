import { useState } from 'react';

interface ImageSearchPanelProps {
  onImageSelect: (imageUrl: string) => void;
}

interface PexelsPhoto {
  id: number;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
  };
  photographer: string;
  alt: string;
}

export const ImageSearchPanel = ({ onImageSelect }: ImageSearchPanelProps) => {
  const [query, setQuery] = useState('');
  const [images, setImages] = useState<PexelsPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener API key de variable de entorno o usar una temporal
  const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY || 'YOUR_API_KEY_HERE';

  const searchImages = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=20`,
        {
          headers: {
            Authorization: PEXELS_API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Error al buscar imágenes');
      }

      const data = await response.json();
      setImages(data.photos || []);
    } catch (err) {
      setError('Error al buscar imágenes. Por favor intenta de nuevo.');
      console.error('Error searching images:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      searchImages();
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Barra de búsqueda */}
      <div className="p-4 border-b border-white/10">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Buscar imágenes..."
            className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-purple-300/40 focus:outline-none focus:border-purple-400/50 focus:bg-white/10 transition-all"
          />
          <button
            onClick={searchImages}
            disabled={loading || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-400 border-t-transparent"></div>
          </div>
        )}

        {!loading && images.length === 0 && query && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-purple-300/20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-purple-300/60 text-sm">No se encontraron imágenes</p>
          </div>
        )}

        {!loading && images.length === 0 && !query && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-purple-300/20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-purple-300/60 text-sm">Busca imágenes para insertar</p>
          </div>
        )}

        {!loading && images.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {images.map((image) => (
              <button
                key={image.id}
                onClick={() => onImageSelect(image.src.large)}
                className="group relative aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10 hover:border-purple-400/50 transition-all"
              >
                <img
                  src={image.src.medium}
                  alt={image.alt}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="text-xs text-white/80 truncate">
                      {image.photographer}
                    </p>
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer con atribución */}
      {images.length > 0 && (
        <div className="p-3 border-t border-white/10">
          <p className="text-xs text-purple-300/40 text-center">
            Imágenes de{' '}
            <a
              href="https://www.pexels.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              Pexels
            </a>
          </p>
        </div>
      )}
    </div>
  );
};
