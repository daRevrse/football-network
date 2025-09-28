// ====== App.js ======
import React, { useEffect } from 'react';
import { StatusBar, View, Text } from 'react-native';
import { Provider } from 'react-redux';
import { store } from './src/store/store'; // Import direct du store
import { AppNavigator } from './src/navigation/AppNavigator';

// Constantes en dur pour éviter les erreurs d'imports
const COLORS = {
  PRIMARY: '#22C55E',
  SUCCESS: '#10B981',
  ERROR: '#EF4444',
  TEXT_WHITE: '#FFFFFF',
};

// Configuration du Toast simple
const ToastConfig = {
  success: ({ text1, text2 }) => (
    <View
      style={{
        height: 60,
        width: '90%',
        backgroundColor: COLORS.SUCCESS,
        borderRadius: 8,
        paddingHorizontal: 16,
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      }}
    >
      <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: 'bold' }}>
        {text1}
      </Text>
      {text2 && (
        <Text style={{ color: COLORS.TEXT_WHITE, fontSize: 12 }}>{text2}</Text>
      )}
    </View>
  ),
  error: ({ text1, text2 }) => (
    <View
      style={{
        height: 60,
        width: '90%',
        backgroundColor: COLORS.ERROR,
        borderRadius: 8,
        paddingHorizontal: 16,
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      }}
    >
      <Text style={{ color: COLORS.TEXT_WHITE, fontWeight: 'bold' }}>
        {text1}
      </Text>
      {text2 && (
        <Text style={{ color: COLORS.TEXT_WHITE, fontSize: 12 }}>{text2}</Text>
      )}
    </View>
  ),
};

const App = () => {
  useEffect(() => {
    // Initialiser les services
    initializeServices();
  }, []);

  const initializeServices = async () => {
    try {
      // Initialiser les services (version simplifiée pour l'instant)
      console.log('Services initialisés');
    } catch (error) {
      console.error("Erreur lors de l'initialisation des services:", error);
    }
  };

  return (
    <Provider store={store}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.PRIMARY}
        translucent={false}
      />
      <AppNavigator />
    </Provider>
  );
};

export default App;
