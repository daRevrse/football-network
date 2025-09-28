import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useDispatch } from 'react-redux';

const COLORS = {
  PRIMARY: '#22C55E',
  BACKGROUND: '#F8FAFC',
  CARD_BACKGROUND: '#FFFFFF',
  TEXT_PRIMARY: '#1F2937',
  TEXT_SECONDARY: '#6B7280',
  TEXT_WHITE: '#FFFFFF',
  BORDER_LIGHT: '#F3F4F6',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
};

const DIMENSIONS = {
  CONTAINER_PADDING: 16,
  SPACING_MD: 16,
  SPACING_LG: 24,
  SPACING_XL: 32,
  BORDER_RADIUS_LG: 12,
};

const FONTS = {
  SIZE: {
    SM: 14,
    MD: 16,
    LG: 18,
    XL: 20,
    XXL: 24,
  },
};

// Composant Input réutilisable
const FormInput = React.memo(
  ({
    label,
    value,
    onChangeText,
    placeholder,
    error,
    multiline = false,
    ...props
  }) => (
    <View style={{ marginBottom: DIMENSIONS.SPACING_MD }}>
      <Text
        style={{
          fontSize: FONTS.SIZE.SM,
          fontWeight: '500',
          color: COLORS.TEXT_PRIMARY,
          marginBottom: DIMENSIONS.SPACING_SM,
        }}
      >
        {label}
      </Text>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: error ? COLORS.ERROR : COLORS.BORDER_LIGHT,
          borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
          paddingHorizontal: DIMENSIONS.SPACING_MD,
          paddingVertical: multiline ? DIMENSIONS.SPACING_MD : 12,
          backgroundColor: COLORS.CARD_BACKGROUND,
          fontSize: FONTS.SIZE.MD,
          minHeight: multiline ? 80 : 48,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.TEXT_SECONDARY}
        multiline={multiline}
        {...props}
      />
      {error && (
        <Text
          style={{
            fontSize: FONTS.SIZE.SM,
            color: COLORS.ERROR,
            marginTop: DIMENSIONS.SPACING_SM,
          }}
        >
          {error}
        </Text>
      )}
    </View>
  ),
);

