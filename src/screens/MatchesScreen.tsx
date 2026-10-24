import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MATCHES_URL } from '../config';
import { Match, MatchesResponse } from '../types';
import { FavoriteButton } from '../components/FavoriteButton';
import { useFavorites } from '../hooks/useFavorites';
import { UpdatedAgo } from '../components/UpdatedAgo';

// Фильтры
type Filter = 'all' | 'upcoming' | 'finished';

export function MatchesScreen() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Подключаем хуки из части 2
  const { isFavorite, toggle } = useFavorites();

  // Функция загрузки данных
  const loadMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(MATCHES_URL);
      if (!response.ok) throw new Error('Ошибка сети');
      const data: MatchesResponse = await response.json();
      setMatches(data.matches);
      setLastUpdated(new Date()); 
    } catch (e) {
      setError('Не удалось загрузить матчи. Проверьте интернет.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Загружаем при старте
  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  // Фильтрация
  const filteredMatches = matches.filter((m) => {
    let matchesTab = true;
    if (filter === 'upcoming') matchesTab = m.status === 'scheduled' || m.status === 'live';
    if (filter === 'finished') matchesTab = m.status === 'finished';

    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = query === '' ||
      m.home.name.toLowerCase().includes(query) ||
      m.away.name.toLowerCase().includes(query);

    return matchesTab && matchesSearch;
  });

  // Рендер одной карточки
  const renderItem = ({ item }: { item: Match }) => {
    const dateStr = item.startsAt
      ? new Date(item.startsAt).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
      : 'Дата неизвестна';

    const statusMap: Record<string, string> = {
      finished: 'Завершён',
      live: `В прямом эфире (${item.minute}')`,
      scheduled: 'Запланирован',
      postponed: 'Перенесён',
    };
    const statusText = statusMap[item.status] || item.status;

    return (
      <View style={[styles.card, isDarkMode && styles.darkCard]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.date, isDarkMode && styles.darkSubText]}>{dateStr}</Text>
          <FavoriteButton active={isFavorite(item.id)} onPress={() => toggle(item.id)} />
        </View>

        <Text style={styles.status}>{statusText}</Text>

        <View style={styles.teamsRow}>
          <Text style={[styles.teamName, isDarkMode && styles.darkText]}>{item.home.name}</Text>
          <Text style={[styles.score, isDarkMode && styles.darkText]}>
            {item.score ? `${item.score.home} : ${item.score.away}` : '- : -'}
          </Text>
          <Text style={[styles.teamName, isDarkMode && styles.darkText]}>{item.away.name}</Text>
        </View>
      </View>
    );
  };

  // Экран загрузки
  if (loading && matches.length === 0) {
    return (
      <View style={[styles.center, isDarkMode && styles.darkContainer]}>
        <ActivityIndicator size="large" color="#ef3124" />
        <Text style={[styles.loadingText, isDarkMode && styles.darkSubText]}>Загрузка матчей...</Text>
      </View>
    );
  }

  // Экран ошибки
  if (error) {
    return (
      <View style={[styles.center, isDarkMode && styles.darkContainer]}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={loadMatches}>
          <Text style={styles.retryText}>Повторить</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, isDarkMode && styles.darkText]}>Матчи тура</Text>
        <Switch
          value={isDarkMode}
          onValueChange={setIsDarkMode}
          trackColor={{ false: '#767577', true: '#ef3124' }}
          thumbColor={'#f4f3f4'}
        />
      </View>

      {/* Панель с фильтрами и обновлением */}
      <View style={styles.toolbar}>
        <View style={styles.filters}>
          {(['all', 'upcoming', 'finished'] as Filter[]).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterBtn, filter === f && styles.filterBtnActive, isDarkMode && filter !== f && styles.darkFilterBtn]}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive, isDarkMode && filter !== f && styles.darkSubText]}>
                {f === 'all' ? 'Все' : f === 'upcoming' ? 'Предстоящие' : 'Завершённые'}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={loadMatches}>
          <Text style={styles.refreshBtn}>Обновить</Text>
        </Pressable>
      </View>

      {/* Поле поиска */}
      <TextInput
        style={[styles.searchInput, isDarkMode && styles.darkSearchInput]}
        placeholder="Поиск по команде..."
        placeholderTextColor={isDarkMode ? '#9ca3af' : '#6b7280'}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Таймер обновления */}
      <UpdatedAgo since={lastUpdated} />

      {/* Список матчей */}
      <FlatList
        data={filteredMatches}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={[styles.emptyText, isDarkMode && styles.darkSubText]}>Матчей не найдено</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827' },
  toolbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  filters: { flexDirection: 'row', gap: 8 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#f3f4f6' },
  filterBtnActive: { backgroundColor: '#ef3124' },
  filterText: { fontSize: 14, color: '#374151' },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  refreshBtn: { color: '#2563eb', fontSize: 14, fontWeight: '600' },
  list: { paddingBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  date: { fontSize: 13, color: '#6b7280' },
  status: { fontSize: 12, color: '#ef3124', fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' },
  teamsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  teamName: { fontSize: 16, fontWeight: '600', flex: 1, color: '#111827' },
  score: { fontSize: 18, fontWeight: '700', marginHorizontal: 12, color: '#111827' },
  loadingText: { marginTop: 12, color: '#6b7280' },
  errorText: { color: '#ef3124', marginBottom: 16, textAlign: 'center' },
  retryButton: { backgroundColor: '#ef3124', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
  emptyText: { textAlign: 'center', color: '#6b7280', marginTop: 24 },
  searchInput: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 14,
    color: '#111827',
  },
  // --- Стили для темной темы ---
  darkContainer: { backgroundColor: '#111827' },
  darkText: { color: '#f9fafb' },
  darkSubText: { color: '#9ca3af' },
  darkCard: { backgroundColor: '#1f2937', borderColor: '#374151' },
  darkSearchInput: { backgroundColor: '#374151', color: '#f9fafb' },
  darkFilterBtn: { backgroundColor: '#374151' },
});