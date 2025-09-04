// C:\Users\LAP-621\kbar-app\app\(tabs)\orders.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  ListRenderItem,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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
  status: 'preparing' | 'ready' | 'completed' | 'delivered';
  timestamp: string;
  type: string;
}

export default function OrdersScreen() {
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useLocalSearchParams();

  // Load orders from AsyncStorage
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const storedOrders = await AsyncStorage.getItem('userOrders');
      if (storedOrders) {
        const orders: Order[] = JSON.parse(storedOrders);
        // Sort orders by timestamp (newest first)
        orders.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setOrderHistory(orders);
        
        // Set current order if there's one with 'preparing' status
        const preparingOrder = orders.find(order => order.status === 'preparing');
        if (preparingOrder) {
          setCurrentOrder(preparingOrder);
        }
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert("Error", "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'preparing': return '#ffb84d';
      case 'ready': return '#4CAF50';
      case 'completed': return '#999';
      case 'delivered': return '#0a84ff';
      default: return '#999';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'preparing': return 'clock-outline';
      case 'ready': return 'check-circle-outline';
      case 'completed': return 'history';
      case 'delivered': return 'truck-delivery';
      default: return 'help-circle-outline';
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleTrackOrder = () => {
    Alert.alert('Tracking', 'Your order is being prepared!');
  };

  const handleReorder = () => {
    router.push('/(tabs)/menu');
  };

  const handleBrowseMenu = () => {
    router.push('/(tabs)/menu');
  };

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
        <Text style={[styles.orderNumber, { color: '#0a84ff' }]}>{item.orderNumber || item.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <MaterialCommunityIcons 
            name={getStatusIcon(item.status)} 
            size={14} 
            color="#fff" 
          />
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.orderDate}>{formatDate(item.timestamp)}</Text>
      
      {renderOrderItems(item.items)}
      
      <View style={styles.orderFooter}>
        <Text style={styles.orderTotal}>Total: ${item.total.toFixed(2)}</Text>
        
        {item.status === 'preparing' && (
          <TouchableOpacity 
            style={styles.trackButton}
            onPress={handleTrackOrder}
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
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Current Order Banner */}
      {currentOrder && currentOrder.status === 'preparing' && (
        <View style={styles.currentOrderBanner}>
          <MaterialCommunityIcons name="clock-outline" size={24} color="#fff" />
          <Text style={styles.currentOrderText}>
            Your order {currentOrder.orderNumber || currentOrder.id} is being prepared!
          </Text>
        </View>
      )}

      {/* Order History */}
      <FlatList
        data={orderHistory}
        renderItem={renderOrderCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          orderHistory.length > 0 ? (
            <Text style={styles.sectionTitle}>Order History</Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="cart-outline" size={64} color="#666" />
            <Text style={styles.emptyStateText}>No orders yet</Text>
            <Text style={styles.emptyStateSubtext}>Place an order from the menu to get started!</Text>
            
            {/* Menu Navigation Button */}
            <TouchableOpacity
              style={styles.menuButton}
              onPress={handleBrowseMenu}
            >
              <MaterialCommunityIcons name="silverware-fork-knife" size={20} color="#fff" />
              <Text style={styles.menuButtonText}>Browse Menu</Text>
            </TouchableOpacity>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadOrders}
            tintColor="#fff"
            colors={['#fff']}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  currentOrderBanner: {
    backgroundColor: '#ffb84d',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
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
  listContent: {
    padding: 16,
    paddingBottom: 20,
  },
  sectionTitle: {
    color: '#0a84ff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginLeft: 4,
  },
  orderCard: {
    backgroundColor: '#222',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
    elevation: 3,
    shadowColor: '#000',
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
    color: '#fff',
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
    color: '#888',
    fontSize: 12,
    marginBottom: 16,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  orderItemEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemName: {
    color: '#fff',
    fontWeight: '500',
    marginBottom: 2,
  },
  orderItemPrice: {
    color: '#888',
    fontSize: 12,
  },
  orderItemTotal: {
    color: '#0a84ff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  orderTotal: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  trackButton: {
    backgroundColor: '#0a84ff',
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
    backgroundColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#0a84ff',
  },
  reorderButtonText: {
    color: '#0a84ff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyStateText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: '#aaa',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 24,
  },
  menuButton: {
    backgroundColor: '#0a84ff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  menuButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});