// Composant de sélection
const SkillLevelSelector = React.memo(({ value, onSelect }) => {
  const skillLevels = [
    { value: 'beginner', label: 'Débutant', color: '#94A3B8' },
    { value: 'amateur', label: 'Amateur', color: '#3B82F6' },
    { value: 'intermediate', label: 'Intermédiaire', color: '#F59E0B' },
    { value: 'advanced', label: 'Avancé', color: '#EF4444' },
    { value: 'expert', label: 'Expert', color: '#8B5CF6' },
  ];

  return (
    <View style={{ marginBottom: DIMENSIONS.SPACING_MD }}>
      <Text
        style={{
          fontSize: FONTS.SIZE.SM,
          fontWeight: '500',
          color: COLORS.TEXT_PRIMARY,
          marginBottom: DIMENSIONS.SPACING_SM,
        }}
      >
        Niveau de l'équipe
      </Text>

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        {skillLevels.map(level => (
          <TouchableOpacity
            key={level.value}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 20,
              backgroundColor:
                value === level.value ? level.color : COLORS.BACKGROUND,
              borderWidth: 1,
              borderColor:
                value === level.value ? level.color : COLORS.BORDER_LIGHT,
            }}
            onPress={() => onSelect(level.value)}
          >
            <Text
              style={{
                fontSize: FONTS.SIZE.SM,
                fontWeight: '600',
                color:
                  value === level.value
                    ? COLORS.TEXT_WHITE
                    : COLORS.TEXT_SECONDARY,
              }}
            >
              {level.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
});

export const CreateTeamScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    skillLevel: 'amateur',
    locationCity: '',
    maxPlayers: '11',
  });
  const [errors, setErrors] = useState({});

  const updateField = useCallback(
    (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: null }));
      }
    },
    [errors],
  );

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Le nom de l'équipe est requis";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Le nom doit contenir au moins 3 caractères';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Une description est requise';
    } else if (formData.description.trim().length < 10) {
      newErrors.description =
        'La description doit contenir au moins 10 caractères';
    }

    if (!formData.locationCity.trim()) {
      newErrors.locationCity = 'La ville est requise';
    }

    const maxPlayers = parseInt(formData.maxPlayers);
    if (isNaN(maxPlayers) || maxPlayers < 5 || maxPlayers > 30) {
      newErrors.maxPlayers = 'Le nombre de joueurs doit être entre 5 et 30';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);

      // TODO: Appeler l'API pour créer l'équipe
      console.log('Création équipe:', formData);

      // Simulation
      await new Promise(resolve => setTimeout(resolve, 1500));

      Alert.alert(
        'Équipe créée !',
        `L'équipe "${formData.name}" a été créée avec succès.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        'Erreur',
        "Impossible de créer l'équipe. Veuillez réessayer.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [formData, validateForm, navigation]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: COLORS.BACKGROUND }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            flex: 1,
            paddingHorizontal: DIMENSIONS.CONTAINER_PADDING,
            paddingVertical: DIMENSIONS.SPACING_LG,
          }}
        >
          {/* Header */}
          <View
            style={{
              alignItems: 'center',
              marginBottom: DIMENSIONS.SPACING_XL,
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                backgroundColor: COLORS.PRIMARY,
                borderRadius: 40,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: DIMENSIONS.SPACING_MD,
              }}
            >
              <Text style={{ fontSize: 32 }}>⚽</Text>
            </View>

            <Text
              style={{
                fontSize: FONTS.SIZE.XL,
                fontWeight: 'bold',
                color: COLORS.TEXT_PRIMARY,
                marginBottom: DIMENSIONS.SPACING_SM,
              }}
            >
              Créer une équipe
            </Text>

            <Text
              style={{
                fontSize: FONTS.SIZE.MD,
                color: COLORS.TEXT_SECONDARY,
                textAlign: 'center',
              }}
            >
              Rassemblez vos amis et créez votre équipe de football
            </Text>
          </View>

          {/* Formulaire */}
          <View style={{ marginBottom: DIMENSIONS.SPACING_XL }}>
            <FormInput
              label="Nom de l'équipe *"
              value={formData.name}
              onChangeText={value => updateField('name', value)}
              placeholder="Ex: Les Tigres de Paris"
              error={errors.name}
              maxLength={50}
            />

            <FormInput
              label="Description *"
              value={formData.description}
              onChangeText={value => updateField('description', value)}
              placeholder="Décrivez votre équipe, vos objectifs, votre style de jeu..."
              error={errors.description}
              multiline
              maxLength={200}
            />

            <SkillLevelSelector
              value={formData.skillLevel}
              onSelect={value => updateField('skillLevel', value)}
            />

            <FormInput
              label="Ville *"
              value={formData.locationCity}
              onChangeText={value => updateField('locationCity', value)}
              placeholder="Ex: Paris"
              error={errors.locationCity}
              maxLength={50}
            />

            <FormInput
              label="Nombre max de joueurs"
              value={formData.maxPlayers}
              onChangeText={value => updateField('maxPlayers', value)}
              placeholder="11"
              error={errors.maxPlayers}
              keyboardType="numeric"
              maxLength={2}
            />
          </View>

          {/* Boutons */}
          <View style={{ marginTop: 'auto' }}>
            <TouchableOpacity
              style={{
                backgroundColor: isLoading
                  ? COLORS.TEXT_SECONDARY
                  : COLORS.PRIMARY,
                paddingVertical: 16,
                borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
                alignItems: 'center',
                marginBottom: DIMENSIONS.SPACING_MD,
              }}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              <Text
                style={{
                  color: COLORS.TEXT_WHITE,
                  fontSize: FONTS.SIZE.MD,
                  fontWeight: 'bold',
                }}
              >
                {isLoading ? 'Création...' : "Créer l'équipe"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                paddingVertical: 16,
                alignItems: 'center',
              }}
              onPress={() => navigation.goBack()}
              disabled={isLoading}
            >
              <Text
                style={{
                  color: COLORS.TEXT_SECONDARY,
                  fontSize: FONTS.SIZE.MD,
                }}
              >
                Annuler
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
