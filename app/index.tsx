// app/index.tsx
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SplashScreen() {
  const router = useRouter();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const bgOpacity = useRef(new Animated.Value(1)).current;
  
  // Loading dots animation
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Phase 1: Logo entrance (0-1.5s)
    Animated.parallel([
      // Logo fade and scale with gentle overshoot
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.1,
          tension: 100,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      // Subtle rotation (-3deg to 3deg)
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: -0.05, // -3 degrees in radians
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0.05, // 3 degrees in radians
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Phase 2: Background transition (1.5-2s)
    setTimeout(() => {
      Animated.timing(bgOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 1500);

    // Loading dots animation (sequential pulse)
    Animated.loop(
      Animated.sequence([
        Animated.timing(dot1Anim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(dot2Anim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(dot3Anim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(dot1Anim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(dot2Anim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(dot3Anim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Phase 3: Navigate to login (3s total)
    const timer = setTimeout(() => {
      router.replace('/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  // Colors
  const gradientColors = ['#00ADEF', '#2b5876'] as const;
  const solidBackground = '#EFFEFF';
  const accentColor = '#00ADEF'; // Using your brand blue for loading dots

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Gradient Background Layer */}
      <Animated.View style={{ opacity: bgOpacity }}>
        <LinearGradient
          colors={gradientColors}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Solid Background Layer */}
      <View style={[styles.solidBackground, { backgroundColor: solidBackground }]} />

      {/* Content */}
      <View style={styles.container}>
        <Animated.View 
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { rotate: rotateAnim.interpolate({
                    inputRange: [-0.05, 0.05],
                    outputRange: ['-3deg', '3deg']
                  }) 
                }
              ]
            }
          ]}
        >
          <Image
            source={require('../assets/images/logo2.jpeg')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Custom Loading Dots */}
        <View style={styles.loadingContainer}>
          <Animated.View 
            style={[
              styles.loadingDot,
              { 
                backgroundColor: accentColor,
                opacity: dot1Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1]
                }),
                transform: [{
                  scale: dot1Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1.2]
                  })
                }]
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.loadingDot,
              { 
                backgroundColor: accentColor,
                opacity: dot2Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1]
                }),
                transform: [{
                  scale: dot2Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1.2]
                  })
                }]
              }
            ]} 
          />
          <Animated.View 
            style={[
              styles.loadingDot,
              { 
                backgroundColor: accentColor,
                opacity: dot3Anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1]
                }),
                transform: [{
                  scale: dot3Anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1.2]
                  })
                }]
              }
            ]} 
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  solidBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 28,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    bottom: 100,
  },
  loadingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 6,
  },
});