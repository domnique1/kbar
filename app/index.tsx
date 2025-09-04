// app/index.tsx

import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      // @ts-ignore - Expo Router has type issues but this works
      router.replace('/login');  // After 3 seconds go to login screen
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Image
          source={require('../assets/images/logo.jpg')}
          style={styles.logo}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color="#fff" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 30,
  },
});