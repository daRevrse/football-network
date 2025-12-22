// ====== src/screens/profile/PrivacyScreen.js ======
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  StatusBar,
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

const PrivacyToggle = ({ label, desc, value, onValueChange }) => (
  <View style={styles.toggleRow}>
    <View style={{ flex: 1, marginRight: 16 }}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Text style={styles.toggleDesc}>{desc}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: THEME.SURFACE, true: THEME.ACCENT }}
      thumbColor="#FFF"
    />
  </View>
);

export const PrivacyScreen = ({ navigation }) => {
  const [privacy, setPrivacy] = useState({
    publicProfile: true,
    showEmail: false,
    showPhone: false,
    allowSearch: true,
  });

  const toggle = key => setPrivacy(p => ({ ...p, [key]: !p[key] }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.BG} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={THEME.TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confidentialité</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Visibilité du Profil</Text>

        <View style={styles.card}>
          <PrivacyToggle
            label="Profil Public"
            desc="Tout le monde peut voir vos stats et vos équipes."
            value={privacy.publicProfile}
            onValueChange={() => toggle('publicProfile')}
          />
          <View style={styles.divider} />
          <PrivacyToggle
            label="Apparaître dans la recherche"
            desc="Permettre aux managers de vous trouver."
            value={privacy.allowSearch}
            onValueChange={() => toggle('allowSearch')}
          />
        </View>

        <Text style={styles.sectionTitle}>Coordonnées</Text>
        <View style={styles.card}>
          <PrivacyToggle
            label="Afficher l'email"
            desc="Visible uniquement par vos coéquipiers."
            value={privacy.showEmail}
            onValueChange={() => toggle('showEmail')}
          />
          <View style={styles.divider} />
          <PrivacyToggle
            label="Afficher le téléphone"
            desc="Visible uniquement par vos managers."
            value={privacy.showPhone}
            onValueChange={() => toggle('showPhone')}
          />
        </View>

        <Text style={styles.sectionTitle}>Données</Text>
        <TouchableOpacity style={styles.dangerButton}>
          <Icon name="download-cloud" size={20} color={THEME.TEXT} />
          <Text style={styles.dangerText}>Télécharger mes données</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.dangerButton, { borderColor: '#EF4444' }]}
        >
          <Icon name="trash" size={20} color="#EF4444" />
          <Text style={[styles.dangerText, { color: '#EF4444' }]}>
            Supprimer mon compte
          </Text>
        </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingBottom: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.TEXT },
  content: { padding: 20 },
  sectionTitle: {
    color: THEME.ACCENT,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 12,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: THEME.SURFACE,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.BORDER,
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.TEXT,
    marginBottom: 4,
  },
  toggleDesc: { fontSize: 13, color: THEME.TEXT_SEC, lineHeight: 18 },
  divider: { height: 1, backgroundColor: THEME.BORDER, marginVertical: 16 },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.BORDER,
    marginTop: 12,
    gap: 10,
  },
  dangerText: { fontSize: 15, fontWeight: '600', color: THEME.TEXT },
});
