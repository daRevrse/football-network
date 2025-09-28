// // ====== src/components/common/Button/index.js ======
// import React from 'react';
// import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
// import { COLORS, DIMENSIONS, FONTS } from '@utils/constants';

// const Button = ({
//   title,
//   onPress,
//   variant = 'primary', // primary, secondary, outline, text
//   size = 'medium', // small, medium, large
//   disabled = false,
//   loading = false,
//   icon = null,
//   style = {},
//   textStyle = {},
//   ...props
// }) => {
//   const getButtonStyles = () => {
//     const baseStyles = {
//       borderRadius: DIMENSIONS.BORDER_RADIUS_MD,
//       flexDirection: 'row',
//       alignItems: 'center',
//       justifyContent: 'center',
//     };

//     // Tailles
//     const sizeStyles = {
//       small: { paddingVertical: 8, paddingHorizontal: 16, minHeight: 36 },
//       medium: {
//         paddingVertical: 12,
//         paddingHorizontal: 24,
//         minHeight: DIMENSIONS.BUTTON_HEIGHT,
//       },
//       large: { paddingVertical: 16, paddingHorizontal: 32, minHeight: 56 },
//     };

//     // Variants
//     const variantStyles = {
//       primary: {
//         backgroundColor: disabled ? COLORS.TEXT_MUTED : COLORS.PRIMARY,
//       },
//       secondary: {
//         backgroundColor: disabled ? COLORS.TEXT_MUTED : COLORS.SECONDARY,
//       },
//       outline: {
//         backgroundColor: 'transparent',
//         borderWidth: 1,
//         borderColor: disabled ? COLORS.TEXT_MUTED : COLORS.PRIMARY,
//       },
//       text: {
//         backgroundColor: 'transparent',
//       },
//     };

//     return [baseStyles, sizeStyles[size], variantStyles[variant]];
//   };

//   const getTextStyles = () => {
//     const baseTextStyles = {
//       fontFamily: FONTS.FAMILY.MEDIUM,
//       textAlign: 'center',
//     };

//     // Tailles de texte
//     const sizeTextStyles = {
//       small: { fontSize: FONTS.SIZE.SM },
//       medium: { fontSize: FONTS.SIZE.MD },
//       large: { fontSize: FONTS.SIZE.LG },
//     };

//     // Couleurs selon variant
//     const variantTextStyles = {
//       primary: { color: COLORS.TEXT_WHITE },
//       secondary: { color: COLORS.TEXT_WHITE },
//       outline: { color: disabled ? COLORS.TEXT_MUTED : COLORS.PRIMARY },
//       text: { color: disabled ? COLORS.TEXT_MUTED : COLORS.PRIMARY },
//     };

//     return [baseTextStyles, sizeTextStyles[size], variantTextStyles[variant]];
//   };

//   return (
//     <TouchableOpacity
//       style={[getButtonStyles(), style]}
//       onPress={onPress}
//       disabled={disabled || loading}
//       activeOpacity={0.7}
//       {...props}
//     >
//       {loading ? (
//         <ActivityIndicator
//           size="small"
//           color={
//             variant === 'primary' || variant === 'secondary'
//               ? COLORS.TEXT_WHITE
//               : COLORS.PRIMARY
//           }
//         />
//       ) : (
//         <View style={{ flexDirection: 'row', alignItems: 'center' }}>
//           {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
//           <Text style={[getTextStyles(), textStyle]}>{title}</Text>
//         </View>
//       )}
//     </TouchableOpacity>
//   );
// };

// export default Button;

export default null;
