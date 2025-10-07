// app/(tabs)/_layout.tsx
import type { MaterialCommunityIcons as MaterialCommunityIconsType } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useTabBadges } from '../hooks/useTabBadges';

type TabBarIconProps = {
  focused: boolean;
  color: string;
  size: number;
};

type RouteProps = {
  route: { name: string };
};

export default function TabLayout() {
  const { cartCount, unpaidOrdersCount } = useTabBadges();
  const { theme, isDarkMode } = useTheme();
  const { width } = useWindowDimensions();

  return (
    <Tabs
      screenOptions={({ route }: RouteProps) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: [
          styles.tabBar,
          {
            // REMOVE width calculation - let it be automatic
            marginHorizontal: 16, // Use margin instead of left/right
            alignSelf: 'center',
            backgroundColor: Platform.select({
              ios: 'transparent',
              android: isDarkMode ? 'rgba(30, 30, 30, 0.85)' : 'rgba(255, 255, 255, 0.85)',
            }),
          },
        ],
        tabBarItemStyle: { flex: 1 },
        tabBarBackground: () => (
          <BlurView 
            intensity={80} // FIXED: Changed "intensity:" to "intensity="
            tint={isDarkMode ? "dark" : "light"}
            style={styles.blurContainer} 
          />
        ),
        tabBarIcon: ({ focused, color, size }: TabBarIconProps) => {
          let iconName: keyof typeof MaterialCommunityIconsType.glyphMap;
          let badgeCount = 0;

          switch (route.name) {
            case 'home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'menu':
              iconName = focused ? 'silverware-fork-knife' : 'silverware-fork-knife';
              break;
            case 'cart':
              iconName = focused ? 'cart' : 'cart-outline';
              badgeCount = cartCount;
              break;
            case 'orders':
              iconName = focused ? 'clipboard-list' : 'clipboard-list-outline';
              badgeCount = unpaidOrdersCount;
              break;
            case 'settings':
              iconName = focused ? 'cog' : 'cog-outline';
              break;
            default:
              iconName = 'circle';
          }

          return (
            <View style={focused ? [styles.iconFocusedContainer, { 
              shadowColor: theme.primary
            }] : undefined}>
              <MaterialCommunityIcons name={iconName} size={size} color={color} />
              {badgeCount > 0 && (
                <View style={[styles.badge, { 
                  backgroundColor: theme.primary
                }]}>
                  <Text style={styles.badgeText}>
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </Text>
                </View>
              )}
            </View>
          );
        },
      })}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="menu" options={{ title: 'Menu' }} />
      <Tabs.Screen name="cart" options={{ title: 'Cart' }} />
      <Tabs.Screen name="orders" options={{ title: 'Orders' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 12,
    left: 0, // Remove individual left/right
    right: 0, // Remove individual left/right
    elevation: 10,
    borderRadius: 25,
    height: 55,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    borderTopWidth: 0,
    overflow: 'hidden',
  },
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 25,
  },
  iconFocusedContainer: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 8,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    opacity: 0.7,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});