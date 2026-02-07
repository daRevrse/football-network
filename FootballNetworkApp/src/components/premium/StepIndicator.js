/**
 * StepIndicator - Indicateur d'étapes pour formulaires multi-steps
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../../theme/colors';

export const StepIndicator = ({
  steps = [],
  currentStep = 0,
  style = {},
}) => {
  const renderStep = (step, index) => {
    const isCompleted = index < currentStep;
    const isActive = index === currentStep;
    const isFuture = index > currentStep;

    return (
      <View key={index} style={styles.stepWrapper}>
        {/* Ligne de connexion (avant le step, sauf le premier) */}
        {index > 0 && (
          <View
            style={[
              styles.connector,
              isCompleted || isActive ? styles.connectorActive : styles.connectorInactive,
            ]}
          />
        )}

        {/* Cercle du step */}
        <View style={styles.stepContainer}>
          <View
            style={[
              styles.circle,
              isCompleted && styles.circleCompleted,
              isActive && styles.circleActive,
              isFuture && styles.circleFuture,
            ]}
          >
            {isCompleted ? (
              <Icon name="check" size={14} color={COLORS.WHITE} />
            ) : (
              <Text
                style={[
                  styles.stepNumber,
                  isActive && styles.stepNumberActive,
                  isFuture && styles.stepNumberFuture,
                ]}
              >
                {index + 1}
              </Text>
            )}
          </View>

          {/* Label du step */}
          {step.label && (
            <Text
              style={[
                styles.label,
                isActive && styles.labelActive,
                isFuture && styles.labelFuture,
              ]}
              numberOfLines={1}
            >
              {step.label}
            </Text>
          )}
        </View>

        {/* Ligne de connexion (après le step, sauf le dernier) */}
        {index < steps.length - 1 && (
          <View
            style={[
              styles.connector,
              isCompleted ? styles.connectorActive : styles.connectorInactive,
            ]}
          />
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {steps.map((step, index) => renderStep(step, index))}
    </View>
  );
};

/**
 * StepIndicatorCompact - Version compacte avec barre de progression
 */
export const StepIndicatorCompact = ({
  totalSteps = 4,
  currentStep = 0,
  style = {},
}) => {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <View style={[styles.compactContainer, style]}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.progressText}>
        Étape {currentStep + 1} sur {totalSteps}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  stepWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  stepContainer: {
    alignItems: 'center',
  },
  connector: {
    flex: 1,
    height: 2,
    marginTop: 14,
    marginHorizontal: 4,
  },
  connectorActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  connectorInactive: {
    backgroundColor: COLORS.BORDER,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  circleCompleted: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  circleActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  circleFuture: {
    backgroundColor: 'transparent',
    borderColor: COLORS.BORDER,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  stepNumberActive: {
    color: COLORS.WHITE,
  },
  stepNumberFuture: {
    color: COLORS.TEXT_MUTED,
  },
  label: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    maxWidth: 60,
  },
  labelActive: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  labelFuture: {
    color: COLORS.TEXT_MUTED,
  },

  // Compact version
  compactContainer: {
    paddingVertical: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.BORDER,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.PRIMARY,
    borderRadius: RADIUS.full,
  },
  progressText: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
});

export default StepIndicator;
