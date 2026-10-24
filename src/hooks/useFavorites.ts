import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Загружаем избранное при запуске
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setFavorites(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Ошибка загрузки избранного', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadFavorites();
  }, []);

  // Сохраняем при каждом изменении (только после загрузки)
  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(favorites)).catch((e) => 
        console.error('Ошибка сохранения избранного', e)
      );
    }
  }, [favorites, isLoaded]);

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