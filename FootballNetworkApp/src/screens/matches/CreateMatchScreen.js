// ====== src/screens/matches/CreateMatchScreen.js ======
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme } from '../../hooks/useTheme';
import { DIMENSIONS, FONTS, SHADOWS } from '../../styles/theme';

// Composant FormSection
const FormSection = ({ title, icon, children, COLORS }) => (
  <View style={[styles.section, { backgroundColor: COLORS.WHITE }]}>
    <View style={styles.sectionHeader}>
      <Icon name={icon} size={20} color={COLORS.PRIMARY} />
      <Text style={[styles.sectionTitle, { color: COLORS.TEXT_PRIMARY }]}>
        {title}
      </Text>
    </View>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

// Composant InputField
const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  editable = true,
  COLORS,
}) => (
  <View style={styles.inputContainer}>
    <Text style={[styles.inputLabel, { color: COLORS.TEXT_SECONDARY }]}>
      {label}
    </Text>
    <TextInput
      style={[
        styles.input,
        {
          backgroundColor: COLORS.BACKGROUND_LIGHT,
          color: COLORS.TEXT_PRIMARY,
          borderColor: COLORS.BORDER,
        },
        multiline && styles.inputMultiline,
        !editable && { opacity: 0.6 },
      ]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={COLORS.TEXT_MUTED}
      multiline={multiline}
      numberOfLines={multiline ? 4 : 1}
      editable={editable}
    />
  </View>
);

// Composant SelectButton
const SelectButton = ({ label, value, onPress, icon, placeholder, COLORS }) => (
  <View style={styles.inputContainer}>
    <Text style={[styles.inputLabel, { color: COLORS.TEXT_SECONDARY }]}>
      {label}
    </Text>
    <TouchableOpacity
      style={[
        styles.selectButton,
        {
          backgroundColor: COLORS.BACKGROUND_LIGHT,
          borderColor: COLORS.BORDER,
        },
      ]}
      onPress={onPress}
    >
      <View style={styles.selectContent}>
        {icon && <Icon name={icon} size={20} color={COLORS.TEXT_MUTED} />}
        <Text
          style={[
            styles.selectText,
            {
              color: value ? COLORS.TEXT_PRIMARY : COLORS.TEXT_MUTED,
            },
          ]}
        >
          {value || placeholder}
        </Text>
      </View>
      <Icon name="chevron-right" size={20} color={COLORS.TEXT_MUTED} />
    </TouchableOpacity>
  </View>
);

// Composant TeamCard
const TeamCard = ({ label, team, onPress, onRemove, COLORS }) => (
  <View style={styles.inputContainer}>
    <Text style={[styles.inputLabel, { color: COLORS.TEXT_SECONDARY }]}>
      {label}
    </Text>
    {team ? (
      <View
        style={[
          styles.teamCard,
          {
            backgroundColor: COLORS.BACKGROUND_LIGHT,
            borderColor: COLORS.PRIMARY,
          },
        ]}
      >
        <View
          style={[
            styles.teamIcon,
            { backgroundColor: COLORS.PRIMARY_ULTRA_LIGHT },
          ]}
        >
          <Icon name="dribbble" size={24} color={COLORS.PRIMARY} />
        </View>
        <View style={styles.teamInfo}>
          <Text style={[styles.teamName, { color: COLORS.TEXT_PRIMARY }]}>
            {team.name}
          </Text>
          <Text style={[styles.teamMeta, { color: COLORS.TEXT_SECONDARY }]}>
            {team.members} membres
          </Text>
        </View>
        <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
          <Icon name="x" size={20} color={COLORS.ERROR} />
        </TouchableOpacity>
      </View>
    ) : (
      <TouchableOpacity
        style={[
          styles.addTeamButton,
          {
            backgroundColor: COLORS.BACKGROUND_LIGHT,
            borderColor: COLORS.BORDER,
          },
        ]}
        onPress={onPress}
      >
        <Icon name="plus" size={24} color={COLORS.PRIMARY} />
        <Text style={[styles.addTeamText, { color: COLORS.TEXT_SECONDARY }]}>
          Sélectionner une équipe
        </Text>
      </TouchableOpacity>
    )}
  </View>
);

// Composant OptionCard
const OptionCard = ({ icon, label, selected, onPress, COLORS }) => (
  <TouchableOpacity
    style={[
      styles.optionCard,
      {
        backgroundColor: selected
          ? COLORS.PRIMARY_ULTRA_LIGHT
          : COLORS.BACKGROUND_LIGHT,
        borderColor: selected ? COLORS.PRIMARY : COLORS.BORDER,
      },
    ]}
    onPress={onPress}
  >
    <View
      style={[
        styles.optionIcon,
        {
          backgroundColor: selected ? COLORS.PRIMARY_LIGHT : COLORS.WHITE,
        },
      ]}
    >
      <Icon
        name={icon}
        size={20}
        color={selected ? COLORS.PRIMARY : COLORS.TEXT_MUTED}
      />
    </View>
    <Text
      style={[
        styles.optionLabel,
        { color: selected ? COLORS.PRIMARY : COLORS.TEXT_PRIMARY },
      ]}
    >
      {label}
    </Text>
    {selected && (
      <View style={styles.checkIcon}>
        <Icon name="check-circle" size={20} color={COLORS.PRIMARY} />
      </View>
    )}
  </TouchableOpacity>
);

export const CreateMatchScreen = ({ navigation }) => {
  const { colors: COLORS, isDark } = useTheme('auto');

  // État du formulaire
  const [homeTeam, setHomeTeam] = useState(null);
  const [awayTeam, setAwayTeam] = useState(null);
  const [matchDate, setMatchDate] = useState('');
  const [matchTime, setMatchTime] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [matchType, setMatchType] = useState('friendly'); // friendly, competitive, tournament
  const [maxPlayers, setMaxPlayers] = useState('22');
  const [description, setDescription] = useState('');

  // Données mockées pour la sélection d'équipe
  const myTeams = [
    { id: 1, name: 'Les Tigres de Paris', members: 11 },
    { id: 2, name: 'FC Montmartre', members: 9 },
    { id: 3, name: 'Racing Club 75', members: 15 },
  ];

  const handleSelectHomeTeam = () => {
    Alert.alert(
      "Sélectionner l'équipe à domicile",
      '',
      myTeams
        .map(team => ({
          text: team.name,
          onPress: () => setHomeTeam(team),
        }))
        .concat([{ text: 'Annuler', style: 'cancel' }]),
    );
  };

  const handleSelectAwayTeam = () => {
    Alert.alert(
      "Sélectionner l'équipe extérieure",
      '',
      myTeams
        .map(team => ({
          text: team.name,
          onPress: () => setAwayTeam(team),
        }))
        .concat([{ text: 'Annuler', style: 'cancel' }]),
    );
  };

  const handleSelectDate = () => {
    // Simulation de sélection de date
    const today = new Date();
    const dateStr = `${today.getDate().toString().padStart(2, '0')}/${(
      today.getMonth() + 1
    )
      .toString()
      .padStart(2, '0')}/${today.getFullYear()}`;
    setMatchDate(dateStr);
  };

  const handleSelectTime = () => {
    // Simulation de sélection d'heure
    Alert.alert("Sélectionner l'heure", '', [
      { text: '10:00', onPress: () => setMatchTime('10:00') },
      { text: '14:00', onPress: () => setMatchTime('14:00') },
      { text: '15:00', onPress: () => setMatchTime('15:00') },
      { text: '16:00', onPress: () => setMatchTime('16:00') },
      { text: '18:00', onPress: () => setMatchTime('18:00') },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const handleSelectLocation = () => {
    Alert.alert('Sélectionner un lieu', '', [
      {
        text: 'Stade Municipal Paris 15e',
        onPress: () => {
          setLocation('Stade Municipal');
          setAddress('15 rue du Stade, 75015 Paris');
        },
      },
      {
        text: 'Terrain Synthétique Paris 18e',
        onPress: () => {
          setLocation('Terrain Synthétique');
          setAddress('8 avenue du Sport, 75018 Paris');
        },
      },
      {
        text: 'Parc des Sports Paris 14e',
        onPress: () => {
          setLocation('Parc des Sports');
          setAddress('22 rue de la Victoire, 75014 Paris');
        },
      },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  const handleCreateMatch = () => {
    // Validation
    if (!homeTeam || !awayTeam) {
      Alert.alert('Erreur', 'Veuillez sélectionner les deux équipes');
      return;
    }
    if (!matchDate || !matchTime) {
      Alert.alert('Erreur', "Veuillez sélectionner la date et l'heure");
      return;
    }
    if (!location) {
      Alert.alert('Erreur', 'Veuillez sélectionner un lieu');
      return;
    }

    Alert.alert('Match créé !', 'Le match a été créé avec succès', [
      {
        text: 'OK',
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  return (
    <View
      style={[styles.container, { backgroundColor: COLORS.BACKGROUND_LIGHT }]}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: COLORS.WHITE }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: COLORS.TEXT_PRIMARY }]}>
          Créer un match
        </Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Équipes */}
        <FormSection title="Équipes" icon="users" COLORS={COLORS}>
          <TeamCard
            label="Équipe à domicile"
            team={homeTeam}
            onPress={handleSelectHomeTeam}
            onRemove={() => setHomeTeam(null)}
            COLORS={COLORS}
          />
          <TeamCard
            label="Équipe extérieure"
            team={awayTeam}
            onPress={handleSelectAwayTeam}
            onRemove={() => setAwayTeam(null)}
            COLORS={COLORS}
          />
        </FormSection>

        {/* Date et heure */}
        <FormSection title="Date et heure" icon="calendar" COLORS={COLORS}>
          <SelectButton
            label="Date du match"
            value={matchDate}
            placeholder="Sélectionner la date"
            icon="calendar"
            onPress={handleSelectDate}
            COLORS={COLORS}
          />
          <SelectButton
            label="Heure du match"
            value={matchTime}
            placeholder="Sélectionner l'heure"
            icon="clock"
            onPress={handleSelectTime}
            COLORS={COLORS}
          />
        </FormSection>

        {/* Lieu */}
        <FormSection title="Lieu" icon="map-pin" COLORS={COLORS}>
          <SelectButton
            label="Terrain"
            value={location}
            placeholder="Sélectionner un terrain"
            icon="map-pin"
            onPress={handleSelectLocation}
            COLORS={COLORS}
          />
          {address && (
            <InputField
              label="Adresse"
              value={address}
              placeholder="Adresse du terrain"
              editable={false}
              COLORS={COLORS}
            />
          )}
        </FormSection>

        {/* Type de match */}
        <FormSection title="Type de match" icon="award" COLORS={COLORS}>
          <View style={styles.optionsGrid}>
            <OptionCard
              icon="smile"
              label="Amical"
              selected={matchType === 'friendly'}
              onPress={() => setMatchType('friendly')}
              COLORS={COLORS}
            />
            <OptionCard
              icon="zap"
              label="Compétitif"
              selected={matchType === 'competitive'}
              onPress={() => setMatchType('competitive')}
              COLORS={COLORS}
            />
            <OptionCard
              icon="trophy"
              label="Tournoi"
              selected={matchType === 'tournament'}
              onPress={() => setMatchType('tournament')}
              COLORS={COLORS}
            />
          </View>
        </FormSection>

        {/* Détails */}
        <FormSection title="Détails" icon="info" COLORS={COLORS}>
          <InputField
            label="Nombre de joueurs maximum"
            value={maxPlayers}
            onChangeText={setMaxPlayers}
            placeholder="22"
            COLORS={COLORS}
          />
          <InputField
            label="Description (optionnel)"
            value={description}
            onChangeText={setDescription}
            placeholder="Ajouter des informations supplémentaires..."
            multiline
            COLORS={COLORS}
          />
        </FormSection>

        {/* Récapitulatif */}
        {homeTeam && awayTeam && matchDate && matchTime && location && (
          <View
            style={[
              styles.summary,
              { backgroundColor: COLORS.PRIMARY_ULTRA_LIGHT },
            ]}
          >
            <View style={styles.summaryHeader}>
              <Icon name="info" size={20} color={COLORS.PRIMARY} />
              <Text style={[styles.summaryTitle, { color: COLORS.PRIMARY }]}>
                Récapitulatif
              </Text>
            </View>
            <View style={styles.summaryContent}>
              <View style={styles.summaryMatch}>
                <Text
                  style={[styles.summaryTeam, { color: COLORS.TEXT_PRIMARY }]}
                >
                  {homeTeam.name}
                </Text>
                <Text style={[styles.summaryVs, { color: COLORS.TEXT_MUTED }]}>
                  VS
                </Text>
                <Text
                  style={[styles.summaryTeam, { color: COLORS.TEXT_PRIMARY }]}
                >
                  {awayTeam.name}
                </Text>
              </View>
              <View style={styles.summaryDetails}>
                <View style={styles.summaryRow}>
                  <Icon
                    name="calendar"
                    size={14}
                    color={COLORS.TEXT_SECONDARY}
                  />
                  <Text
                    style={[
                      styles.summaryText,
                      { color: COLORS.TEXT_SECONDARY },
                    ]}
                  >
                    {matchDate} à {matchTime}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Icon
                    name="map-pin"
                    size={14}
                    color={COLORS.TEXT_SECONDARY}
                  />
                  <Text
                    style={[
                      styles.summaryText,
                      { color: COLORS.TEXT_SECONDARY },
                    ]}
                  >
                    {location}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Icon name="award" size={14} color={COLORS.TEXT_SECONDARY} />
                  <Text
                    style={[
                      styles.summaryText,
                      { color: COLORS.TEXT_SECONDARY },
                    ]}
                  >
                    Match{' '}
                    {matchType === 'friendly'
                      ? 'amical'
                      : matchType === 'competitive'
                      ? 'compétitif'
                      : 'de tournoi'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bouton de création */}
      <View style={[styles.footer, { backgroundColor: COLORS.WHITE }]}>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: COLORS.PRIMARY }]}
          onPress={handleCreateMatch}
        >
          <Icon name="plus-circle" size={20} color={COLORS.WHITE} />
          <Text style={styles.createButtonText}>Créer le match</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: DIMENSIONS.SPACING_MD,
    paddingHorizontal: DIMENSIONS.CONTAINER_PADDING,
    ...SHADOWS.SMALL,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONTS.SIZE.XL,
    fontWeight: FONTS.WEIGHT.BOLD,
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: DIMENSIONS.CONTAINER_PADDING,
    paddingBottom: 100,
  },
  section: {
    padding: DIMENSIONS.SPACING_LG,
    borderRadius: DIMENSIONS.BORDER_RADIUS_LG,
    marginBottom: DIMENSIONS.SPACING_LG,
    ...SHADOWS.SMALL,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACING_LG,
  },
  sectionTitle: {
    fontSize: FONTS.SIZE.LG,
    fontWeight: FONTS.WEIGHT.BOLD,
    marginLeft: DIMENSIONS.SPACING_SM,
  },
  sectionContent: {
    gap: DIMENSIONS.SPACING_MD,
  },
  inputContainer: {
    gap: DIMENSIONS.SPACING_XS,
  },
  inputLabel: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
  },
  input: {
    padding: DIMENSIONS.SPACING_MD,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    fontSize: FONTS.SIZE.MD,
    borderWidth: 1,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: DIMENSIONS.SPACING_MD,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    borderWidth: 1,
  },
  selectContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACING_SM,
    flex: 1,
  },
  selectText: {
    fontSize: FONTS.SIZE.MD,
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DIMENSIONS.SPACING_MD,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    borderWidth: 2,
  },
  teamIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DIMENSIONS.SPACING_MD,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
    marginBottom: 2,
  },
  teamMeta: {
    fontSize: FONTS.SIZE.SM,
  },
  removeButton: {
    padding: DIMENSIONS.SPACING_SM,
  },
  addTeamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: DIMENSIONS.SPACING_LG,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    borderWidth: 2,
    borderStyle: 'dashed',
    gap: DIMENSIONS.SPACING_SM,
  },
  addTeamText: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.MEDIUM,
  },
  optionsGrid: {
    flexDirection: 'row',
    gap: DIMENSIONS.SPACING_SM,
  },
  optionCard: {
    flex: 1,
    padding: DIMENSIONS.SPACING_MD,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    alignItems: 'center',
    borderWidth: 2,
    position: 'relative',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACING_SM,
  },
  optionLabel: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
    textAlign: 'center',
  },
  checkIcon: {
    position: 'absolute',
    top: DIMENSIONS.SPACING_XS,
    right: DIMENSIONS.SPACING_XS,
  },
  summary: {
    padding: DIMENSIONS.SPACING_LG,
    borderRadius: DIMENSIONS.BORDER_RADIUS_LG,
    marginBottom: DIMENSIONS.SPACING_LG,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACING_MD,
  },
  summaryTitle: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.BOLD,
    marginLeft: DIMENSIONS.SPACING_SM,
  },
  summaryContent: {
    gap: DIMENSIONS.SPACING_MD,
  },
  summaryMatch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DIMENSIONS.SPACING_MD,
  },
  summaryTeam: {
    fontSize: FONTS.SIZE.MD,
    fontWeight: FONTS.WEIGHT.BOLD,
  },
  summaryVs: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.BOLD,
  },
  summaryDetails: {
    gap: DIMENSIONS.SPACING_SM,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACING_SM,
  },
  summaryText: {
    fontSize: FONTS.SIZE.SM,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: DIMENSIONS.CONTAINER_PADDING,
    paddingBottom:
      Platform.OS === 'ios' ? DIMENSIONS.SPACING_XL : DIMENSIONS.SPACING_MD,
    ...SHADOWS.LARGE,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: DIMENSIONS.SPACING_LG,
    borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
    gap: DIMENSIONS.SPACING_SM,
    ...SHADOWS.MEDIUM,
  },
  createButtonText: {
    fontSize: FONTS.SIZE.LG,
    fontWeight: FONTS.WEIGHT.BOLD,
    color: '#FFFFFF',
  },
});
