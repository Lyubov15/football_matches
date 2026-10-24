import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
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
      setLastUpdated(new Date()); // Сбрасываем время обновления
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
    // Сначала проверяем вкладку (Все/Предстоящие/Завершенные)
    let matchesTab = true;
    if (filter === 'upcoming') matchesTab = m.status === 'scheduled' || m.status === 'live';
    if (filter === 'finished') matchesTab = m.status === 'finished';

    // 2. Затем проверяем поиск (если строка не пустая)
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = query === '' ||
      m.home.name.toLowerCase().includes(query) ||
      m.away.name.toLowerCase().includes(query);

    return matchesTab && matchesSearch;
  });

  // Рендер одной карточки
  const renderItem = ({ item }: { item: Match }) => {
    // Красиво форматируем дату (в часовом поясе устройства)
    const dateStr = item.startsAt
      ? new Date(item.startsAt).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
      : 'Дата неизвестна';

    // Русский статус
    const statusMap: Record<string, string> = {
      finished: 'Завершён',
      live: `В прямом эфире (${item.minute}')`,
      scheduled: 'Запланирован',
      postponed: 'Перенесён',
    };
    const statusText = statusMap[item.status] || item.status;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.date}>{dateStr}</Text>
          <FavoriteButton active={isFavorite(item.id)} onPress={() => toggle(item.id)} />
        </View>

        <Text style={styles.status}>{statusText}</Text>

        <View style={styles.teamsRow}>
          <Text style={styles.teamName}>{item.home.name}</Text>
          <Text style={styles.score}>
            {item.score ? `${item.score.home} : ${item.score.away}` : '- : -'}
          </Text>
          <Text style={styles.teamName}>{item.away.name}</Text>
        </View>
      </View>
    );
  };

  // Экран загрузки
  if (loading && matches.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ef3124" />
        <Text style={styles.loadingText}>Загрузка матчей...</Text>
      </View>
    );
  }

  // Экран ошибки
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={loadMatches}>
          <Text style={styles.retryText}>Повторить</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Матчи тура</Text>

      {/* Панель с фильтрами и обновлением */}
      <View style={styles.toolbar}>
        <View style={styles.filters}>
          {(['all', 'upcoming', 'finished'] as Filter[]).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
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
        style={styles.searchInput}
        placeholder="Поиск по команде..."
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
          <Text style={styles.emptyText}>Матчей не найдено</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
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
  teamName: { fontSize: 16, fontWeight: '600', flex: 1 },
  score: { fontSize: 18, fontWeight: '700', marginHorizontal: 12 },
  loadingText: { marginTop: 12, color: '#6b7280' },
  errorText: { color: '#ef3124', marginBottom: 16, textAlign: 'center' },
  retryButton: { backgroundColor: '#ef3124', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
  emptyText: { textAlign: 'center', color: '#6b7280', marginTop: 24 },
  // Добавили стиль для поиска:
  searchInput: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 14,
  },
});