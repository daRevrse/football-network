import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

const LoadingSpinner = ({
  size = 'large',
  color = '#22C55E',
  message = 'Chargement...',
  style = {},
  showMessage = true,
}) => {
  return (
    <View
      style={[
        {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#F8FAFC',
        },
        style,
      ]}
    >
      <ActivityIndicator size={size} color={color} />
      {showMessage && (
        <Text
          style={{
            marginTop: 16,
            fontSize: 16,
            color: '#6B7280',
            textAlign: 'center',
          }}
        >
          {message}
        </Text>
      )}
    </View>
  );
};

export default LoadingSpinner;
