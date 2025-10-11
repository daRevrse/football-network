// ====== src/screens/profile/HelpScreen.js - NOUVEAU DESIGN ======
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  Linking,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { DIMENSIONS, FONTS, SHADOWS } from '../../styles/theme';

const { width } = Dimensions.get('window');

// Composant CategoryCard
const CategoryCard = ({ icon, title, description, onPress, gradient }) => (
  <TouchableOpacity
    style={styles.categoryCard}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.categoryGradient}
    >
      <View style={styles.categoryIconContainer}>
        <Icon name={icon} size={28} color="#FFF" />
      </View>
      <Text style={styles.categoryTitle}>{title}</Text>
      <Text style={styles.categoryDescription}>{description}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

// Composant FAQItem
const FAQItem = ({ question, answer, isOpen, onToggle }) => (
  <TouchableOpacity
    style={styles.faqItem}
    onPress={onToggle}
    activeOpacity={0.7}
  >
    <View style={styles.faqHeader}>
      <View style={styles.faqIconContainer}>
        <Icon name="help-circle" size={20} color="#22C55E" />
      </View>
      <Text style={styles.faqQuestion}>{question}</Text>
      <Icon
        name={isOpen ? 'chevron-up' : 'chevron-down'}
        size={20}
        color="#6B7280"
      />
    </View>
    {isOpen && (
      <View style={styles.faqAnswerContainer}>
        <Text style={styles.faqAnswer}>{answer}</Text>
      </View>
    )}
  </TouchableOpacity>
);

// Composant ActionCard
const ActionCard = ({ icon, title, description, onPress, gradient }) => (
  <TouchableOpacity
    style={styles.actionCard}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.actionGradient}
    >
      <View style={styles.actionIconContainer}>
        <Icon name={icon} size={24} color="#FFF" />
      </View>
      <View style={styles.actionContent}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionDescription}>{description}</Text>
      </View>
      <Icon name="chevron-right" size={24} color="#FFF" />
    </LinearGradient>
  </TouchableOpacity>
);

