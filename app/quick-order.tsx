// quick-order.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface QuickOrderItem {
  id: string;
  name: string;
  price: number;
  isPopular?: boolean;
  isSpecial?: boolean;
  emoji: string;
}

interface OrderItem extends QuickOrderItem {
  quantity: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: string;
  timestamp: string;
  type: string;
}

type Router = {
  push: (path: string) => void;
};

const quickOrderItems: QuickOrderItem[] = [
  {
    id: 'quick-1',
    name: 'Mojito',
    price: 7.99,
    isPopular: true,
    emoji: '🍹'
  },
  {
    id: 'quick-2',
    name: 'Lager Beer',
    price: 5.00,
    isPopular: true,
    emoji: '🍺'
  },
  {
    id: 'quick-3',
    name: "Today's Special",
    price: 8.99,
    isSpecial: true,
    emoji: '⭐'
  },
  {
    id: 'quick-4',
    name: 'Chicken Wings',
    price: 9.50,
    isPopular: true,
    emoji: '🍗'
  },
  {
    id: 'quick-5',
    name: 'Margherita Pizza',
    price: 12.99,
    isPopular: true,
    emoji: '🍕'
  },
  {
    id: 'quick-6',
    name: 'House Burger',
    price: 11.50,
    isPopular: true,
    emoji: '🍔'
  },
];

// Simple storage functions
const storeOrder = async (newOrder: Order): Promise<boolean> => {
  try {
    const existingOrders = JSON.parse(await AsyncStorage.getItem('userOrders') || '[]');
    existingOrders.push(newOrder);
    await AsyncStorage.setItem('userOrders', JSON.stringify(existingOrders));
    return true;
  } catch (error) {
    console.error('Error storing order:', error);
    return false;
  }
};

export default function QuickOrderScreen() {
  const [ordering, setOrdering] = useState<boolean>(false);
  const [lastOrdered, setLastOrdered] = useState<string | null>(null);
  const router = useRouter() as Router;

  const orderItem = async (item: QuickOrderItem) => {
    if (ordering) return;
    
    setOrdering(true);
    
    try {
      // Create order object
      const newOrder: Order = {
        id: Math.random().toString(36).substring(2, 9),
        items: [{...item, quantity: 1}],
        total: item.price,
        status: 'preparing',
        timestamp: new Date().toISOString(),
        type: 'quick'
      };
      
      // Save order
      const success = await storeOrder(newOrder);
      
      if (success) {
        // Set the last ordered item for visual feedback
        setLastOrdered(item.name);
        
        // Show success message with options
        Alert.alert(
          "Order Placed! 🎉",
          `Your ${item.name} has been added to your orders.`,
          [
            {
              text: "View Orders",
              onPress: () => router.push('/(tabs)/orders'),
              style: "default" as const
            },
            { 
              text: "Continue Ordering", 
              style: "cancel" as const
            }
          ]
        );
        
        console.log("Quick order placed:", item.name);
        
      } else {
        Alert.alert("Error", "Failed to save your order. Please try again.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to place order. Please try again.");
      console.error("Order error:", error);
    } finally {
      setOrdering(false);
    }
  };

   const dismissBanner = () => {
    setLastOrdered(null);
  };

  // more components
  const renderItem = ({ item }: { item: QuickOrderItem }) => (
    <TouchableOpacity 
      style={[
        styles.itemCard, 
        ordering && styles.disabledCard,
        lastOrdered === item.name && styles.recentlyOrderedCard
      ]}
      onPress={() => orderItem(item)}
      activeOpacity={0.7}
      disabled={ordering}
    >
      <View style={styles.itemLeft}>
        <Text style={styles.itemEmoji}>{item.emoji}</Text>
        <View style={styles.itemTextContainer}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
        </View>
      </View>
      
      <View style={styles.itemRight}>
        {item.isSpecial && (
          <View style={styles.specialBadge}>
            <Text style={styles.specialBadgeText}>SPECIAL</Text>
          </View>
        )}
        {ordering && lastOrdered === item.name ? (
          <ActivityIndicator size="small" color="#0a84ff" />
        ) : (
          <MaterialCommunityIcons 
            name="lightning-bolt" 
            size={20} 
            color="#0a84ff" 
          />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Quick Order</Text>
          <Text style={styles.subtitle}>Tap an item to order it immediately</Text>
        </View>
        <MaterialCommunityIcons 
          name="lightning-bolt" 
          size={28} 
          color="#0a84ff" 
        />
      </View>
      
       {/* Confirmation Message */}
      {lastOrdered && (
        <View style={styles.confirmationBanner}>
          <View style={styles.bannerContent}>
            <Text style={styles.confirmationText}>
              ✅ {lastOrdered} ordered successfully!
            </Text>
            <View style={styles.bannerButtons}>
              <TouchableOpacity 
                onPress={() => router.push('/(tabs)/orders')}
                style={styles.bannerButton}
              >
                <Text style={styles.viewOrdersLink}>View Orders →</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={dismissBanner}
                style={styles.bannerButton}
              >
                <Text style={styles.dismissLink}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      
      {/* Items List */}
      <FlatList
        data={quickOrderItems}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 15,
    backgroundColor: '#1f1f1f',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0a84ff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
  },
  confirmationBanner: {
    backgroundColor: '#2e7d32',
    padding: 12,
    alignItems: 'center',
  },
  bannerContent: {
    alignItems: 'center',
  },
  confirmationText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
  bannerButtons: {
    flexDirection: 'row',
    gap: 20,
  },
  bannerButton: {
    padding: 5,
  },
  viewOrdersLink: {
    color: 'white',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  dismissLink: {
    color: '#ccc',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1f1f1f',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  disabledCard: {
    opacity: 0.7,
  },
  recentlyOrderedCard: {
    backgroundColor: '#1b5e20',
    borderColor: '#4caf50',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemEmoji: {
    fontSize: 32,
    marginRight: 15,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e67e22',
  },
  specialBadge: {
    backgroundColor: '#ff9f43',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  specialBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});