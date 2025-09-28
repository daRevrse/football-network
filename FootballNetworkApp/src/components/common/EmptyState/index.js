// // ====== src/components/common/EmptyState/index.js ======
// import React from 'react';
// import { View, Text, Image } from 'react-native';
// import { Button } from '@components/common';
// import { COLORS, DIMENSIONS, FONTS } from '@utils/constants';

// const EmptyState = ({
//   icon = null,
//   image = null,
//   title = 'Aucune donnée',
//   message = "Il n'y a rien à afficher pour le moment.",
//   actionText = null,
//   onActionPress = null,
//   style = {},
// }) => {
//   return (
//     <View
//       style={[
//         {
//           flex: 1,
//           justifyContent: 'center',
//           alignItems: 'center',
//           paddingHorizontal: DIMENSIONS.SPACING_XL,
//           paddingVertical: DIMENSIONS.SPACING_XL,
//         },
//         style,
//       ]}
//     >
//       {image && (
//         <Image
//           source={image}
//           style={{
//             width: 120,
//             height: 120,
//             marginBottom: DIMENSIONS.SPACING_LG,
//             opacity: 0.6,
//           }}
//           resizeMode="contain"
//         />
//       )}

//       {icon && !image && (
//         <View style={{ marginBottom: DIMENSIONS.SPACING_LG }}>{icon}</View>
//       )}

//       <Text
//         style={{
//           fontSize: FONTS.SIZE.LG,
//           fontFamily: FONTS.FAMILY.BOLD,
//           color: COLORS.TEXT_PRIMARY,
//           textAlign: 'center',
//           marginBottom: DIMENSIONS.SPACING_SM,
//         }}
//       >
//         {title}
//       </Text>

//       <Text
//         style={{
//           fontSize: FONTS.SIZE.MD,
//           fontFamily: FONTS.FAMILY.REGULAR,
//           color: COLORS.TEXT_SECONDARY,
//           textAlign: 'center',
//           lineHeight: 22,
//           marginBottom: DIMENSIONS.SPACING_LG,
//         }}
//       >
//         {message}
//       </Text>

//       {actionText && onActionPress && (
//         <Button title={actionText} onPress={onActionPress} variant="primary" />
//       )}
//     </View>
//   );
// };

// export default EmptyState;
export default null;
