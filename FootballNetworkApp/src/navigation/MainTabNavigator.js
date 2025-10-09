// ====== src/navigation/MainTabNavigator.js ======
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { DashboardScreen } from '../screens/dashboard';
import { TeamsStackNavigator } from './TeamsStackNavigator';
import { useTheme } from '../hooks/useTheme';
import { DIMENSIONS, FONTS, SHADOWS } from '../styles/theme';

const Tab = createBottomTabNavigator();

// Composant pour les écrans "Coming Soon"
const ComingSoonScreen = ({ title, description, iconName }) => {
  const { colors: COLORS } = useTheme('auto');

  return (
    <View
      style={[
        styles.comingSoonContainer,
        { backgroundColor: COLORS.BACKGROUND_LIGHT },
      ]}
    >
      <View
        style={[
          styles.comingSoonIconContainer,
          { backgroundColor: COLORS.PRIMARY_ULTRA_LIGHT },
        ]}
      >
        <Icon name={iconName || 'package'} size={64} color={COLORS.PRIMARY} />
      </View>

      <Text style={[styles.comingSoonTitle, { color: COLORS.TEXT_PRIMARY }]}>
        {title}
      </Text>

      <Text
        style={[styles.comingSoonDescription, { color: COLORS.TEXT_SECONDARY }]}
      >
        {description || 'Cette fonctionnalité sera bientôt disponible !'}
      </Text>

      <View
        style={[
          styles.comingSoonBadge,
          { backgroundColor: COLORS.WARNING_LIGHT },
        ]}
      >
        <Icon name="clock" size={16} color={COLORS.WARNING} />
        <Text style={[styles.comingSoonBadgeText, { color: COLORS.WARNING }]}>
          En développement
        </Text>
      </View>
    </View>
  );
};

const SearchScreen = () => (
  <ComingSoonScreen
    title="Recherche d'équipes"
    description="Trouvez des équipes et des adversaires près de chez vous"
    iconName="search"
  />
);

const MatchesScreen = () => (
  <ComingSoonScreen
    title="Mes matchs"
    description="Gérez vos matchs passés et à venir"
    iconName="calendar"
  />
);

const ProfileScreen = () => (
  <ComingSoonScreen
    title="Mon profil"
    description="Consultez et modifiez vos informations"
    iconName="user"
  />
);

// Icône de Tab Bar avec badge
const TabBarIcon = ({ focused, iconName, badgeCount }) => {
  const { colors: COLORS } = useTheme('auto');
  const color = focused ? COLORS.PRIMARY : COLORS.TEXT_MUTED;

  return (
    <View style={styles.tabIconContainer}>
      <View
        style={[
          styles.tabIconWrapper,
          focused && { backgroundColor: COLORS.PRIMARY_ULTRA_LIGHT },
        ]}
      >
        <Icon name={iconName} size={24} color={color} />
      </View>

      {badgeCount > 0 && (
        <View style={[styles.badge, { backgroundColor: COLORS.ERROR }]}>
          <Text style={styles.badgeText}>
            {badgeCount > 9 ? '9+' : badgeCount}
          </Text>
        </View>
      )}
    </View>
  );
};

export const MainTabNavigator = () => {
  const { colors: COLORS, isDark } = useTheme('auto');

  // Sélecteurs sécurisés avec valeurs par défaut
  const notificationsState = useSelector(state => {
    if (!state || !state.notifications) return { unreadCount: 0 };
    return state.notifications;
  });

  const matchesState = useSelector(state => {
    if (!state || !state.matches) return { invitations: [] };
    return state.matches;
  });

  const { unreadCount } = notificationsState;
  const { invitations } = matchesState;
  const pendingInvitations = invitations.filter(
    inv => inv.status === 'pending',
  ).length;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => {
          let iconName;
          let badgeCount = 0;

          if (route.name === 'Dashboard') {
            iconName = 'home';
          } else if (route.name === 'Teams') {
            iconName = 'users';
          } else if (route.name === 'Search') {
            iconName = 'search';
          } else if (route.name === 'Matches') {
            iconName = 'calendar';
            badgeCount = pendingInvitations;
          } else if (route.name === 'Profile') {
            iconName = 'user';
            badgeCount = unreadCount;
          }

          return (
            <TabBarIcon
              focused={focused}
              iconName={iconName}
              badgeCount={badgeCount}
            />
          );
        },
        tabBarActiveTintColor: COLORS.PRIMARY,
        tabBarInactiveTintColor: COLORS.TEXT_MUTED,
        tabBarStyle: {
          backgroundColor: COLORS.WHITE,
          borderTopColor: COLORS.BORDER,
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
          ...SHADOWS.MEDIUM,
        },
        tabBarLabelStyle: {
          fontSize: FONTS.SIZE.XS,
          fontWeight: FONTS.WEIGHT.MEDIUM,
          marginTop: 4,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Accueil' }}
      />
      <Tab.Screen
        name="Teams"
        component={TeamsStackNavigator}
        options={{ title: 'Équipes' }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{ title: 'Recherche' }}
      />
      <Tab.Screen
        name="Matches"
        component={MatchesScreen}
        options={{ title: 'Matchs' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profil' }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  // Tab Icon Styles
  tabIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrapper: {
    width: 48,
    height: 32,
    borderRadius: DIMENSIONS.BORDER_RADIUS_LG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    right: -2,
    top: -6,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: FONTS.SIZE.XXS,
    fontWeight: FONTS.WEIGHT.BOLD,
  },

  // Coming Soon Styles
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.CONTAINER_PADDING * 2,
  },
  comingSoonIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACING_XL,
    ...SHADOWS.LARGE,
  },
  comingSoonTitle: {
    fontSize: FONTS.SIZE.XXL,
    fontWeight: FONTS.WEIGHT.BOLD,
    marginBottom: DIMENSIONS.SPACING_MD,
    textAlign: 'center',
  },
  comingSoonDescription: {
    fontSize: FONTS.SIZE.MD,
    textAlign: 'center',
    lineHeight: FONTS.SIZE.MD * FONTS.LINE_HEIGHT.RELAXED,
    marginBottom: DIMENSIONS.SPACING_XL,
  },
  comingSoonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.SPACING_MD,
    paddingVertical: DIMENSIONS.SPACING_SM,
    borderRadius: DIMENSIONS.BORDER_RADIUS_FULL,
    gap: DIMENSIONS.SPACING_XS,
  },
  comingSoonBadgeText: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
  },
});
