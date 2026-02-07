/**
 * CreateTeamScreen - Créer une équipe
 * Design Foot Connect Premium
 */

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
import { Feather as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { teamsApi } from '../../services/api';
import { COLORS, GRADIENTS, SHADOWS, RADIUS } from '../../theme/colors';

const InputField = ({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  keyboardType,
  icon,
}) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputContainer}>
      {icon && (
        <Icon name={icon} size={20} color={COLORS.PRIMARY} style={{ marginRight: 12 }} />
      )}
      <TextInput
        style={[
          styles.input,
          multiline && { height: 100, textAlignVertical: 'top' },
        ]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={`${COLORS.WHITE}50`}
        multiline={multiline}
        keyboardType={keyboardType}
      />
    </View>
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
      {/* Header */}
      <LinearGradient
        colors={[COLORS.PRIMARY, COLORS.PRIMARY_DARK, COLORS.DARK]}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Icon name="x" size={24} color={COLORS.WHITE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouvelle Équipe</Text>
        <View style={{ width: 44 }} />
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.iconBox}>
            <Icon name="shield" size={48} color={COLORS.PRIMARY} />
          </View>
          <Text style={styles.subtitle}>Créez votre équipe et commencez à jouer</Text>

          <InputField
            label="Nom de l'équipe"
            value={formData.name}
            onChange={t => setFormData({ ...formData, name: t })}
            placeholder="Ex: Les Lions de Paris"
            icon="shield"
          />
          <InputField
            label="Ville"
            value={formData.locationCity}
            onChange={t => setFormData({ ...formData, locationCity: t })}
            placeholder="Ex: Paris"
            icon="map-pin"
          />
          <InputField
            label="Joueurs Max"
            value={formData.maxPlayers}
            onChange={t => setFormData({ ...formData, maxPlayers: t })}
            keyboardType="numeric"
            placeholder="15"
            icon="users"
          />
          <InputField
            label="Description"
            value={formData.description}
            onChange={t => setFormData({ ...formData, description: t })}
            multiline
            placeholder="Décrivez votre équipe..."
            icon="align-left"
          />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.btn}
            onPress={handleCreate}
            disabled={loading}
          >
            <LinearGradient
              colors={GRADIENTS.button}
              style={styles.btnGradient}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.WHITE} />
              ) : (
                <>
                  <Icon name="plus" size={20} color={COLORS.WHITE} />
                  <Text style={styles.btnText}>CRÉER L'ÉQUIPE</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.DARK,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.GLASS,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.WHITE,
  },
  content: {
    padding: 24,
  },
  iconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${COLORS.PRIMARY}15`,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.WHITE,
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.7,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: COLORS.PRIMARY,
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.DARK_CARD,
    borderRadius: RADIUS.md,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  input: {
    flex: 1,
    color: COLORS.WHITE,
    fontSize: 16,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
  },
  btn: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.glow,
  },
  btnGradient: {
    flexDirection: 'row',
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  btnText: {
    fontWeight: 'bold',
    color: COLORS.WHITE,
    fontSize: 16,
  },
});