export const HelpScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqId, setOpenFaqId] = useState(null);

  const helpCategories = [
    {
      id: '1',
      title: 'Compte',
      description: 'Inscription & profil',
      icon: 'user',
      gradient: ['#22C55E', '#16A34A'],
    },
    {
      id: '2',
      title: 'Équipes',
      description: 'Créer & gérer',
      icon: 'users',
      gradient: ['#F59E0B', '#D97706'],
    },
    {
      id: '3',
      title: 'Matchs',
      description: 'Organiser & rejoindre',
      icon: 'calendar',
      gradient: ['#3B82F6', '#2563EB'],
    },
    {
      id: '4',
      title: 'Notifications',
      description: 'Paramètres',
      icon: 'bell',
      gradient: ['#8B5CF6', '#7C3AED'],
    },
  ];

  const [faqItems] = useState([
    {
      id: '1',
      question: 'Comment créer une équipe ?',
      answer:
        "Allez dans l'onglet Équipes, appuyez sur '+', remplissez les informations et invitez des joueurs.",
    },
    {
      id: '2',
      question: 'Comment inviter des joueurs ?',
      answer:
        "Dans votre équipe, appuyez sur 'Inviter', recherchez par nom ou invitez par email.",
    },
    {
      id: '3',
      question: 'Comment organiser un match ?',
      answer:
        "Allez dans Matchs, appuyez sur '+', choisissez les équipes, la date et le lieu.",
    },
    {
      id: '4',
      question: 'Comment modifier mon profil ?',
      answer:
        "Allez dans Profil, appuyez sur 'Modifier le profil', changez vos informations.",
    },
    {
      id: '5',
      question: 'Je ne reçois pas de notifications',
      answer:
        'Vérifiez Paramètres > Notifications et les autorisations de votre appareil.',
    },
  ]);

  const filteredFaq = searchQuery
    ? faqItems.filter(
        item =>
          item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.answer.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : faqItems;

  const handleToggleFaq = useCallback(faqId => {
    setOpenFaqId(prev => (prev === faqId ? null : faqId));
  }, []);

  const handleContactSupport = useCallback(() => {
    Alert.alert(
      'Contacter le support',
      'Comment souhaitez-vous nous contacter ?',
      [
        {
          text: 'Email',
          onPress: () => Linking.openURL('mailto:support@app.com'),
        },
        {
          text: 'Chat',
          onPress: () => Alert.alert('Info', 'Bientôt disponible'),
        },
        { text: 'Annuler', style: 'cancel' },
      ],
    );
  }, []);

  const handleReportBug = useCallback(() => {
    Alert.alert('Signaler un bug', 'Décrivez le problème', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Envoyer',
        onPress: () => Alert.alert('Merci', 'Signalement envoyé'),
      },
    ]);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={['#F59E0B', '#D97706']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Icon name="help-circle" size={24} color="#FFF" />
          <Text style={styles.headerTitle}>Centre d'aide</Text>
        </View>

        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Barre de recherche */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher dans l'aide..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="x" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Catégories */}
        {searchQuery === '' && (
          <View style={styles.categoriesSection}>
            <Text style={styles.sectionTitle}>Catégories</Text>
            <View style={styles.categoriesGrid}>
              {helpCategories.map(category => (
                <CategoryCard
                  key={category.id}
                  icon={category.icon}
                  title={category.title}
                  description={category.description}
                  onPress={() => {}}
                  gradient={category.gradient}
                />
              ))}
            </View>
          </View>
        )}

        {/* FAQ */}
        <View style={styles.faqSection}>
          <View style={styles.sectionHeader}>
            <Icon name="message-circle" size={20} color="#22C55E" />
            <Text style={styles.sectionTitle}>Questions fréquentes</Text>
          </View>

          {filteredFaq.length > 0 ? (
            <View style={styles.faqList}>
              {filteredFaq.map(faq => (
                <FAQItem
                  key={faq.id}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openFaqId === faq.id}
                  onToggle={() => handleToggleFaq(faq.id)}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Icon name="search" size={56} color="#CBD5E1" />
              <Text style={styles.emptyStateText}>Aucun résultat trouvé</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <View style={styles.sectionHeader}>
            <Icon name="life-buoy" size={20} color="#22C55E" />
            <Text style={styles.sectionTitle}>Besoin d'aide ?</Text>
          </View>

          <ActionCard
            icon="mail"
            title="Contacter le support"
            description="Email, Chat, Réseaux sociaux"
            onPress={handleContactSupport}
            gradient={['#22C55E', '#16A34A']}
          />

          <ActionCard
            icon="alert-circle"
            title="Signaler un bug"
            description="Aidez-nous à améliorer l'app"
            onPress={handleReportBug}
            gradient={['#F59E0B', '#D97706']}
          />
        </View>

        {/* Info */}
        <View style={styles.infoBox}>
          <LinearGradient
            colors={['#3B82F615', '#3B82F605']}
            style={styles.infoGradient}
          >
            <Icon name="info" size={20} color="#3B82F6" />
            <Text style={styles.infoText}>
              Temps de réponse moyen du support : 24h
            </Text>
          </LinearGradient>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    ...SHADOWS.MEDIUM,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 24,
    gap: 12,
    ...SHADOWS.SMALL,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
  },
  categoriesSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: (width - 52) / 2,
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.SMALL,
  },
  categoryGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIconContainer: {
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  categoryDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  faqSection: {
    marginBottom: 24,
  },
  faqList: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.SMALL,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  faqIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#22C55E15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 8,
  },
  faqAnswerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingLeft: 64,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 16,
  },
  actionsSection: {
    marginBottom: 24,
  },
  actionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    ...SHADOWS.SMALL,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
  infoBox: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  infoGradient: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 20,
  },
});
