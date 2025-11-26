// ====== src/screens/profile/NotificationsCenterScreen.js ======
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useSelector } from 'react-redux';
import { NotificationsApi } from '../../services/api';
import { DIMENSIONS } from '../../styles/theme';

// Thème Dark
const THEME = {
  BG: '#0F172A',
  SURFACE: '#1E293B',
  ACCENT: '#22C55E',
  TEXT: '#F8FAFC',
  TEXT_SEC: '#94A3B8',
  BORDER: '#334155',
  UNREAD_BG: 'rgba(34, 197, 94, 0.1)',
};

const NotificationItem = ({ item, onPress }) => {
  const getIcon = type => {
    switch (type) {
      case 'match_invite':
        return { name: 'calendar', color: '#3B82F6' };
      case 'team_invite':
        return { name: 'shield', color: '#8B5CF6' };
      case 'friend_request':
        return { name: 'user-plus', color: '#F59E0B' };
      default:
        return { name: 'bell', color: THEME.TEXT_SEC };
    }
  };

  const iconConfig = getIcon(item.type);

  return (
    <TouchableOpacity
      style={[styles.item, !item.read && styles.unreadItem]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: `${iconConfig.color}20` },
          ]}
        >
          <Icon name={iconConfig.name} size={20} color={iconConfig.color} />
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.message} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.time}>{item.timeAgo}</Text>
      </View>

      <Icon name="chevron-right" size={20} color={THEME.BORDER} />
    </TouchableOpacity>
  );
};

export const NotificationsCenterScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      // Simulation API
      setTimeout(() => {
        setNotifications([
          {
            id: '1',
            type: 'match_invite',
            title: 'Match ce soir',
            message: 'Les Lions vous invitent au match vs Tigres.',
            timeAgo: '2m',
            read: false,
          },
          {
            id: '2',
            type: 'friend_request',
            title: 'Nouvel ami',
            message: 'Alex souhaite vous ajouter.',
            timeAgo: '1h',
            read: true,
          },
          {
            id: '3',
            type: 'team_invite',
            title: 'Recrutement',
            message: 'Le FC Paris recrute un gardien.',
            timeAgo: '1j',
            read: true,
          },
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const handlePress = item => {
    // Marquer comme lu
    setNotifications(prev =>
      prev.map(n => (n.id === item.id ? { ...n, read: true } : n)),
    );
    // Navigation selon le type
    if (item.type === 'match_invite')
      navigation.navigate('Matches', {
        screen: 'MatchDetail',
        params: { id: item.targetId },
      });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.BG} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Icon name="arrow-left" size={24} color={THEME.TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity
          onPress={() =>
            setNotifications(prev => prev.map(n => ({ ...n, read: true })))
          }
        >
          <Icon name="check-circle" size={22} color={THEME.ACCENT} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={THEME.ACCENT} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <NotificationItem item={item} onPress={handlePress} />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="bell-off" size={48} color={THEME.TEXT_SEC} />
              <Text style={styles.emptyText}>Aucune notification</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.BG },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: THEME.BORDER,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.TEXT },
  backBtn: { padding: 4 },
  list: { padding: 20 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.SURFACE,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.BORDER,
  },
  unreadItem: {
    borderColor: THEME.ACCENT,
    backgroundColor: `${THEME.ACCENT}05`,
  },
  iconContainer: { marginRight: 16, position: 'relative' },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: THEME.ACCENT,
    borderWidth: 2,
    borderColor: THEME.SURFACE,
  },
  content: { flex: 1 },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: THEME.TEXT,
    marginBottom: 4,
  },
  message: { fontSize: 14, color: THEME.TEXT_SEC, marginBottom: 6 },
  time: { fontSize: 12, color: THEME.ACCENT, fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: THEME.TEXT_SEC, marginTop: 16, fontSize: 16 },
});
