import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  ImageSourcePropType,
  RefreshControl,
  SectionList,
  SectionListData,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { triggerBadgeRefresh } from '../hooks/useTabBadges';

// Define shared order status types
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
  image: ImageSourcePropType;
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

interface MenuSection {
  title: string;
  data: MenuItem[];
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  emoji: string;
}

type Router = {
  replace: (path: string) => void;
  push: (path: string) => void;
};

const menuItems: MenuItem[] = [
  // Cocktails
  {
    id: '1',
    name: 'Mojito',
    category: 'Cocktails',
    price: 7.99,
    description: 'Refreshing cocktail with lime and mint',
    image: require('../../assets/images/mojito.jpg'),
    isPopular: true,
  },
  {
    id: '2',
    name: 'Pina Colada',
    category: 'Cocktails',
    price: 7.99,
    description: 'Creamy coconut and pineapple cocktail',
    image: require('../../assets/images/pinacolada.jpg'),
  },
  {
    id: '3',
    name: 'Old Fashioned',
    category: 'Cocktails',
    price: 9.99,
    description: 'Classic whiskey cocktail with bitters',
    image: require('../../assets/images/fash.jpg'),
  },
  
  // Beers
  {
    id: '4',
    name: 'Lager Beer',
    category: 'Beers',
    price: 5.0,
    description: 'Crisp and cold lager beer',
    image: require('../../assets/images/beer.jpg'),
  },
  {
    id: '5',
    name: 'IPA',
    category: 'Beers',
    price: 6.5,
    description: 'Hoppy craft IPA with citrus notes',
    image: require('../../assets/images/ipa.jpg'),
  },
  
  // Snacks
  {
    id: '6',
    name: 'Chicken Wings',
    category: 'Snacks',
    price: 9.5,
    description: 'Spicy and crispy chicken wings',
    image: require('../../assets/images/chicken_wings.jpg'),
    isSpicy: true,
  },
  {
    id: '7',
    name: 'Doritos',
    category: 'Snacks',
    price: 4.5,
    description: 'Spicy and crispy corn chips',
    image: require('../../assets/images/dorito.jpg'),
  },
  
  // Specials
  {
    id: '8',
    name: "Bartender's Special",
    category: 'Specials',
    price: 10.99,
    description: 'Ask your server about today special mix',
    image: require('../../assets/images/specials.jpg'),
    isSpecial: true,
  }
];

