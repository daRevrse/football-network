// ====== src/components/common/StepIndicator.js ======
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { COLORS, DIMENSIONS, FONTS } from '../../styles/theme';

export const StepIndicator = ({ steps, currentStep }) => {
  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={step.id}>
            <View style={styles.stepContainer}>
              {/* Circle */}
              <View
                style={[
                  styles.circle,
                  isActive && styles.circleActive,
                  isCompleted && styles.circleCompleted,
                ]}
              >
                {isCompleted ? (
                  <Icon name="check" size={12} color={COLORS.WHITE} />
                ) : (
                  <Text
                    style={[
                      styles.stepNumber,
                      isActive && styles.stepNumberActive,
                    ]}
                  >
                    {stepNumber}
                  </Text>
                )}
              </View>

              {/* Label */}
              <Text
                style={[
                  styles.label,
                  isActive && styles.labelActive,
                  isCompleted && styles.labelCompleted,
                ]}
              >
                {step.label}
              </Text>
            </View>

            {/* Line */}
            {!isLast && (
              <View
                style={[styles.line, isCompleted && styles.lineCompleted]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DIMENSIONS.SPACING_MD,
    paddingVertical: DIMENSIONS.SPACING_SM,
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.BACKGROUND_GRAY,
    borderWidth: 2,
    borderColor: COLORS.BORDER,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACING_XXS,
  },
  circleActive: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  circleCompleted: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  stepNumber: {
    fontSize: FONTS.SIZE.SM,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
    color: COLORS.TEXT_MUTED,
  },
  stepNumberActive: {
    color: COLORS.WHITE,
  },
  label: {
    fontSize: FONTS.SIZE.XXS,
    fontWeight: FONTS.WEIGHT.MEDIUM,
    color: COLORS.TEXT_MUTED,
    textAlign: 'center',
  },
  labelActive: {
    color: COLORS.PRIMARY,
    fontWeight: FONTS.WEIGHT.SEMIBOLD,
  },
  labelCompleted: {
    color: COLORS.PRIMARY,
  },
  line: {
    height: 2,
    flex: 0.5,
    backgroundColor: COLORS.BORDER,
    marginHorizontal: DIMENSIONS.SPACING_XXS,
    marginBottom: 16,
  },
  lineCompleted: {
    backgroundColor: COLORS.PRIMARY,
  },
});
