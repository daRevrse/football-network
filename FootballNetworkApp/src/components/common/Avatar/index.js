// // ====== src/components/common/Avatar/index.js ======
// import React from 'react';
// import { View, Image, Text } from 'react-native';
// import { COLORS, FONTS } from '@utils/constants';

// const Avatar = ({
//   source = null,
//   name = '',
//   size = 50,
//   style = {},
//   textStyle = {},
// }) => {
//   const getInitials = fullName => {
//     if (!fullName) return '?';
//     const names = fullName.trim().split(' ');
//     if (names.length === 1) return names[0].charAt(0).toUpperCase();
//     return (
//       names[0].charAt(0) + names[names.length - 1].charAt(0)
//     ).toUpperCase();
//   };

//   const avatarStyle = {
//     width: size,
//     height: size,
//     borderRadius: size / 2,
//     backgroundColor: COLORS.PRIMARY_LIGHT,
//     justifyContent: 'center',
//     alignItems: 'center',
//   };

//   const textSize = size * 0.4;

//   if (source && source.uri) {
//     return (
//       <Image source={source} style={[avatarStyle, style]} resizeMode="cover" />
//     );
//   }

//   return (
//     <View style={[avatarStyle, style]}>
//       <Text
//         style={[
//           {
//             fontSize: textSize,
//             fontFamily: FONTS.FAMILY.BOLD,
//             color: COLORS.PRIMARY,
//           },
//           textStyle,
//         ]}
//       >
//         {getInitials(name)}
//       </Text>
//     </View>
//   );
// };

// export default Avatar;
export default null;