// Helper functions
const groupByCategory = (items: MenuItem[]): Record<string, MenuItem[]> => {
  return items.reduce((acc, item) => {
    const category = item.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);
};

const prepareSections = (items: MenuItem[]): MenuSection[] => {
  return Object.entries(groupByCategory(items)).map(([title, data]) => ({
    title,
    data,
  }));
};

// Store order function
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

// Helper function to get emoji based on item name
const getItemEmoji = (itemName: string): string => {
  const emojiMap: Record<string, string> = {
    'Mojito': '🍹',
    'Pina Colada': '🍹',
    'Old Fashioned': '🥃',
    'Lager Beer': '🍺',
    'IPA': '🍺',
    'Chicken Wings': '🍗',
    'Doritos': '🌮',
    "Bartender's Special": '⭐'
  };
  return emojiMap[itemName] || '🍽️';
};

// Get cart items count
const getCartItemsCount = async (): Promise<number> => {
  try {
    const cartItems = JSON.parse(await AsyncStorage.getItem('userCart') || '[]');
    return cartItems.reduce((total: number, item: CartItem) => total + item.quantity, 0);
  } catch (error) {
    console.error('Error getting cart count:', error);
    return 0;
  }
};

// Check for existing unpaid orders
const checkExistingUnpaidOrder = async (): Promise<Order | null> => {
  try {
    const storedOrders = await AsyncStorage.getItem('userOrders');
    if (storedOrders) {
      const orders: Order[] = JSON.parse(storedOrders);
      const unpaidOrder = orders.find(order => 
        order.status === 'pending_payment' || 
        order.status === 'payment_processing'
      );
      return unpaidOrder || null;
    }
    return null;
  } catch (error) {
    console.error('Error checking for unpaid orders:', error);
    return null;
  }
};

export default function MenuScreen() {
  const { theme, isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [showBanner, setShowBanner] = useState(false);
  const [bannerMessage, setBannerMessage] = useState('');
  const [orderCreated, setOrderCreated] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const bannerAnimation = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<SectionList<MenuItem, MenuSection>>(null);
  const router = useRouter() as Router;
  const params = useLocalSearchParams();
  const pathname = usePathname();

  const styles = createMainStyles(theme, isDarkMode);

  // Prepare and filter sections
  const menuSections = useMemo(() => prepareSections(menuItems), []);
  const filteredSections = useMemo(() => {
    if (!searchQuery) return menuSections;
    
    return menuSections
      .map(section => ({
        ...section,
        data: section.data.filter(item => 
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }))
      .filter(section => section.data.length > 0);
  }, [menuSections, searchQuery]);

  // Load cart items count on mount
  useEffect(() => {
    loadCartItemsCount();
  }, []);

  // Show/hide banner animation
  useEffect(() => {
    if (showBanner) {
      Animated.sequence([
        Animated.timing(bannerAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2500),
        Animated.timing(bannerAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowBanner(false);
      });
    }
  }, [showBanner, bannerAnimation]);

  // Scroll to category effect
  useEffect(() => {
    const scrollToCategory = params?.scrollToCategory as string;
    if (!scrollToCategory || !flatListRef.current) return;

    const sectionIndex = filteredSections.findIndex(
      section => section.title === scrollToCategory
    );
    
    if (sectionIndex !== -1) {
      setTimeout(() => {
        flatListRef.current?.scrollToLocation({
          sectionIndex,
          itemIndex: 0,
          animated: true,
          viewPosition: 0.1,
        });
      }, 100);
    }
  }, [params, filteredSections]);

  // ORDER CONFIRMATION ALERT EFFECT - ADDED BACK
  useEffect(() => {
    if (params.orderCreated === 'true') {
      // Use a state to trigger the alert to avoid issues with navigation during render
      setOrderCreated(true);
      // Clear the URL parameter immediately
      router.replace(pathname);
    }
  }, [params.orderCreated, pathname]);

  // Show the confirmation alert when orderCreated state changes
  useEffect(() => {
    if (orderCreated) {
      Alert.alert(
        "Order Saved! ✅",
        "Your order has been saved. You can complete payment anytime from the Orders tab.",
        [{ 
          text: "OK", 
          onPress: () => setOrderCreated(false)
        }]
      );
    }
  }, [orderCreated]);

  const loadCartItemsCount = async () => {
    const count = await getCartItemsCount();
    setCartItemsCount(count);
  };

  // Pull to refresh function - Updated to match QuickOrderScreen style
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate refresh without showing banner message
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const placeOrder = async (item: MenuItem, quantity: number) => {
    try {
      // Check for existing unpaid orders
      const existingUnpaidOrder = await checkExistingUnpaidOrder();
      if (existingUnpaidOrder) {
        Alert.alert(
          "Pending Payment",
          `You have an unpaid order (#${existingUnpaidOrder.orderNumber}). 
          Please complete payment before creating a new order.`,
          [{ text: "OK", onPress: () => router.push('/(tabs)/orders') }]
        );
        return;
      }

      // Create order object with the correct quantity
      const orderId = Math.random().toString(36).substring(2, 9);
      const newOrder: Order = {
        id: orderId,
        orderNumber: orderId,
        items: [{
          ...item,
          quantity: quantity, // Use the passed quantity instead of hardcoded 1
          emoji: getItemEmoji(item.name)
        }],
        total: item.price * quantity, // Calculate total based on quantity
        status: 'pending_payment',
        timestamp: new Date().toISOString(),
        type: 'menu'
      };
      
      // Save order to AsyncStorage
      const success = await storeOrder(newOrder);
      
      if (success) {
        // Trigger badge update for new unpaid order
        triggerBadgeRefresh();
        
        // Show success alert with option to view orders
        Alert.alert(
          "Order Placed! 🎉",
          `Your ${quantity} ${item.name}${quantity > 1 ? 's' : ''} has been added to your orders. Please complete payment.`,
          [
            {
              text: "View Orders",
              onPress: () => router.push("/(tabs)/orders"),
              style: "default"
            },
            { 
              text: "Continue Browsing", 
              style: "cancel"
            }
          ]
        );

      } else {
        Alert.alert("Error", "Failed to save your order. Please try again.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to place order. Please try again.");
      console.error("Order error:", error);
    }
  };

  const addToCart = async (item: MenuItem, quantity: number) => {
    try {
      const cartItems: CartItem[] = JSON.parse(await AsyncStorage.getItem('userCart') || '[]');
      const existingItemIndex = cartItems.findIndex(cartItem => cartItem.id === item.id);
      
      if (existingItemIndex !== -1) {
        // Update quantity if item already exists
        cartItems[existingItemIndex].quantity += quantity;
      } else {
        // Add new item to cart
        cartItems.push({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity,
          emoji: getItemEmoji(item.name)
        });
      }
      
      await AsyncStorage.setItem('userCart', JSON.stringify(cartItems));
      
      // Update cart count
      const newCount = cartItems.reduce((total, item) => total + item.quantity, 0);
      setCartItemsCount(newCount);

      // Trigger real-time badge update
      triggerBadgeRefresh();
      
      // Show banner
      setBannerMessage(`${quantity} ${item.name}${quantity > 1 ? 's' : ''} added to cart! Keep browsing or go to Cart to review items 🛒`);
      setShowBanner(true);
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      Alert.alert("Error", "Failed to add item to cart. Please try again.");
    }
  };

  const renderItem = ({ item }: { item: MenuItem }) => {
    const [quantity, setQuantity] = useState(1);
    
    const increaseQuantity = () => setQuantity(prev => prev + 1);
    const decreaseQuantity = () => setQuantity(prev => Math.max(1, prev - 1));
    
    return (
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          <Image source={item.image} style={styles.image} resizeMode="cover" />
        </View>
        
        <View style={styles.info}>
          <View style={styles.headerRow}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.price}>${item.price.toFixed(2)}</Text>
          </View>
          
          <View style={[styles.badge, styles.categoryBadge]}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
          
          <Text style={styles.description}>{item.description}</Text>
          
          {/* Updated Quantity Selector - Matching Quick Order Screen */}
          <View style={styles.quantityContainer}>
            <TouchableOpacity 
              style={[styles.quantityButton, quantity <= 1 && styles.quantityButtonDisabled]} 
              onPress={decreaseQuantity}
              disabled={quantity <= 1}
            >
              <MaterialCommunityIcons name="minus" size={16} color="#fff" />
            </TouchableOpacity>
            
            <Text style={styles.quantityText}>{quantity}</Text>
            
            <TouchableOpacity 
              style={styles.quantityButton} 
              onPress={increaseQuantity}
            >
              <MaterialCommunityIcons name="plus" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          
          {/* Buttons Row */}
          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={[styles.button, styles.orderButton]}
              onPress={() => placeOrder(item, quantity)} // Fixed parameter passing
            >
              <Text style={styles.buttonText}>Order Now</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.cartButton]}
              onPress={() => addToCart(item, quantity)}
            >
              <Text style={styles.buttonText}>Add to Cart</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderSectionHeader = ({ section }: { section: SectionListData<MenuItem, MenuSection> }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
    </View>
  );

  const bannerTranslateY = bannerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 0],
  });

  return (
    <View style={styles.container}>
      {/* Feedback Banner */}
      {showBanner && (
        <Animated.View 
          style={[
            styles.banner,
            { transform: [{ translateY: bannerTranslateY }] }
          ]}
        >
          <Text style={styles.bannerText}>{bannerMessage}</Text>
        </Animated.View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search menu items..."
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity 
            style={styles.clearSearch} 
            onPress={() => setSearchQuery('')}
          >
            <MaterialCommunityIcons name="close" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        ) : (
          <MaterialCommunityIcons name="magnify" size={20} color={theme.textSecondary} />
        )}
      </View>

      {/* Menu List */}
      <SectionList
        ref={flatListRef}
        sections={filteredSections}
        keyExtractor={(item: MenuItem) => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={true}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
            title="Pull to refresh"
            titleColor={theme.textSecondary}
          />
        }
        onScrollToIndexFailed={(info) => {
          flatListRef.current?.scrollToLocation({
            sectionIndex: info.index,
            itemIndex: 0,
            animated: true,
            viewPosition: 0,
          });
        }}
      />
    </View>
  );
}

const createMainStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#222' : theme.surface,
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  searchInput: {
    flex: 1,
    color: theme.text,
    height: 48,
    paddingRight: 8,
  },
  clearSearch: {
    padding: 8,
  },
  listContent: {
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: isDarkMode ? '#222' : theme.surface,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: isDarkMode ? '#000' : theme.primary,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: theme.border,
  },
  imageContainer: {
    position: 'relative',
    width: 120,
    height: 120,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    flexShrink: 1,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.primary,
    marginLeft: 8,
  },
  description: {
    color: theme.textSecondary,
    fontSize: 14,
    marginVertical: 8,
  },
  spicyText: {
    color: '#ff6348',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Updated Quantity Controls to match Quick Order Screen
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
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderButton: {
    backgroundColor: isDarkMode ? '#ff4757' : '#ff6b6b',
  },
  cartButton: {
    backgroundColor: theme.primary,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: isDarkMode ? '#27ae60' : '#4caf50',
    padding: 16,
    zIndex: 1000,
  },
  bannerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    top: 8,
    right: 8,
  },
  popularBadge: {
    backgroundColor: '#ff4757',
  },
  specialBadge: {
    backgroundColor: '#ffa502',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  categoryBadge: {
    backgroundColor: theme.primary,
    alignSelf: 'flex-start',
    position: 'relative',
    top: 0,
    right: 0,
    marginBottom: 8,
  },
  categoryText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  sectionHeader: {
    backgroundColor: theme.background,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  sectionHeaderText: {
    color: theme.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
});