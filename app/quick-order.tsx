import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
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
import { useTheme } from './contexts/ThemeContext';
import { triggerBadgeRefresh } from './hooks/useTabBadges';

// Define shared status types (should be consistent across all order screens)
type OrderStatus = 
  | 'pending_payment'
  | 'payment_processing' 
  | 'payment_failed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

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
  status: OrderStatus;
  timestamp: string;
  type: string;
  orderNumber?: string;
}

interface QuickOrderSession {
  orderId: string;
  items: OrderItem[];
  total: number;
  itemCount: number;
}

type Router = {
  push: (path: string | { pathname: string; params?: any }) => void;
  back: () => void;
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

// Generate a simple order number
const generateOrderNumber = (): string => {
  const now = new Date();
  const datePart = now.getDate().toString().padStart(2, '0');
  const monthPart = (now.getMonth() + 1).toString().padStart(2, '0');
  const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${datePart}${monthPart}${randomPart}`;
};

export default function QuickOrderScreen() {
  const { theme, isDarkMode } = useTheme();
  const [ordering, setOrdering] = useState<boolean>(false);
  const [quantities, setQuantities] = useState<{[key: string]: number}>({});
  const [quickOrderSession, setQuickOrderSession] = useState<QuickOrderSession | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const router = useRouter() as Router;

  const styles = createMainStyles(theme, isDarkMode);

  // Initialize quantities
  const initializeQuantities = () => {
    const initialQuantities: {[key: string]: number} = {};
    quickOrderItems.forEach(item => {
      initialQuantities[item.id] = 1;
    });
    setQuantities(initialQuantities);
  };

  useState(() => {
    initializeQuantities();
  });

  const updateQuantity = useCallback((itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setQuantities(prev => ({
      ...prev,
      [itemId]: newQuantity
    }));

    // If item is in session, update session quantity in real-time
    if (quickOrderSession) {
      const existingItemIndex = quickOrderSession.items.findIndex(i => i.id === itemId);
      if (existingItemIndex !== -1) {
        const updatedItems = [...quickOrderSession.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: newQuantity
        };
        
        const updatedSession: QuickOrderSession = {
          ...quickOrderSession,
          items: updatedItems,
          total: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          itemCount: updatedItems.reduce((count, item) => count + item.quantity, 0)
        };
        
        setQuickOrderSession(updatedSession);
      }
    }
  }, [quickOrderSession]);

  const addToQuickOrderSession = async (item: QuickOrderItem, quantity: number) => {
    // Check if item is already in session - if yes, do nothing
    if (quickOrderSession?.items.some(i => i.id === item.id)) {
      return;
    }

    setOrdering(true);
    
    try {
      const orderItem: OrderItem = {
        ...item,
        quantity: quantity
      };

      let updatedSession: QuickOrderSession;

      if (quickOrderSession) {
        // Add new item to session (item shouldn't exist already due to check above)
        const updatedItems = [...quickOrderSession.items, orderItem];
        updatedSession = {
          ...quickOrderSession,
          items: updatedItems,
          total: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
          itemCount: updatedItems.reduce((count, item) => count + item.quantity, 0)
        };
      } else {
        // Create new session
        const orderId = Math.random().toString(36).substring(2, 9);
        updatedSession = {
          orderId,
          items: [orderItem],
          total: item.price * quantity,
          itemCount: quantity
        };
      }

      setQuickOrderSession(updatedSession);
      console.log("Quick order updated:", updatedSession);

    } catch (error) {
      console.error("Quick order error:", error);
      Alert.alert("Error", "Failed to add item to order. Please try again.");
    } finally {
      setOrdering(false);
    }
  };

  const removeFromQuickOrderSession = (itemId: string) => {
    if (!quickOrderSession) return;

    const updatedItems = quickOrderSession.items.filter(item => item.id !== itemId);
    
    if (updatedItems.length === 0) {
      setQuickOrderSession(null);
    } else {
      const updatedSession: QuickOrderSession = {
        ...quickOrderSession,
        items: updatedItems,
        total: updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        itemCount: updatedItems.reduce((count, item) => count + item.quantity, 0)
      };
      setQuickOrderSession(updatedSession);
    }
  };

  const finalizeQuickOrder = async () => {
    if (!quickOrderSession || quickOrderSession.items.length === 0) {
      Alert.alert("Empty Order", "Please add some items to your quick order first!");
      return;
    }

    setOrdering(true);
    
    try {
      const newOrder: Order = {
        id: quickOrderSession.orderId,
        items: quickOrderSession.items,
        total: quickOrderSession.total,
        status: 'pending_payment',
        timestamp: new Date().toISOString(),
        type: 'quick',
        orderNumber: generateOrderNumber()
      };
      
      const success = await storeOrder(newOrder);
      
      if (success) {
        // Trigger badge update for new unpaid order
        triggerBadgeRefresh();

        // Clear session after successful order
        setQuickOrderSession(null);
        initializeQuantities();
        
        // Navigate to orders with payment modal - FIXED: use push instead of replace
        router.push({
          pathname: "/(tabs)/orders",
          params: { 
            showPaymentModal: 'true',
            orderId: newOrder.id,
            timestamp: Date.now()
          }
        });
        
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

  const clearQuickOrderSession = () => {
    Alert.alert(
      "Clear Order",
      "Are you sure you want to clear your quick order?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear", 
          style: "destructive", 
          onPress: () => {
            setQuickOrderSession(null);
            initializeQuantities();
          }
        }
      ]
    );
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setQuickOrderSession(null);
    initializeQuantities();
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const getItemQuantity = (itemId: string) => {
    return quantities[itemId] || 1;
  };

  const isItemInSession = (itemId: string) => {
    return quickOrderSession?.items.some(i => i.id === itemId) || false;
  };

  const getSessionQuantity = (itemId: string) => {
    const sessionItem = quickOrderSession?.items.find(i => i.id === itemId);
    return sessionItem ? sessionItem.quantity : 0;
  };

  const renderItem = ({ item }: { item: QuickOrderItem }) => {
    const quantity = getItemQuantity(item.id);
    const itemInSession = isItemInSession(item.id);
    const sessionQuantity = getSessionQuantity(item.id);
    
    return (
      <TouchableOpacity 
        style={[
          styles.itemCard, 
          ordering && styles.disabledCard,
          itemInSession && styles.itemInSessionCard
        ]}
        onPress={() => !itemInSession && addToQuickOrderSession(item, quantity)}
        activeOpacity={0.7}
        disabled={ordering || itemInSession}
      >
        <View style={styles.itemLeft}>
          <Text style={styles.itemEmoji}>{item.emoji}</Text>
          <View style={styles.itemTextContainer}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
            
            {/* Quantity Controls */}
            <View style={styles.quantityContainer}>
              <TouchableOpacity 
                style={[styles.quantityButton, quantity <= 1 && styles.quantityButtonDisabled]}
                onPress={(e) => {
                  e.stopPropagation();
                  updateQuantity(item.id, quantity - 1);
                }}
                disabled={quantity <= 1}
              >
                <MaterialCommunityIcons name="minus" size={16} color="#fff" />
              </TouchableOpacity>
              
              <Text style={styles.quantityText}>{quantity}</Text>
              
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={(e) => {
                  e.stopPropagation();
                  updateQuantity(item.id, quantity + 1);
                }}
              >
                <MaterialCommunityIcons name="plus" size={16} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Session Quantity Indicator */}
            {itemInSession && (
              <Text style={styles.sessionQuantityText}>
                In order: {sessionQuantity} × ${(item.price * sessionQuantity).toFixed(2)}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.itemRight}>
          {item.isSpecial && (
            <View style={styles.specialBadge}>
              <Text style={styles.specialBadgeText}>SPECIAL</Text>
            </View>
          )}
          
          {itemInSession ? (
            <TouchableOpacity 
              style={styles.removeButton}
              onPress={(e) => {
                e.stopPropagation();
                removeFromQuickOrderSession(item.id);
              }}
              disabled={ordering}
            >
              <MaterialCommunityIcons name="close" size={20} color="#ff6b6b" />
            </TouchableOpacity>
          ) : (
            <MaterialCommunityIcons 
              name="lightning-bolt" 
              size={20} 
              color={theme.primary} 
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />
      
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons 
            name="arrow-left" 
            size={24} 
            color={theme.text} 
          />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.title}>Quick Order</Text>
          <Text style={styles.subtitle}>
            {quickOrderSession ? 
              `Tap items to add to order • ${quickOrderSession.itemCount} items selected` : 
              'Tap an item to add it to your quick order'
            }
          </Text>
        </View>
        
        <MaterialCommunityIcons 
          name="lightning-bolt" 
          size={28} 
          color={theme.primary} 
        />
      </View>
      
      {/* Quick Order Session Banner */}
      {quickOrderSession && quickOrderSession.items.length > 0 && (
        <View style={styles.sessionBanner}>
          <View style={styles.bannerContent}>
            <Text style={styles.sessionText}>
              ✅ Quick Order ({quickOrderSession.itemCount} items • ${quickOrderSession.total.toFixed(2)})
            </Text>
            <View style={styles.bannerButtons}>
              <TouchableOpacity 
                onPress={finalizeQuickOrder}
                style={styles.bannerButton}
                disabled={ordering}
              >
                {ordering ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.payNowLink}>Pay Now →</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={clearQuickOrderSession}
                style={styles.bannerButton}
                disabled={ordering}
              >
                <Text style={styles.clearLink}>Clear</Text>
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
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </SafeAreaView>
  );
}

const createMainStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 15,
    backgroundColor: isDarkMode ? '#1f1f1f' : theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
    marginLeft: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.primary,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  sessionBanner: {
    backgroundColor: isDarkMode ? '#2e7d32' : '#4caf50',
    padding: 12,
  },
  bannerContent: {
    alignItems: 'center',
  },
  sessionText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  bannerButtons: {
    flexDirection: 'row',
    gap: 20,
  },
  bannerButton: {
    padding: 5,
  },
  payNowLink: {
    color: 'white',
    fontWeight: '600',
    textDecorationLine: 'underline',
    fontSize: 14,
  },
  clearLink: {
    color: '#ccc',
    fontWeight: '600',
    fontSize: 14,
  },
  listContainer: {
    padding: 16,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: isDarkMode ? '#1f1f1f' : theme.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: isDarkMode ? '#000' : theme.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledCard: {
    opacity: 0.7,
  },
  itemInSessionCard: {
    backgroundColor: isDarkMode ? '#1b5e20' : '#e8f5e8',
    borderColor: isDarkMode ? '#4caf50' : '#4caf50',
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
    color: theme.text,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: isDarkMode ? '#e67e22' : '#ff9800',
    marginBottom: 8,
  },
  // Quantity Controls
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#333' : theme.surfaceVariant,
    borderRadius: 20,
    padding: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    backgroundColor: isDarkMode ? '#555' : '#ccc',
  },
  quantityText: {
    color: theme.text,
    fontWeight: '600',
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
    fontSize: 14,
  },
  specialBadge: {
    backgroundColor: isDarkMode ? '#ff9f43' : '#ff9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  specialBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  sessionQuantityText: {
    fontSize: 12,
    color: isDarkMode ? '#4caf50' : '#2e7d32',
    fontWeight: '600',
    marginTop: 4,
  },
  sessionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: isDarkMode ? '#333' : theme.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
});