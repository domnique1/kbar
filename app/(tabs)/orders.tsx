import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  ListRenderItem,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { triggerBadgeRefresh } from '../hooks/useTabBadges';

// Types and Interfaces
type OrderStatus = 
  | 'pending_payment'
  | 'payment_processing' 
  | 'payment_failed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: any;
  isPopular?: boolean;
  isSpicy?: boolean;
  isSpecial?: boolean;
}

interface OrderItem extends MenuItem {
  quantity: number;
  emoji: string;
}

interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  timestamp: string;
  type: string;
}

export default function OrdersScreen() {
  // Hooks and State
  const { theme, isDarkMode } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [trackingModalVisible, setTrackingModalVisible] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentTimer, setPaymentTimer] = useState<number | null>(null);
  const [paymentTimeLeft, setPaymentTimeLeft] = useState(300);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [loyaltyTier, setLoyaltyTier] = useState("KBar Member");

  const styles = createMainStyles(theme, isDarkMode);

  // Effects
  useEffect(() => {
    loadOrders();
    loadLoyaltyPoints();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
      
      if (params.showPaymentModal === 'true') {
        setTimeout(() => {
          setPaymentModalVisible(true);
        }, 300);
      }
    }, [params.showPaymentModal])
  );

  useEffect(() => {
    if (paymentModalVisible && paymentTimeLeft > 0) {
      const timer = setInterval(() => {
        setPaymentTimeLeft(prev => prev - 1);
      }, 1000);
      setPaymentTimer(timer as unknown as number);
      
      return () => {
        if (timer) clearInterval(timer);
      };
    } else if (paymentTimeLeft <= 0 && paymentModalVisible) {
      handlePaymentTimeout();
    }
  }, [paymentModalVisible, paymentTimeLeft]);

  // Data Loading Functions
  const loadLoyaltyPoints = async (): Promise<void> => {
    try {
      const savedLoyaltyPoints = await AsyncStorage.getItem('userLoyaltyPoints');
      if (savedLoyaltyPoints !== null) {
        const points = JSON.parse(savedLoyaltyPoints);
        setLoyaltyPoints(points);
        setLoyaltyTier(getLoyaltyTier(points)); // This will now use the CORRECTED function
      } else {
        await AsyncStorage.setItem('userLoyaltyPoints', JSON.stringify(0));
        setLoyaltyPoints(0);
        setLoyaltyTier(getLoyaltyTier(0)); // This will set to "KBar Member"
      }
    } catch (error) {
      console.error('Error loading loyalty points:', error);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const storedOrders = await AsyncStorage.getItem('userOrders');
      if (storedOrders) {
        let orders: Order[] = JSON.parse(storedOrders);
        
        // Migrate old orders
        orders = orders.map(order => {
          if (order.status === 'preparing' && !order.timestamp) {
            return { ...order, status: 'pending_payment' };
          }
          return order;
        });
        
        // Sort orders by timestamp (newest first)
        orders.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setOrderHistory(orders);
        
        // Check for orders that need payment
        const unpaidOrder = orders.find(order => 
          order.status === 'pending_payment' || order.status === 'payment_processing'
        );
        
        if (unpaidOrder) {
          setCurrentOrder(unpaidOrder);
          if (unpaidOrder.status === 'pending_payment') {
            setPaymentModalVisible(true);
            const orderTime = new Date(unpaidOrder.timestamp).getTime();
            const currentTime = new Date().getTime();
            const timeElapsed = Math.floor((currentTime - orderTime) / 1000);
            setPaymentTimeLeft(Math.max(0, 300 - timeElapsed));
          }
        } else {
          setCurrentOrder(null);
          setPaymentModalVisible(false);
        }
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert("Error", "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  // CORRECTED: Helper function to determine loyalty tier based on points
  const getLoyaltyTier = (points: number): string => {
    if (points === 0) return "KBar Member";
    if (points < 10) return "KBar Member";    // 0-9 points
    if (points < 100) return "Bronze Member"; // 10-99 points
    if (points < 250) return "Silver Member"; // 100-249 points
    if (points < 500) return "Gold Member";   // 250-499 points
    if (points < 600) return "Platinum Member"; // 500-599 points
    if (points < 1000) return "Diamond Member"; // 600-999 points
    return "VIP Member"; // 1000+ points
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending_payment': return '#ff9500';
      case 'payment_processing': return '#ffcc00';
      case 'payment_failed': return theme.error;
      case 'preparing': return '#ffb84d';
      case 'ready': return '#4CAF50';
      case 'completed': return '#999';
      case 'cancelled': return theme.error;
      default: return '#999';
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'pending_payment': return 'alert-circle-outline';
      case 'payment_processing': return 'clock-outline';
      case 'payment_failed': return 'close-circle-outline';
      case 'preparing': return 'clock-outline';
      case 'ready': return 'check-circle-outline';
      case 'completed': return 'history';
      case 'cancelled': return 'cancel';
      default: return 'help-circle-outline';
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'pending_payment': return 'PENDING PAYMENT';
      case 'payment_processing': return 'PROCESSING PAYMENT';
      case 'payment_failed': return 'PAYMENT FAILED';
      case 'preparing': return 'PREPARING';
      case 'ready': return 'READY';
      case 'completed': return 'COMPLETED';
      case 'cancelled': return 'CANCELLED';
      default: return status;
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getOrderProgress = (status: OrderStatus) => {
    switch (status) {
      case 'preparing': return 1;
      case 'ready': return 2;
      case 'completed': return 3;
      default: return 0;
    }
  };

  const getEstimatedTime = (status: OrderStatus) => {
    switch (status) {
      case 'preparing': return '15-20 minutes';
      case 'ready': return 'Ready for pickup!';
      case 'completed': return 'Order completed';
      default: return 'Not available';
    }
  };

  // Payment Functions
  const handlePaymentSuccess = async (order: Order) => {
    try {
      const pointsToAdd = Math.floor(order.total);
      const newPoints = loyaltyPoints + pointsToAdd;
      
      setLoyaltyPoints(newPoints);
      setLoyaltyTier(getLoyaltyTier(newPoints)); // Now uses the corrected function
      await AsyncStorage.setItem('userLoyaltyPoints', JSON.stringify(newPoints));
      
      Alert.alert(
        "Payment Successful!", 
        `You earned ${pointsToAdd} loyalty points! Total: ${newPoints} points`
      );
    } catch (error) {
      console.error('Error updating loyalty points:', error);
    }
  };

  const handlePayment = async () => {
    if (!currentOrder) return;
    
    setPaymentProcessing(true);
    
    try {
      const updatedOrders = orderHistory.map(order => 
        order.id === currentOrder.id 
          ? { ...order, status: 'payment_processing' as OrderStatus }
          : order
      );
      
      await AsyncStorage.setItem('userOrders', JSON.stringify(updatedOrders));
      setOrderHistory(updatedOrders);
      setCurrentOrder({ ...currentOrder, status: 'payment_processing' });
      triggerBadgeRefresh();

      setTimeout(async () => {
        const success = Math.random() > 0.2;
        
        if (success) {
          const finalOrders = updatedOrders.map(order => 
            order.id === currentOrder.id 
              ? { ...order, status: 'preparing' as OrderStatus }
              : order
          );
          
          await AsyncStorage.setItem('userOrders', JSON.stringify(finalOrders));
          setOrderHistory(finalOrders);
          setCurrentOrder({ ...currentOrder, status: 'preparing' });
          await handlePaymentSuccess(currentOrder);
        } else {
          const failedOrders = updatedOrders.map(order => 
            order.id === currentOrder.id 
              ? { ...order, status: 'payment_failed' as OrderStatus }
              : order
          );
          
          await AsyncStorage.setItem('userOrders', JSON.stringify(failedOrders));
          setOrderHistory(failedOrders);
          setCurrentOrder({ ...currentOrder, status: 'payment_failed' });
          Alert.alert("Payment Failed", "Please try again or use a different payment method.");
        }
        
        setPaymentModalVisible(false);
        setPaymentProcessing(false);
        if (paymentTimer) clearInterval(paymentTimer);
        setPaymentTimeLeft(300);
        triggerBadgeRefresh();
        router.setParams({ showPaymentModal: undefined });
      }, 2000);
      
    } catch (error) {
      console.error('Error processing payment:', error);
      Alert.alert("Error", "Failed to process payment");
      setPaymentProcessing(false);
    }
  };

  const handlePaymentTimeout = async () => {
    if (!currentOrder) return;
    
    try {
      const updatedOrders = orderHistory.map(order => 
        order.id === currentOrder.id 
          ? { ...order, status: 'cancelled' as OrderStatus }
          : order
      );
      
      await AsyncStorage.setItem('userOrders', JSON.stringify(updatedOrders));
      setOrderHistory(updatedOrders);
      setCurrentOrder(null);
      setPaymentModalVisible(false);
      if (paymentTimer) clearInterval(paymentTimer);
      setPaymentTimeLeft(300);
      triggerBadgeRefresh();
      router.setParams({ showPaymentModal: undefined });
      
      Alert.alert("Order Cancelled", "Payment was not completed in time.");
    } catch (error) {
      console.error('Error cancelling order:', error);
      Alert.alert("Error", "Failed to cancel order");
    }
  };

  const handleCancelPayment = async () => {
    if (!currentOrder) return;
    
    try {
      const updatedOrders = orderHistory.map(order => 
        order.id === currentOrder.id 
          ? { ...order, status: 'cancelled' as OrderStatus }
          : order
      );
      
      await AsyncStorage.setItem('userOrders', JSON.stringify(updatedOrders));
      setOrderHistory(updatedOrders);
      setCurrentOrder(null);
      setPaymentModalVisible(false);
      if (paymentTimer) clearInterval(paymentTimer);
      setPaymentTimeLeft(300);
      triggerBadgeRefresh();
      router.setParams({ showPaymentModal: undefined });
      
      Alert.alert("Order Cancelled", "Your order has been cancelled.");
    } catch (error) {
      console.error('Error cancelling order:', error);
      Alert.alert("Error", "Failed to cancel order");
    }
  };

  const handleRetryPayment = () => {
    if (!currentOrder) return;
    
    const resetOrder = async () => {
      try {
        const updatedOrders = orderHistory.map(order => 
          order.id === currentOrder.id 
            ? { ...order, status: 'pending_payment' as OrderStatus }
            : order
        );
        
        await AsyncStorage.setItem('userOrders', JSON.stringify(updatedOrders));
        setOrderHistory(updatedOrders);
        setCurrentOrder({ ...currentOrder, status: 'pending_payment' });
        setPaymentModalVisible(true);
        setPaymentTimeLeft(300);
        triggerBadgeRefresh();
        
      } catch (error) {
        console.error('Error resetting order:', error);
        Alert.alert("Error", "Failed to reset payment");
      }
    };
    
    resetOrder();
  };

  // Order Management Functions
  const clearAllCompletedOrders = async (): Promise<void> => {
    Alert.alert(
      "Clear Completed Orders",
      "This will remove all your completed order history. Your loyalty points and active orders will be preserved.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              const storedOrders = await AsyncStorage.getItem('userOrders');
              if (storedOrders) {
                const orders: Order[] = JSON.parse(storedOrders);
                const activeOrders = orders.filter(order => 
                  order.status !== 'completed' && order.status !== 'cancelled'
                );
                
                await AsyncStorage.setItem('userOrders', JSON.stringify(activeOrders));
                setOrderHistory(activeOrders);
                
                if (currentOrder && (currentOrder.status === 'completed' || currentOrder.status === 'cancelled')) {
                  setCurrentOrder(null);
                }
                
                Alert.alert("Success", "Completed orders have been cleared.");
              }
            } catch (error) {
              console.error('Error clearing completed orders:', error);
              Alert.alert("Error", "Failed to clear orders.");
            }
          }
        }
      ]
    );
  };

  // Navigation Functions
  const handleTrackOrder = (order: Order) => {
    setTrackingOrder(order);
    setTrackingModalVisible(true);
  };

  const handleReorder = () => {
    router.push('/(tabs)/menu');
  };

  const handleBrowseMenu = () => {
    router.push('/(tabs)/menu');
  };

  // Render Functions
  const renderOrderItems = (items: OrderItem[]) => (
    <View>
      {items.map((item, index) => (
        <View key={index} style={styles.orderItem}>
          <Text style={styles.orderItemEmoji}>{item.emoji || '🍕'}</Text>
          <View style={styles.orderItemInfo}>
            <Text style={styles.orderItemName}>{item.name}</Text>
            <Text style={styles.orderItemPrice}>${item.price.toFixed(2)} × {item.quantity}</Text>
          </View>
          <Text style={styles.orderItemTotal}>${(item.price * item.quantity).toFixed(2)}</Text>
        </View>
      ))}
    </View>
  );

  const renderOrderCard: ListRenderItem<Order> = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={[styles.orderNumber, { color: theme.primary }]}>{item.orderNumber || item.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <MaterialCommunityIcons 
            name={getStatusIcon(item.status)} 
            size={14} 
            color="#fff" 
          />
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      
      <Text style={styles.orderDate}>{formatDate(item.timestamp)}</Text>
      
      {renderOrderItems(item.items)}
      
      <View style={styles.orderFooter}>
        <Text style={styles.orderTotal}>Total: ${item.total.toFixed(2)}</Text>
        
        {(item.status === 'completed' || item.status === 'preparing' || item.status === 'ready') && (
          <Text style={[styles.pointsText, { color: theme.primary }]}>
            +{Math.floor(item.total)} pts
          </Text>
        )}
        
        {item.status === 'preparing' && (
          <TouchableOpacity 
            style={styles.trackButton}
            onPress={() => handleTrackOrder(item)}
          >
            <Text style={styles.trackButtonText}>Track Order</Text>
          </TouchableOpacity>
        )}

        {item.status === 'completed' && (
          <TouchableOpacity 
            style={styles.reorderButton}
            onPress={handleReorder}
          >
            <Text style={styles.reorderButtonText}>Reorder</Text>
          </TouchableOpacity>
        )}

        {(item.status === 'payment_failed' || item.status === 'cancelled') && (
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={handleRetryPayment}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderHeader = () => (
    orderHistory.length > 0 ? (
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <View>
          <Text style={styles.sectionTitle}>Order History</Text>
          <Text style={[styles.loyaltyPoints, { color: theme.primary }]}>
            {loyaltyPoints} Points • {loyaltyTier}
          </Text>
        </View>
        
        {orderHistory.filter(order => order.status === 'completed' || order.status === 'cancelled').length > 0 && (
          <TouchableOpacity 
            style={[styles.clearButton, { backgroundColor: theme.surface }]}
            onPress={clearAllCompletedOrders}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={20} color={theme.text} />
            <Text style={[styles.clearButtonText, { color: theme.text }]}>Clear Completed</Text>
          </TouchableOpacity>
        )}
      </View>
    ) : null
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="cart-outline" size={64} color={theme.textSecondary} />
      <Text style={styles.emptyStateText}>No orders yet</Text>
      <Text style={styles.emptyStateSubtext}>Place an order from the menu to get started!</Text>
      
      <TouchableOpacity
        style={styles.menuButton}
        onPress={handleBrowseMenu}
      >
        <MaterialCommunityIcons name="silverware-fork-knife" size={20} color="#fff" />
        <Text style={styles.menuButtonText}>Browse Menu</Text>
      </TouchableOpacity>
    </View>
  );

  // Main Render
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Payment Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={paymentModalVisible}
        onRequestClose={() => setPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Complete Payment</Text>
            
            {currentOrder && (
              <>
                <Text style={styles.orderReference}>
                  Order: {currentOrder.orderNumber || currentOrder.id}
                </Text>
                
                <View style={styles.paymentSummary}>
                  <Text style={styles.paymentSummaryText}>
                    Total Amount: ${currentOrder.total.toFixed(2)}
                  </Text>
                  
                  <View style={styles.timerContainer}>
                    <MaterialCommunityIcons name="timer-outline" size={20} color="#ff9500" />
                    <Text style={styles.timerText}>
                      Time remaining: {formatTime(paymentTimeLeft)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.paymentButtons}>
                  <Pressable
                    style={[styles.paymentButton, styles.payNowButton]}
                    onPress={handlePayment}
                    disabled={paymentProcessing}
                  >
                    {paymentProcessing ? (
                      <Text style={styles.paymentButtonText}>Processing...</Text>
                    ) : (
                      <Text style={styles.paymentButtonText}>Pay Now</Text>
                    )}
                  </Pressable>
                  
                  <Pressable
                    style={[styles.paymentButton, styles.cancelButton]}
                    onPress={handleCancelPayment}
                    disabled={paymentProcessing}
                  >
                    <Text style={styles.cancelButtonText}>Cancel Order</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Tracking Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={trackingModalVisible}
        onRequestClose={() => setTrackingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Tracking Order #{trackingOrder?.orderNumber || trackingOrder?.id}
            </Text>
            
            {trackingOrder && (
              <>
                <View style={styles.progressContainer}>
                  <View style={styles.progressStep}>
                    <View style={[
                      styles.progressIcon,
                      getOrderProgress(trackingOrder.status) >= 1 && styles.progressIconActive
                    ]}>
                      <MaterialCommunityIcons 
                        name="clock-outline" 
                        size={20} 
                        color={getOrderProgress(trackingOrder.status) >= 1 ? '#fff' : '#666'} 
                      />
                    </View>
                    <Text style={styles.progressText}>Preparing</Text>
                  </View>
                  
                  <View style={styles.progressStep}>
                    <View style={[
                      styles.progressIcon,
                      getOrderProgress(trackingOrder.status) >= 2 && styles.progressIconActive
                    ]}>
                      <MaterialCommunityIcons 
                        name="check-circle-outline" 
                        size={20} 
                        color={getOrderProgress(trackingOrder.status) >= 2 ? '#fff' : '#666'} 
                      />
                    </View>
                    <Text style={styles.progressText}>Ready</Text>
                  </View>
                  
                  <View style={styles.progressStep}>
                    <View style={[
                      styles.progressIcon,
                      getOrderProgress(trackingOrder.status) >= 3 && styles.progressIconActive
                    ]}>
                      <MaterialCommunityIcons 
                        name="history" 
                        size={20} 
                        color={getOrderProgress(trackingOrder.status) >= 3 ? '#fff' : '#666'} 
                      />
                    </View>
                    <Text style={styles.progressText}>Completed</Text>
                  </View>
                </View>

                <View style={styles.estimatedTime}>
                  <MaterialCommunityIcons name="timer-outline" size={20} color={theme.primary} />
                  <Text style={styles.estimatedTimeText}>
                    Estimated: {getEstimatedTime(trackingOrder.status)}
                  </Text>
                </View>

                <Pressable
                  style={[styles.paymentButton, styles.payNowButton]}
                  onPress={() => setTrackingModalVisible(false)}
                >
                  <Text style={styles.paymentButtonText}>Close</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Current Order Banner */}
      {currentOrder && (
        <View style={[styles.currentOrderBanner, { backgroundColor: getStatusColor(currentOrder.status) }]}>
          <MaterialCommunityIcons 
            name={getStatusIcon(currentOrder.status)} 
            size={24} 
            color="#fff" 
          />
          <Text style={styles.currentOrderText}>
            Order {currentOrder.orderNumber || currentOrder.id} - {getStatusText(currentOrder.status)}
          </Text>
        </View>
      )}

      {/* Order History List */}
      <FlatList
        data={orderHistory}
        renderItem={renderOrderCard}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
        ListHeaderComponent={renderHeader()}
        ListEmptyComponent={renderEmptyState()}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadOrders}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      />
    </View>
  );
}

// Styles
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
    fontSize: 16,
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 4,
  },
  loyaltyPoints: {
    fontSize: 14,
    fontWeight: '600',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    gap: 4,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Current Order Banner
  currentOrderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: isDarkMode ? '#000' : theme.primary,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  currentOrderText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 12,
    fontSize: 16,
  },

  // List Styles
  listContent: {
    padding: 16,
    paddingBottom: 20,
  },

  // Order Card Styles
  orderCard: {
    backgroundColor: isDarkMode ? '#222' : theme.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
    elevation: 3,
    shadowColor: isDarkMode ? '#000' : theme.primary,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontWeight: 'bold',
    fontSize: 16,
    color: theme.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderDate: {
    color: theme.textSecondary,
    fontSize: 12,
    marginBottom: 16,
  },

  // Order Item Styles
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  orderItemEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemName: {
    color: theme.text,
    fontWeight: '500',
    marginBottom: 2,
  },
  orderItemPrice: {
    color: theme.textSecondary,
    fontSize: 12,
  },
  orderItemTotal: {
    color: theme.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },

  // Order Footer Styles
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  orderTotal: {
    color: theme.text,
    fontWeight: 'bold',
    fontSize: 16,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '600',
    fontStyle: 'italic',
  },

  // Button Styles
  trackButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  trackButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  reorderButton: {
    backgroundColor: isDarkMode ? '#333' : theme.surfaceVariant,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.primary,
  },
  reorderButtonText: {
    color: theme.primary,
    fontWeight: 'bold',
    fontSize: 12,
  },
  retryButton: {
    backgroundColor: '#ff9500',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },

  // Empty State Styles
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
    elevation: 4,
    shadowColor: isDarkMode ? '#000' : theme.primary,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  menuButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: isDarkMode ? '#222' : theme.surface,
    borderRadius: 20,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    elevation: 5,
  },
  modalTitle: {
    color: theme.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  orderReference: {
    color: theme.primary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  paymentSummary: {
    width: '100%',
    padding: 16,
    backgroundColor: isDarkMode ? '#333' : theme.surfaceVariant,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  paymentSummaryText: {
    color: theme.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerText: {
    color: '#ff9500',
    fontSize: 16,
    fontWeight: '600',
  },
  paymentButtons: {
    width: '100%',
    gap: 12,
  },
  paymentButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  payNowButton: {
    backgroundColor: theme.primary,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.border,
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButtonText: {
    color: theme.text,
    fontSize: 16,
  },

  // Tracking Modal Styles
  progressContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  progressStep: {
    alignItems: 'center',
    flex: 1,
  },
  progressIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: isDarkMode ? '#333' : theme.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressIconActive: {
    backgroundColor: theme.primary,
  },
  progressText: {
    color: theme.text,
    fontSize: 12,
    textAlign: 'center',
  },
  estimatedTime: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#333' : theme.surfaceVariant,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  estimatedTimeText: {
    color: theme.text,
    fontSize: 16,
    fontWeight: '600',
  },
});