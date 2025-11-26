// ====== src/screens/profile/SettingsScreen.js ======
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const THEME = {
  BG: '#0F172A',
  SURFACE: '#1E293B',
  TEXT: '#F8FAFC',
  TEXT_SEC: '#94A3B8',
  ACCENT: '#22C55E',
  BORDER: '#334155',
};

const SettingItem = ({
  icon,
  label,
  type = 'arrow',
  value,
  onToggle,
  color = THEME.TEXT,
}) => (
  <TouchableOpacity
    style={styles.item}
    activeOpacity={type === 'switch' ? 1 : 0.7}
    onPress={type === 'switch' ? onToggle : null}
  >
    <View style={styles.itemLeft}>
      <Icon name={icon} size={20} color={color} style={{ marginRight: 16 }} />
      <Text style={[styles.itemLabel, { color }]}>{label}</Text>
    </View>

    {type === 'switch' ? (
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: THEME.SURFACE, true: THEME.ACCENT }}
        thumbColor="#FFF"
      />
    ) : (
      <Icon name="chevron-right" size={20} color={THEME.TEXT_SEC} />
    )}
  </TouchableOpacity>
);

const SectionHeader = ({ title }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

export const SettingsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Icon name="arrow-left" size={24} color={THEME.TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paramètres</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader title="Général" />
        <View style={styles.section}>
          <SettingItem
            icon="bell"
            label="Notifications"
            type="switch"
            value={notifications}
            onToggle={() => setNotifications(!notifications)}
          />
          <SettingItem
            icon="moon"
            label="Mode Sombre"
            type="switch"
            value={darkMode}
            onToggle={() => setDarkMode(!darkMode)}
          />
          <SettingItem icon="globe" label="Langue" />
        </View>

        <SectionHeader title="Compte" />
        <View style={styles.section}>
          <SettingItem icon="lock" label="Sécurité" />
          <SettingItem icon="credit-card" label="Abonnement" />
        </View>

        <SectionHeader title="Support" />
        <View style={styles.section}>
          <SettingItem icon="help-circle" label="Aide" />
          <SettingItem icon="file-text" label="Conditions d'utilisation" />
          <SettingItem
            icon="trash-2"
            label="Supprimer le compte"
            color="#EF4444"
          />
        </View>

        <Text style={styles.version}>Version 1.0.2 • Build 2023</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.BG },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: { color: THEME.TEXT, fontSize: 18, fontWeight: 'bold' },
  content: { padding: 20 },
  sectionHeader: {
    color: THEME.ACCENT,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 12,
    marginLeft: 8,
    letterSpacing: 1,
  },
  section: {
    backgroundColor: THEME.SURFACE,
    borderRadius: 16,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.BORDER,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center' },
  itemLabel: { fontSize: 16 },
  version: {
    textAlign: 'center',
    color: THEME.TEXT_SEC,
    fontSize: 12,
    marginTop: 30,
  },
});
