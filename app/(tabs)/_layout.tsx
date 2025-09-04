// app/(tabs)/_layout.tsx
import type { MaterialCommunityIcons as MaterialCommunityIconsType } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

type TabBarIconProps = {
  focused: boolean;
  color: string;
  size: number;
};

type RouteProps = {
  route: { name: string };
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }: RouteProps) => ({
        headerShown: false,
        tabBarActiveTintColor: '#0a84ff',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <BlurView intensity={90} tint="dark" style={styles.blurContainer} />
        ),
        tabBarIcon: ({ focused, color, size }: TabBarIconProps) => {
          let iconName: keyof typeof MaterialCommunityIconsType.glyphMap;

          switch (route.name) {
            case 'home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'menu':
              iconName = focused ? 'silverware-fork-knife' : 'silverware-fork-knife';
              break;
            case 'cart':
              iconName = focused ? 'cart' : 'cart-outline';
              break;
            case 'orders':
              iconName = focused ? 'clipboard-list' : 'clipboard-list-outline';
              break;
            case 'settings':
              iconName = focused ? 'cog' : 'cog-outline';
              break;
            default:
              iconName = 'circle';
          }

          return (
            <View style={focused ? styles.iconFocusedContainer : undefined}>
              <MaterialCommunityIcons name={iconName} size={size} color={color} />
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
    bottom: 10,
    left: 20,
    right: 20,
    elevation: 10,
    backgroundColor: 'transparent',
    borderRadius: 25,
    height: 50,
    shadowColor: '#0a84ff',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    borderTopWidth: 0,
  },
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 25,
  },
  iconFocusedContainer: {
    shadowColor: '#0a84ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 8,
  },
});