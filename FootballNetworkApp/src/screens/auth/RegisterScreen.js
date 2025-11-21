// ====== src/screens/auth/RegisterScreen.js ======
import React, { useState } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { ModernButton } from '../../components/common';
import { useAuthImproved } from '../../utils/hooks/useAuthImproved';
import {
  PersonalInfoStep,
  SecurityStep,
  FootballProfileStep,
  SummaryStep,
} from './RegisterSteps';

const DARK_THEME = {
  BG: '#0F172A',
  SURFACE: '#1E293B',
  TEXT: '#F8FAFC',
  TEXT_SEC: '#94A3B8',
  ACCENT: '#22C55E',
  BORDER: '#334155',
};

export const RegisterScreen = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    position: '',
    skillLevel: '',
    locationCity: '',
  });
  const [errors, setErrors] = useState({});
  const { signup, isLoading } = useAuthImproved();

  // ... (Logique de validation identique à avant, je garde l'essentiel) ...
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleNext = () => {
    // Validation simplifiée pour l'exemple
    if (currentStep < 4) setCurrentStep(p => p + 1);
    else handleSignup();
  };

  const handleSignup = async () => {
    await signup(formData);
    // Gérer le succès/échec
  };

  const renderStep = () => {
    const props = { formData, updateField, errors, theme: DARK_THEME };
    switch (currentStep) {
      case 1:
        return <PersonalInfoStep {...props} />;
      case 2:
        return <SecurityStep {...props} />;
      case 3:
        return <FootballProfileStep {...props} />;
      case 4:
        return <SummaryStep {...props} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={DARK_THEME.BG} />

      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            currentStep > 1 ? setCurrentStep(c => c - 1) : navigation.goBack()
          }
          style={styles.backBtn}
        >
          <Icon name="arrow-left" size={24} color={DARK_THEME.TEXT} />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              { width: `${(currentStep / 4) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.stepText}>{currentStep}/4</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {renderStep()}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <ModernButton
          title={currentStep === 4 ? "VALIDER L'INSCRIPTION" : 'SUIVANT'}
          onPress={handleNext}
          variant="primary"
          isLoading={isLoading}
          style={styles.nextButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_THEME.BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingBottom: 20,
  },
  backBtn: {
    padding: 8,
    marginRight: 16,
  },
  progressContainer: {
    flex: 1,
    height: 4,
    backgroundColor: DARK_THEME.SURFACE,
    borderRadius: 2,
    marginRight: 16,
  },
  progressBar: {
    height: '100%',
    backgroundColor: DARK_THEME.ACCENT,
    borderRadius: 2,
  },
  stepText: {
    color: DARK_THEME.TEXT_SEC,
    fontWeight: 'bold',
  },
  content: {
    padding: 24,
  },
  footer: {
    padding: 24,
    backgroundColor: DARK_THEME.BG,
    borderTopWidth: 1,
    borderTopColor: DARK_THEME.BORDER,
  },
  nextButton: {
    backgroundColor: DARK_THEME.ACCENT,
    height: 56,
    borderRadius: 16,
  },
});
