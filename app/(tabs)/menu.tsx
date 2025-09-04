import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  ImageSourcePropType,
  SectionList,
  SectionListData,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

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
  status: string;
  timestamp: string;
  type: string;
}

interface MenuSection {
  title: string;
  data: MenuItem[];
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

// Store order function (same as quick-order.js)
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

export default function MenuScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  // Fix: Use MenuSection as the second generic type parameter
  const flatListRef = useRef<SectionList<MenuItem, MenuSection>>(null);
  const router = useRouter() as Router;
  const params = useLocalSearchParams();

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

  const placeOrder = async (item: MenuItem) => {
    try {
      // Create order object with orderNumber instead of just id
      const orderId = Math.random().toString(36).substring(2, 9);
      const newOrder: Order = {
        id: orderId,
        orderNumber: orderId, // Add this line - orders.js expects orderNumber
        items: [{
          ...item,
          quantity: 1,
          emoji: getItemEmoji(item.name)
        }],
        total: item.price,
        status: 'preparing',
        timestamp: new Date().toISOString(),
        type: 'menu'
      };
      
      // Save order to AsyncStorage
      const success = await storeOrder(newOrder);
      
      if (success) {
        // Show success alert with option to view orders
        Alert.alert(
          "Order Placed! 🎉",
          `Your ${item.name} has been added to your orders.`,
          [
            {
              text: "View Orders",
              onPress: () => router.push("/(tabs)/orders"),
              style: "default" as const
            },
            { 
              text: "Continue Browsing", 
              style: "cancel" as const
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

  const renderItem = ({ item }: { item: MenuItem }) => (
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
        
        <TouchableOpacity
          style={styles.button}
          onPress={() => placeOrder(item)}
        >
          <Text style={styles.buttonText}>Order Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

   const renderSectionHeader = ({ section }: { section: SectionListData<MenuItem, MenuSection> }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search menu items..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity 
            style={styles.clearSearch} 
            onPress={() => setSearchQuery('')}
          >
            <MaterialCommunityIcons name="close" size={20} color="#888" />
          </TouchableOpacity>
        ) : (
          <MaterialCommunityIcons name="magnify" size={20} color="#888" />
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
        onScrollToIndexFailed={(info) => {
          // Use scrollToLocation for SectionList instead of scrollToOffset
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
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
    backgroundColor: '#222',
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
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
    color: '#fff',
    flexShrink: 1,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a84ff',
    marginLeft: 8,
  },
  description: {
    color: '#bbb',
    fontSize: 14,
    marginVertical: 8,
  },
  spicyText: {
    color: '#ff6348',
    fontSize: 12,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#0a84ff',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
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
    backgroundColor: '#1e90ff',
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
    backgroundColor: '#121212',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sectionHeaderText: {
    color: '#0a84ff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});