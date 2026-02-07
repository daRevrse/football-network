/**
 * RoleCard - Carte de sélection de rôle avec animation
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather as Icon } from '@expo/vector-icons';
import { COLORS, RADIUS, SHADOWS } from '../../theme/colors';

// Mapping des icônes pour chaque rôle
const ROLE_ICONS = {
  player: 'user',
  manager: 'clipboard',
  referee: 'flag',
  venue_owner: 'home',
};

// Couleurs par rôle
const ROLE_COLORS = {
  player: COLORS.ROLE_PLAYER,
  manager: COLORS.ROLE_MANAGER,
  referee: COLORS.ROLE_REFEREE,
  venue_owner: COLORS.ROLE_VENUE_OWNER,
};

export const RoleCard = ({
  role = 'player',
  title = '',
  description = '',
  icon = null,
  selected = false,
  onPress,
  style = {},
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(glowAnim, {
      toValue: selected ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [selected]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const iconName = icon || ROLE_ICONS[role] || 'user';
  const roleColor = ROLE_COLORS[role] || COLORS.PRIMARY;

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.GLASS_BORDER, COLORS.PRIMARY],
  });

  return (
    <Animated.View
      style={[
        { transform: [{ scale: scaleAnim }] },
        selected && SHADOWS.glow,
        style,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <Animated.View
          style={[
            styles.card,
            { borderColor },
            selected && styles.cardSelected,
          ]}
        >
          {/* Fond gradient subtil si sélectionné */}
          {selected && (
            <LinearGradient
              colors={['rgba(0, 123, 64, 0.15)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          )}

          {/* Icône dans un cercle */}
          <View
            style={[
              styles.iconContainer,
              selected && { backgroundColor: COLORS.PRIMARY },
            ]}
          >
            <Icon
              name={iconName}
              size={24}
              color={selected ? COLORS.WHITE : roleColor}
            />
          </View>

          {/* Titre */}
          <Text style={[styles.title, selected && styles.titleSelected]}>
            {title}
          </Text>

          {/* Description */}
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>

          {/* Indicateur de sélection */}
          {selected && (
            <View style={styles.checkContainer}>
              <Icon name="check" size={16} color={COLORS.WHITE} />
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

/**
 * RoleCardHorizontal - Version horizontale pour listes
 */
export const RoleCardHorizontal = ({
  role = 'player',
  title = '',
  description = '',
  icon = null,
  selected = false,
  onPress,
  style = {},
}) => {
  const iconName = icon || ROLE_ICONS[role] || 'user';
  const roleColor = ROLE_COLORS[role] || COLORS.PRIMARY;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.horizontalCard,
        selected && styles.horizontalCardSelected,
        style,
      ]}
    >
      {/* Icône */}
      <View
        style={[
          styles.horizontalIcon,
          selected && { backgroundColor: COLORS.PRIMARY },
        ]}
      >
        <Icon
          name={iconName}
          size={20}
          color={selected ? COLORS.WHITE : roleColor}
        />
      </View>

      {/* Texte */}
      <View style={styles.horizontalContent}>
        <Text style={[styles.horizontalTitle, selected && styles.titleSelected]}>
          {title}
        </Text>
        <Text style={styles.horizontalDescription} numberOfLines={1}>
          {description}
        </Text>
      </View>

      {/* Indicateur */}
      <View
        style={[
          styles.radioOuter,
          selected && styles.radioOuterSelected,
        ]}
      >
        {selected && <View style={styles.radioInner} />}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Carte verticale (grille)
  card: {
    backgroundColor: COLORS.GLASS,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.GLASS_BORDER,
    padding: 20,
    alignItems: 'center',
    minHeight: 150,
    overflow: 'hidden',
  },
  cardSelected: {
    backgroundColor: 'rgba(0, 123, 64, 0.1)',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.GLASS,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 6,
  },
  titleSelected: {
    color: COLORS.PRIMARY,
  },
  description: {
    fontSize: 12,
    color: COLORS.TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 16,
  },
  checkContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Carte horizontale
  horizontalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.GLASS,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.GLASS_BORDER,
    padding: 16,
    marginBottom: 12,
  },
  horizontalCardSelected: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: 'rgba(0, 123, 64, 0.1)',
  },
  horizontalIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.GLASS,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  horizontalContent: {
    flex: 1,
  },
  horizontalTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  horizontalDescription: {
    fontSize: 12,
    color: COLORS.TEXT_MUTED,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: COLORS.PRIMARY,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.PRIMARY,
  },
});

export default RoleCard;
