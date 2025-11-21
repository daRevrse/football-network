// ====== src/screens/teams/CreateTeamScreen.js ======
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
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

const InputField = ({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  keyboardType,
}) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={[
        styles.input,
        multiline && { height: 100, textAlignVertical: 'top' },
      ]}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={THEME.TEXT_SEC}
      multiline={multiline}
      keyboardType={keyboardType}
    />
  </View>
);

export const CreateTeamScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    locationCity: '',
    maxPlayers: '15',
  });
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!formData.name.trim()) return Alert.alert('Erreur', 'Nom requis');
    setLoading(true);
    try {
      const res = await teamsApi.createTeam({
        ...formData,
        maxPlayers: parseInt(formData.maxPlayers),
      });
      if (res.success) {
        navigation.replace('TeamDetail', { teamId: res.data.id });
      } else {
        Alert.alert('Erreur', res.error);
      }
    } catch (e) {
      Alert.alert('Erreur', 'Problème technique');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="x" size={24} color={THEME.TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouvelle Équipe</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <InputField
            label="Nom de l'équipe"
            value={formData.name}
            onChange={t => setFormData({ ...formData, name: t })}
            placeholder="Ex: Les Lions de Paris"
          />
          <InputField
            label="Ville"
            value={formData.locationCity}
            onChange={t => setFormData({ ...formData, locationCity: t })}
            placeholder="Ex: Paris"
          />
          <InputField
            label="Joueurs Max"
            value={formData.maxPlayers}
            onChange={t => setFormData({ ...formData, maxPlayers: t })}
            keyboardType="numeric"
            placeholder="15"
          />
          <InputField
            label="Description"
            value={formData.description}
            onChange={t => setFormData({ ...formData, description: t })}
            multiline
            placeholder="Décrivez votre équipe..."
          />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.btn}
            onPress={handleCreate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.btnText}>CRÉER L'ÉQUIPE</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    borderBottomWidth: 1,
    borderBottomColor: THEME.BORDER,
  },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: THEME.TEXT },
  content: { padding: 24 },
  inputGroup: { marginBottom: 20 },
  label: {
    color: THEME.TEXT_SEC,
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: THEME.SURFACE,
    borderRadius: 12,
    padding: 16,
    color: THEME.TEXT,
    fontSize: 16,
    borderWidth: 1,
    borderColor: THEME.BORDER,
  },
  footer: { padding: 24, borderTopWidth: 1, borderTopColor: THEME.BORDER },
  btn: {
    backgroundColor: THEME.ACCENT,
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: { fontWeight: 'bold', color: '#000', fontSize: 14 },
});
