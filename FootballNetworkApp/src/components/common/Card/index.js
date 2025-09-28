// // ====== src/components/common/Card/index.js ======
// import React from 'react';
// import { View, TouchableOpacity } from 'react-native';
// import { COLORS, DIMENSIONS } from '@utils/constants';

// const Card = ({
//   children,
//   onPress = null,
//   style = {},
//   pressable = true,
//   shadow = true,
//   ...props
// }) => {
//   const cardStyle = {
//     backgroundColor: COLORS.CARD_BACKGROUND,
//     borderRadius: DIMENSIONS.BORDER_RADIUS_LG,
//     padding: DIMENSIONS.SPACING_MD,
//     marginVertical: DIMENSIONS.SPACING_SM,
//     ...(shadow && {
//       shadowColor: '#000',
//       shadowOffset: {
//         width: 0,
//         height: 2,
//       },
//       shadowOpacity: 0.1,
//       shadowRadius: 3.84,
//       elevation: 5,
//     }),
//   };

//   if (onPress && pressable) {
//     return (
//       <TouchableOpacity
//         style={[cardStyle, style]}
//         onPress={onPress}
//         activeOpacity={0.7}
//         {...props}
//       >
//         {children}
//       </TouchableOpacity>
//     );
//   }

//   return (
//     <View style={[cardStyle, style]} {...props}>
//       {children}
//     </View>
//   );
// };

// export default Card;

export default null;
