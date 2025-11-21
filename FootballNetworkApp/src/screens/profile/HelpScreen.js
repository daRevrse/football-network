// ====== src/screens/profile/HelpScreen.js ======
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
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

const FaqItem = ({ question, answer }) => (
  <View style={styles.faqItem}>
    <View style={styles.faqHeader}>
      <Icon name="help-circle" size={20} color={THEME.ACCENT} />
      <Text style={styles.question}>{question}</Text>
    </View>
    <Text style={styles.answer}>{answer}</Text>
  </View>
);

export const HelpScreen = ({ navigation }) => {
  const handleContact = () => {
    Linking.openURL('mailto:support@footballnetwork.com');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.BG} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={THEME.TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Aide & Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Icon name="life-buoy" size={48} color={THEME.ACCENT} />
          <Text style={styles.heroTitle}>Comment pouvons-nous aider ?</Text>
          <Text style={styles.heroSubtitle}>
            Trouvez des réponses aux questions fréquentes ou contactez-nous
            directement.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Questions Fréquentes</Text>

        <FaqItem
          question="Comment créer une équipe ?"
          answer="Allez dans l'onglet Équipes, appuyez sur le bouton '+' et suivez les étapes."
        />
        <FaqItem
          question="Comment inviter des joueurs ?"
          answer="Dans le détail de votre équipe, utilisez l'option 'Inviter' pour chercher des joueurs par nom."
        />
        <FaqItem
          question="Puis-je changer mon poste ?"
          answer="Oui, allez dans Profil > Modifier et mettez à jour votre position préférée."
        />

        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Besoin de plus d'aide ?</Text>
          <TouchableOpacity style={styles.contactBtn} onPress={handleContact}>
            <Icon name="mail" size={20} color="#FFF" />
            <Text style={styles.contactBtnText}>Contacter le support</Text>
          </TouchableOpacity>
        </View>
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
  hero: { alignItems: 'center', marginBottom: 32, paddingHorizontal: 20 },
  heroTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: THEME.TEXT,
    marginTop: 16,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    color: THEME.TEXT_SEC,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  sectionTitle: {
    color: THEME.ACCENT,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 16,
    letterSpacing: 1,
  },
  faqItem: {
    backgroundColor: THEME.SURFACE,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.BORDER,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  question: { fontSize: 16, fontWeight: '600', color: THEME.TEXT, flex: 1 },
  answer: {
    fontSize: 14,
    color: THEME.TEXT_SEC,
    lineHeight: 20,
    paddingLeft: 30,
  },
  contactSection: { marginTop: 32, alignItems: 'center' },
  contactTitle: {
    fontSize: 16,
    color: THEME.TEXT,
    marginBottom: 16,
    fontWeight: '600',
  },
  contactBtn: {
    flexDirection: 'row',
    backgroundColor: THEME.ACCENT,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    alignItems: 'center',
    gap: 10,
  },
  contactBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
});
