/**
 * TutorialScreen - Interactive tutorial based on user role
 * Guides users through key features
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Animated,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather as Icon } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

const ONBOARDING_COMPLETE_KEY = '@football_network_onboarding_complete';

const { width, height } = Dimensions.get('window');

// Tutorial steps for each role
const TUTORIALS = {
  player: [
    {
      id: '1',
      icon: 'users',
      title: 'Rejoindre une equipe',
      description: 'Recherchez des equipes pres de chez vous et demandez a les rejoindre.',
      action: 'Allez dans Equipes > Rechercher',
    },
    {
      id: '2',
      icon: 'calendar',
      title: 'Participer aux matchs',
      description: 'Confirmez votre participation aux matchs organises par votre manager.',
      action: 'Allez dans Matchs > A venir',
    },
    {
      id: '3',
      icon: 'star',
      title: 'Suivez vos performances',
      description: 'Consultez vos statistiques et votre note moyenne apres chaque match.',
      action: 'Allez dans Profil > Statistiques',
    },
  ],
  manager: [
    {
      id: '1',
      icon: 'shield',
      title: 'Creez votre equipe',
      description: 'Creez une equipe et personnalisez-la avec un logo et une description.',
      action: 'Appuyez sur + > Nouvelle equipe',
    },
    {
      id: '2',
      icon: 'user-plus',
      title: 'Recrutez des joueurs',
      description: 'Invitez des joueurs a rejoindre votre equipe.',
      action: 'Allez dans Equipe > Inviter',
    },
    {
      id: '3',
      icon: 'calendar',
      title: 'Organisez des matchs',
      description: 'Creez des matchs et invitez d\'autres equipes a jouer.',
      action: 'Appuyez sur + > Nouveau match',
    },
    {
      id: '4',
      icon: 'star',
      title: 'Notez vos joueurs',
      description: 'Apres chaque match, evaluez les performances de vos joueurs.',
      action: 'Allez dans Match termine > Noter',
    },
  ],
  referee: [
    {
      id: '1',
      icon: 'calendar',
      title: 'Vos matchs assignes',
      description: 'Consultez les matchs qui vous ont ete attribues.',
      action: 'Allez dans Matchs',
    },
    {
      id: '2',
      icon: 'file-text',
      title: 'Fiche de match',
      description: 'Acedez a la fiche de match avec les rosters des deux equipes.',
      action: 'Allez dans Match > Fiche',
    },
    {
      id: '3',
      icon: 'edit-3',
      title: 'Rapport de match',
      description: 'Enregistrez les buts, cartons et redigez votre rapport.',
      action: 'Allez dans Match > Rapport',
    },
  ],
  venue_owner: [
    {
      id: '1',
      icon: 'map-pin',
      title: 'Ajoutez votre terrain',
      description: 'Creez une fiche pour votre terrain avec photos et tarifs.',
      action: 'Allez dans Terrains > Ajouter',
    },
    {
      id: '2',
      icon: 'clock',
      title: 'Gerez les disponibilites',
      description: 'Definissez les creneaux horaires disponibles.',
      action: 'Allez dans Terrain > Disponibilites',
    },
    {
      id: '3',
      icon: 'check-circle',
      title: 'Validez les reservations',
      description: 'Acceptez ou refusez les demandes de reservation.',
      action: 'Allez dans Reservations',
    },
  ],
};

export const TutorialScreen = ({ navigation, route }) => {
  const { userType = 'player' } = route.params || {};
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const tutorials = TUTORIALS[userType] || TUTORIALS.player;

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const goToNext = () => {
    if (currentIndex < tutorials.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    try {
      // Mark onboarding as complete
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }

    // If user can go back (came from registration after being authenticated), just go back
    // Otherwise, this was from the onboarding flow - navigate to Login
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // Fallback: navigate to Login which will redirect to main if authenticated
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  };

  const renderStep = ({ item, index }) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.9, 1, 0.9],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.stepContainer,
          { transform: [{ scale }] },
        ]}
      >
        <View style={styles.stepNumber}>
          <Text style={styles.stepNumberText}>{index + 1}</Text>
        </View>

        <View style={styles.iconContainer}>
          <Icon name={item.icon} size={64} color={COLORS.PRIMARY} />
        </View>

        <Text style={styles.stepTitle}>{item.title}</Text>
        <Text style={styles.stepDescription}>{item.description}</Text>

        <View style={styles.actionContainer}>
          <Icon name="arrow-right" size={16} color={COLORS.PRIMARY} />
          <Text style={styles.actionText}>{item.action}</Text>
        </View>
      </Animated.View>
    );
  };

  const renderPagination = () => {
    return (
      <View style={styles.paginationContainer}>
        {tutorials.map((_, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.4, 1, 0.4],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                { width: dotWidth, opacity },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BACKGROUND} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Guide rapide</Text>
        <TouchableOpacity style={styles.skipButton} onPress={handleFinish}>
          <Text style={styles.skipText}>Passer</Text>
        </TouchableOpacity>
      </View>

      {/* Steps */}
      <Animated.FlatList
        ref={flatListRef}
        data={tutorials}
        renderItem={renderStep}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      {/* Bottom section */}
      <View style={styles.bottomContainer}>
        {renderPagination()}

        <TouchableOpacity style={styles.nextButton} onPress={goToNext}>
          <Text style={styles.nextButtonText}>
            {currentIndex === tutorials.length - 1 ? 'Commencer' : 'Suivant'}
          </Text>
          <Icon
            name={currentIndex === tutorials.length - 1 ? 'check' : 'arrow-right'}
            size={20}
            color={COLORS.TEXT_WHITE}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    color: COLORS.TEXT_MUTED,
    fontSize: 16,
  },
  stepContainer: {
    width,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.PRIMARY}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: `${COLORS.PRIMARY}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: 16,
  },
  stepDescription: {
    fontSize: 16,
    color: COLORS.TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.PRIMARY}10`,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 14,
    color: COLORS.PRIMARY,
    fontWeight: '500',
    marginLeft: 8,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 40,
    paddingBottom: 50,
    alignItems: 'center',
    backgroundColor: COLORS.BACKGROUND,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.PRIMARY,
    marginHorizontal: 4,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    width: '100%',
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.TEXT_WHITE,
    marginRight: 8,
  },
});

export default TutorialScreen;
