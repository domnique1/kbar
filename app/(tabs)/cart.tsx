import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ListRenderItem,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { triggerBadgeRefresh } from '../hooks/useTabBadges';

// Shared OrderStatus type (keep as is)
type OrderStatus = 
  | 'pending_payment'
  | 'payment_processing' 
  | 'payment_failed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  emoji: string;
}

interface Order {
  id: string;
  orderNumber: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  timestamp: string;
  type: string;
}

export default function CartScreen() {
  const { theme, isDarkMode } = useTheme();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = 60;

  const styles = createMainStyles(theme, isDarkMode);

  // Load cart items from AsyncStorage when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadCartItems();
    }, [])
  );

  const loadCartItems = async () => {
    try {
      setLoading(true);
      const storedCart = await AsyncStorage.getItem('userCart');
      if (storedCart) {
        const items: CartItem[] = JSON.parse(storedCart);
        setCartItems(items);
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      Alert.alert("Error", "Failed to load cart items");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      const updatedCart = cartItems.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      );
      
      setCartItems(updatedCart);
      await AsyncStorage.setItem('userCart', JSON.stringify(updatedCart));
      
      // Trigger real-time badge update
      triggerBadgeRefresh();
    } catch (error) {
      console.error('Error updating quantity:', error);
      Alert.alert("Error", "Failed to update quantity");
    }
  };

  const removeItem = async (id: string) => {
    try {
      const updatedCart = cartItems.filter(item => item.id !== id);
      setCartItems(updatedCart);
      await AsyncStorage.setItem('userCart', JSON.stringify(updatedCart));
      
      // Trigger real-time badge update
      triggerBadgeRefresh();
    } catch (error) {
      console.error('Error removing item:', error);
      Alert.alert("Error", "Failed to remove item");
    }
  };

  const clearCart = async () => {
    try {
      setCartItems([]);
      await AsyncStorage.removeItem('userCart');
      
      // Trigger real-time badge update
      triggerBadgeRefresh();
    } catch (error) {
      console.error('Error clearing cart:', error);
      Alert.alert("Error", "Failed to clear cart");
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateItemCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const submitOrder = async () => {
    if (cartItems.length === 0) {
      Alert.alert("Empty Cart", "Your cart is empty. Add some items first!");
      return;
    }

    setSubmitting(true);
    try {
      // Create order object with pending_payment status
      const orderId = Math.random().toString(36).substring(2, 9);
      const total = calculateTotal();
      
      const newOrder: Order = {
        id: orderId,
        orderNumber: `ORD-${orderId.toUpperCase()}`,
        items: cartItems,
        total: total,
        status: 'pending_payment',
        timestamp: new Date().toISOString(),
        type: 'cart'
      };

      // Save order to AsyncStorage
      const existingOrders = JSON.parse(await AsyncStorage.getItem('userOrders') || '[]');
      existingOrders.push(newOrder);
      await AsyncStorage.setItem('userOrders', JSON.stringify(existingOrders));

      // Trigger badge update for the new unpaid order
      triggerBadgeRefresh();  

      // Clear cart
      await AsyncStorage.removeItem('userCart');
      setCartItems([]);

      // Show success message with option to proceed to payment
      Alert.alert(
        "Order Created! 🎉",
        `Your order ${newOrder.orderNumber} has been created. Total: $${total.toFixed(2)}\n\nProceed to payment?`,
        [
          {
            text: "Pay Now",
            onPress: () => {
              // CRITICAL UPDATE: Use replace instead of push to avoid back navigation issues
              router.replace({
                pathname: "/(tabs)/orders",
                params: { 
                  showPaymentModal: 'true',
                  orderId: newOrder.id, // Pass the specific order ID
                  timestamp: Date.now() // Add timestamp to ensure param change detection
                }
              });
            },
            style: "default" as const
          },
          { 
            text: "Later", 
            onPress: () => {
              // Navigate to menu with success parameter
              router.push({
                pathname: "/(tabs)/menu",
                params: { orderCreated: 'true' }
              });
            },
            style: "cancel" as const
          }
        ]
      );

    } catch (error) {
      console.error('Error submitting order:', error);
      Alert.alert("Error", "Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderCartItem: ListRenderItem<CartItem> = ({ item }) => (
    <View style={styles.cartItem}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemEmoji}>{item.emoji}</Text>
        <Text style={styles.itemName} numberOfLines={2} ellipsizeMode="tail">{item.name}</Text>
      </View>

      <View style={styles.itemFooter}>
        <View style={styles.quantityControls}>
          <TouchableOpacity 
            style={[styles.quantityButton, item.quantity <= 1 && styles.quantityButtonDisabled]}
            onPress={() => updateQuantity(item.id, item.quantity - 1)}
            disabled={item.quantity <= 1}
          >
            <MaterialCommunityIcons name="minus" size={16} color="#fff" />
          </TouchableOpacity>
          
          <Text style={styles.quantityText}>{item.quantity}</Text>
          
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => updateQuantity(item.id, item.quantity + 1)}
          >
            <MaterialCommunityIcons name="plus" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>

        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => removeItem(item.id)}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={20} color={theme.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Loading cart...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Cart</Text>
        {cartItems.length > 0 && (
          <TouchableOpacity onPress={clearCart} style={styles.clearButton}>
            <MaterialCommunityIcons name="trash-can-outline" size={16} color={theme.error} />
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Cart Items */}
      <FlatList
        data={cartItems}
        renderItem={renderCartItem}
        keyExtractor={item => item.id}        
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + tabBarHeight + 100 }]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="cart-off" size={64} color={theme.textSecondary} />
            <Text style={styles.emptyStateText}>Your cart is empty</Text>
            <Text style={styles.emptyStateSubtext}>Add some delicious items from our menu!</Text>
            
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => router.push("/(tabs)/menu")}
            >
              <MaterialCommunityIcons name="silverware-fork-knife" size={20} color="#fff" />
              <Text style={styles.menuButtonText}>Browse Menu</Text>
            </TouchableOpacity>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadCartItems}
            tintColor={theme.primary}
            colors={[theme.primary]}
            title="Pull to refresh"
            titleColor={theme.textSecondary}
          />
        }
      />

      {/* Checkout Section */}
      {cartItems.length > 0 && (
        <View style={[styles.checkoutContainer, { 
          bottom: insets.bottom + tabBarHeight, 
          backgroundColor: isDarkMode ? 'rgba(34, 34, 34, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderTopColor: theme.border 
        }]}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total ({calculateItemCount()} items):</Text>
            <Text style={styles.totalAmount}>${calculateTotal().toFixed(2)}</Text>
          </View>

          <TouchableOpacity
            style={[styles.checkoutButton, submitting && styles.checkoutButtonDisabled]}
            onPress={submitOrder}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="check-circle-outline" size={20} color="#fff" />
                <Text style={styles.checkoutButtonText}>Place Order</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const createMainStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: theme.text,
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerTitle: {
    color: theme.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clearButtonText: {
    color: theme.error,
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    flexGrow: 1,
    padding: 16,
  },
  cartItem: {
    backgroundColor: isDarkMode ? '#222' : theme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
    elevation: 3,
    shadowColor: isDarkMode ? '#000' : theme.primary,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  itemName: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    flexWrap: 'wrap',
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#333' : theme.surfaceVariant,
    borderRadius: 20,
    padding: 4,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    marginHorizontal: 8,
    minWidth: 20,
    textAlign: 'center',
  },
  itemPrice: {
    color: theme.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  removeButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyStateText: {
    color: theme.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: theme.textSecondary,
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 24,
  },
  menuButton: {
    backgroundColor: theme.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
  },
  menuButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  checkoutContainer: {
    padding: 16,
    borderTopWidth: 1,
    position: 'absolute',
    left: 0,
    right: 0,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '500',
  },
  totalAmount: {
    color: theme.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  checkoutButton: {
    backgroundColor: theme.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  checkoutButtonDisabled: {
    backgroundColor: isDarkMode ? '#555' : '#ccc',
    opacity: 0.6,
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});