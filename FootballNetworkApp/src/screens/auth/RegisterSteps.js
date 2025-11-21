// ====== src/screens/auth/RegisterSteps.js ======
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { ModernInput } from '../../components/common';

// On réutilise le thème défini plus haut ou on le passe en props
const THEME = {
  SURFACE: '#1E293B',
  TEXT: '#F8FAFC',
  TEXT_SEC: '#94A3B8',
  ACCENT: '#22C55E',
  BORDER: '#334155',
  ERROR: '#EF4444',
};

// Styles partagés pour les inputs dark
const inputProps = {
  inputStyle: {
    backgroundColor: THEME.SURFACE,
    borderColor: THEME.BORDER,
    color: THEME.TEXT,
    borderWidth: 1,
  },
  labelStyle: {
    color: THEME.TEXT_SEC,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  placeholderTextColor: THEME.TEXT_SEC,
};

const StepTitle = ({ title, subtitle }) => (
  <View style={{ marginBottom: 32 }}>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.subtitle}>{subtitle}</Text>
  </View>
);

export const PersonalInfoStep = ({ formData, updateField, errors }) => (
  <View>
    <StepTitle title="Identité" subtitle="Commençons par les présentations." />

    <ModernInput
      label="Prénom"
      placeholder="Jean"
      value={formData.firstName}
      onChangeText={v => updateField('firstName', v)}
      leftIcon="user"
      error={errors.firstName}
      {...inputProps}
    />
    <ModernInput
      label="Nom"
      placeholder="Dupont"
      value={formData.lastName}
      onChangeText={v => updateField('lastName', v)}
      leftIcon="user"
      error={errors.lastName}
      {...inputProps}
    />
    <ModernInput
      label="Email"
      value={formData.email}
      placeholder="email@example.com"
      onChangeText={v => updateField('email', v)}
      leftIcon="mail"
      error={errors.email}
      {...inputProps}
    />
  </View>
);

export const SecurityStep = ({ formData, updateField, errors }) => (
  <View>
    <StepTitle title="Sécurité" subtitle="Protégez votre compte joueur." />

    <ModernInput
      label="Mot de passe"
      value={formData.password}
      placeholder="••••••••"
      onChangeText={v => updateField('password', v)}
      secureTextEntry
      leftIcon="lock"
      error={errors.password}
      {...inputProps}
    />
    <ModernInput
      label="Confirmation"
      value={formData.confirmPassword}
      placeholder="••••••••"
      onChangeText={v => updateField('confirmPassword', v)}
      secureTextEntry
      leftIcon="lock"
      error={errors.confirmPassword}
      {...inputProps}
    />
  </View>
);

// Composant personnalisé pour les sélections Dark Mode
const DarkOption = ({ label, icon, selected, onPress }) => (
  <TouchableOpacity
    style={[styles.optionCard, selected && styles.optionCardSelected]}
    onPress={onPress}
  >
    <View
      style={[styles.iconBox, selected && { backgroundColor: THEME.ACCENT }]}
    >
      <Icon name={icon} size={20} color={selected ? '#000' : THEME.TEXT} />
    </View>
    <Text
      style={[
        styles.optionText,
        selected && { color: THEME.ACCENT, fontWeight: 'bold' },
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

export const FootballProfileStep = ({ formData, updateField, errors }) => {
  const POSITIONS = [
    { id: 'goalkeeper', label: 'Gardien', icon: 'shield' },
    { id: 'defender', label: 'Défenseur', icon: 'anchor' }, // anchor exists in feather
    { id: 'midfielder', label: 'Milieu', icon: 'activity' },
    { id: 'forward', label: 'Attaquant', icon: 'target' },
  ];

  return (
    <View>
      <StepTitle
        title="Profil Sportif"
        subtitle="Quel est votre style de jeu ?"
      />

      <ModernInput
        label="Ville"
        value={formData.locationCity}
        placeholder="Paris"
        onChangeText={v => updateField('locationCity', v)}
        leftIcon="map-pin"
        error={errors.locationCity}
        {...inputProps}
      />

      <Text style={inputProps.labelStyle}>Votre Poste</Text>
      <View style={styles.grid}>
        {POSITIONS.map(p => (
          <DarkOption
            key={p.id}
            label={p.label}
            icon={p.icon}
            selected={formData.position === p.id}
            onPress={() => updateField('position', p.id)}
          />
        ))}
      </View>
      {errors.position && <Text style={styles.error}>{errors.position}</Text>}
    </View>
  );
};

export const SummaryStep = ({ formData }) => (
  <View>
    <StepTitle
      title="Récapitulatif"
      subtitle="Prêt à entrer sur le terrain ?"
    />

    <View style={styles.summaryBox}>
      <InfoRow
        label="Nom"
        value={`${formData.firstName} ${formData.lastName}`}
      />
      <InfoRow label="Email" value={formData.email} />
      <View style={styles.divider} />
      <InfoRow label="Ville" value={formData.locationCity} />
      <InfoRow label="Poste" value={formData.position?.toUpperCase()} />
    </View>
  </View>
);

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: THEME.TEXT,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: THEME.TEXT_SEC,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
    marginBottom: 24,
  },
  optionCard: {
    width: '48%',
    backgroundColor: THEME.SURFACE,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.BORDER,
  },
  optionCardSelected: {
    borderColor: THEME.ACCENT,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionText: {
    color: THEME.TEXT,
    fontSize: 14,
  },
  error: {
    color: THEME.ERROR,
    marginTop: -16,
    marginBottom: 16,
  },
  summaryBox: {
    backgroundColor: THEME.SURFACE,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: THEME.BORDER,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoLabel: {
    color: THEME.TEXT_SEC,
    fontSize: 14,
  },
  infoValue: {
    color: THEME.TEXT,
    fontWeight: '600',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.BORDER,
    marginVertical: 16,
  },
});
