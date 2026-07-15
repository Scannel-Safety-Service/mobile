import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

export function BackgroundLogo() {
  return (
    <View style={styles.backgroundWrapper} pointerEvents="none">
      <Image
        source={require('@/assets/images/logo-icon.png')}
        style={styles.backgroundImage}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundImage: {
    width: '70%',
    height: '70%',
    opacity: 0.05, // Subtle low opacity so it does not distract from screen contents
  },
});
