import { useState } from 'react';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  const isFavorite = (id: string) => favorites.includes(id);

  const toggle = (id: string) => {
    setFavorites((prev) => 
      prev.includes(id) 
        ? prev.filter((f) => f !== id)
        : [...prev, id]
    );
  };

  return { favorites, isFavorite, toggle };
}