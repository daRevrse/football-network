// ====== src/screens/teams/TeamMembersScreen.js ======
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { teamsApi } from '../../services/api';

const THEME = {
  BG: '#0F172A',
  SURFACE: '#1E293B',
  TEXT: '#F8FAFC',
  TEXT_SEC: '#94A3B8',
  ACCENT: '#22C55E',
  BORDER: '#334155',
};

export const TeamMembersScreen = ({ route, navigation }) => {
  const { teamId } = route.params;
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    const res = await teamsApi.getTeamMembers(teamId);
    if (res.success) setMembers(res.data);
  };

  const filteredMembers = members.filter(m =>
    `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase()),
  );

  const renderMember = ({ item }) => (
    <View style={styles.memberRow}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.firstName[0]}
          {item.lastName[0]}
        </Text>
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.name}>
          {item.firstName} {item.lastName}
        </Text>
        <Text style={styles.role}>
          {item.role === 'owner'
            ? 'Propriétaire'
            : item.role === 'captain'
            ? 'Capitaine'
            : 'Joueur'}
        </Text>
      </View>
      {item.role === 'captain' && (
        <Icon name="award" size={20} color="#F59E0B" />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={THEME.TEXT} />
        </TouchableOpacity>
        <Text style={styles.title}>Membres</Text>
        <TouchableOpacity>
          <Icon name="user-plus" size={24} color={THEME.ACCENT} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <Icon name="search" size={20} color={THEME.TEXT_SEC} />
        <TextInput
          style={styles.input}
          placeholder="Rechercher..."
          placeholderTextColor={THEME.TEXT_SEC}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filteredMembers}
        keyExtractor={item => item.user_id}
        renderItem={renderMember}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.BG },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingBottom: 20,
  },
  title: { fontSize: 18, fontWeight: 'bold', color: THEME.TEXT },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.SURFACE,
    marginHorizontal: 24,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 12,
  },
  input: { flex: 1, marginLeft: 12, color: THEME.TEXT, fontSize: 16 },
  list: { paddingHorizontal: 24 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.BORDER,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontWeight: 'bold', color: '#000' },
  name: { color: THEME.TEXT, fontWeight: '600', fontSize: 16 },
  role: { color: THEME.TEXT_SEC, fontSize: 12, marginTop: 2 },
});
