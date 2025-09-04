import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from 'react-native-reanimated';

// 1. Define TypeScript Interfaces
interface Category {
  id: string;
  name: string;
  image: any;
}

interface Promotion {
  id: string;
  text: string;
  image: any;
}

interface Event {
  id: string;
  title: string;
  date: string;
  teaser: string;
  image: any;
  description?: string;
}

interface PromoCardProps {
  item: Promotion;
  isActive: boolean;
}

interface CategoryTileProps {
  item: Category;
  imagesLoaded: boolean;
  handleImageLoad: () => void;
}

interface EventCardProps {
  item: Event;
}

// Utility function
function getImageUri(image: any): string {
  if (typeof image === 'string') return image;

  if (Platform.OS === 'web') {
    return image?.default || image;
  } else {
    return Image.resolveAssetSource(image).uri;
  }
}

// Sample Data
const categories: Category[] = [
  { id: '1', name: 'Cocktails', image: require('../../assets/images/cocktail.jpg') },
  { id: '2', name: 'Beers', image: require('../../assets/images/beer.png') },
  { id: '3', name: 'Snacks', image: require('../../assets/images/snacks.jpg') },
  { id: '4', name: 'Specials', image: require('../../assets/images/specials.jpg') },
];

const promotions: Promotion[] = [
  { id: '1', text: 'Get 10% off on all cocktails this weekend!', image: require('../../assets/images/cocktail-promo.jpg') },
  { id: '2', text: 'Happy Hour: 2-for-1 beers 4-6pm daily', image: require('../../assets/images/beer-promo.jpg') },
  { id: '3', text: 'Free snacks with 3+ drink orders', image: require('../../assets/images/snack-promo.jpg') },
];

const events: Event[] = [
  {
    id: '1',
    title: 'K Frayo',
    date: 'Fri, Aug 15 • 8 PM',
    teaser: 'Crazy mixes & special cocktails!',
    image: require('../../assets/images/kwe1.jpeg'),
  },
  {
    id: '2',
    title: 'Happy Hour',
    date: 'Mon-Fri • 4-6 PM',
    teaser: '2-for-1 beers and discounted snacks.',
    image: require('../../assets/images/happy-hour.jpg'),
  },
  {
    id: '3',
    title: 'Fantastic-Saturdays',
    date: 'Every Sato • 7pm till late',
    teaser: 'Unmissable.',
    image: require('../../assets/images/kwe4.jpeg'),
  },
];

// Components
function PromoCard({ item, isActive }: PromoCardProps) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <Pressable
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={[
        styles.promoCard, 
        isPressed && styles.pressedShadow,
        isActive && styles.activePromo
      ]}
      accessibilityLabel={`Promotion: ${item.text}`}
      accessibilityHint="Tap to learn more about this promotion"
    >
      <Image
        source={item.image}
        style={styles.promoImage}
        resizeMode="cover"
      />
      <View style={styles.promoTextContainer}>
        <Text style={styles.promoText}>{item.text}</Text>
      </View>
    </Pressable>
  );
}

function CategoryTile({ item, imagesLoaded, handleImageLoad }: CategoryTileProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const router = useRouter();

  const handleImageLoadComplete = () => {
    setImageLoaded(true);
    if (handleImageLoad) handleImageLoad();
  };

  return (
    <Pressable
      onPress={() => router.push({
        pathname: '/(tabs)/menu',
        params: { scrollToCategory: item.name }
      })}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={[styles.categoryTile, isPressed && styles.pressedShadow]}
    >
      {!imageLoaded && (
        <View style={styles.imagePlaceholder}>
          <ActivityIndicator size="small" color="#0a84ff" />
        </View>
      )}
      <Image
        source={item.image}
        style={styles.categoryImage}
        onLoad={handleImageLoadComplete}
      />
      <Text style={styles.categoryText}>{item.name}</Text>
    </Pressable>
  );
}

function EventCard({ item }: EventCardProps) {
  const [isPressed, setIsPressed] = useState(false);
  const router = useRouter();

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/eventdetails',
          params: {
            title: item.title,
            date: item.date,
            teaser: item.teaser,
            description: item.description || '',
            image: getImageUri(item.image),
          },
        })
      }
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={[
        styles.eventCard,
        isPressed && styles.pressedShadow,
      ]}
      accessibilityLabel={`Event: ${item.title}`}
      accessibilityHint="Tap to learn more about this event"
    >
      <Image source={item.image} style={styles.eventImage} resizeMode="cover" />
      <View style={styles.eventTextContainer}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.eventDate}>{item.date}</Text>
        <Text style={styles.eventTeaser}>{item.teaser}</Text>
        <Text style={styles.eventButton}>Learn More</Text>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  // State
  const [search, setSearch] = useState<string>('');
  const [imagesLoaded, setImagesLoaded] = useState<boolean>(false);
  const [currentPromoIndex, setCurrentPromoIndex] = useState<number>(0);

  // Animation setup
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
  const scaleValue = useSharedValue(1);
  const elevationValue = useSharedValue(5);

  useEffect(() => {
    scaleValue.value = withRepeat(
      withTiming(1.1, {
        duration: 1500,
        easing: Easing.ease,
      }),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
    elevation: elevationValue.value,
    shadowOpacity: elevationValue.value / 10,
  }));

  const pressIn = () => {
    elevationValue.value = withTiming(8, { duration: 100 });
  };

  const pressOut = () => {
    elevationValue.value = withTiming(5, { duration: 200 });
  };

  
  // Refs
  const promoFlatListRef = useRef<FlatList>(null);
  const scrollInterval = useRef<number | null>(null);
// Effects
useEffect(() => {
  const startAutoScroll = () => {
    scrollInterval.current = setInterval(() => {
      setCurrentPromoIndex(prev => {
        const nextIndex = (prev + 1) % promotions.length;
        promoFlatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        return nextIndex;
      });
    }, 3000);
  };

  startAutoScroll();

  return () => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
      scrollInterval.current = null;
    }
  };
}, [promotions.length]);

// Handlers
const handleManualScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
  const contentOffset = event.nativeEvent.contentOffset.x;
  const viewSize = event.nativeEvent.layoutMeasurement.width;
  const newIndex = Math.round(contentOffset / viewSize);

  if (scrollInterval.current) {
    clearInterval(scrollInterval.current);
    scrollInterval.current = null;
  }
  
  setCurrentPromoIndex(newIndex);
  
  // Restart auto-scroll with proper scrolling behavior
  scrollInterval.current = setInterval(() => {
    setCurrentPromoIndex(prev => {
      const nextIndex = (prev + 1) % promotions.length;
      promoFlatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      return nextIndex;
    });
  }, 3000);
};

const handleImageLoad = () => setImagesLoaded(true);

// Memoized data
  const filteredCategories = useMemo(() => 
    categories.filter(cat => 
      cat.name.toLowerCase().includes(search.toLowerCase())
    ), 
    [search]
  );

  return (
   <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }}
        accessibilityLabel="Home screen of K Bar app"
      >
        {/* Welcome Section */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle} accessibilityRole="header">
            Welcome to K Bar, Imos!{' '}
            <MaterialCommunityIcons name="glass-cocktail" size={34} color="#0a84ff" />
          </Text>
          <Text style={styles.welcomeSubtitle}>
            Cheers! Ready for your next drink?
          </Text>
        </View>

        {/* Search Section */}
        <TextInput
          style={styles.searchInput}
          placeholder="Search drinks or snacks..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
          accessibilityLabel="Search for drinks or snacks"
          accessibilityHint="Type to filter drink and snack categories"
        />

        {/* Empty Search State */}
        {search && filteredCategories.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No categories match your search</Text>
          </View>
        )}

        {/* Promotions Section */}
        <Text style={styles.sectionTitle}>🔥 "Don't Miss Out"</Text>
        {promotions.length > 0 ? (
          <FlatList
            ref={promoFlatListRef}
            horizontal
            data={promotions}
            keyExtractor={item => item.id}
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            onMomentumScrollEnd={handleManualScroll}
            scrollEventThrottle={16}
            initialScrollIndex={0}
            renderItem={({ item, index }) => (
              <PromoCard
                item={item}
                isActive={index === currentPromoIndex}
              />
            )}
            getItemLayout={(data, index) => ({
              length: 270 + 15,
              offset: (270 + 15) * index,
              index,
            })}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No current promotions</Text>
          </View>
        )}

        {/* Categories Section */}
        <Text style={styles.sectionTitle}>What are you craving!? 😋</Text>
        <FlatList
          horizontal
          data={filteredCategories}
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 10 }}
          renderItem={({ item }) => (
            <CategoryTile
              item={item}
              imagesLoaded={imagesLoaded}
              handleImageLoad={handleImageLoad}
            />
          )}
        />

        {/* Upcoming Events Section */}
        <Text style={styles.sectionTitle}>🎉 Upcoming Events & Specials</Text>
        {events.length > 0 ? (
          <FlatList
            horizontal
            data={events}
            keyExtractor={item => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 10 }}
            renderItem={({ item }) => (
              <EventCard
                item={item}
              />
            )}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No upcoming events at the moment.</Text>
          </View>
        )}

      </ScrollView>

      {/* Quick Order FAB - Replaces Menu FAB */}
      <AnimatedTouchable
        style={[styles.quickOrderFab, animatedStyle]}
        onPressIn={pressIn}
        onPressOut={pressOut}
        onPress={() => router.push('/quick-order')}
        activeOpacity={0.8}
        accessibilityLabel="Quick Order"
        accessibilityHint="Order popular items with one tap"
      >
        <LinearGradient
          colors={['#ff6b6b', '#ff3838']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <MaterialCommunityIcons name="lightning-bolt" size={28} color="white" />
        </LinearGradient>
      </AnimatedTouchable>
    </>
  );
}

const styles = StyleSheet.create({
  // Layout and Containers
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  welcomeContainer: {
    marginBottom: 25,
    alignItems: 'center',
  },

  // Text Styles
  welcomeTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#0a84ff',
    textShadowColor: 'rgba(10, 132, 255, 0.7)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  welcomeSubtitle: {
    marginTop: 6,
    fontSize: 18,
    color: '#aaa',
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0a84ff',
    marginTop: 25,
    marginBottom: 10,
  },

  // Inputs
  searchInput: {
    backgroundColor: '#222',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#fff',
  },

  // Category Styles
  categoryTile: {
    marginRight: 15,
    alignItems: 'center',
    width: 120,
    backgroundColor: '#1f1f1f',
    borderRadius: 16,
    paddingVertical: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  // ADDED: Missing imagePlaceholder style
  imagePlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
  },
  categoryImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 10,
  },
  categoryText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Promo Carousel Styles
  promoCard: {
    width: 270,
    height: 180,
    marginRight: 15,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1f1f1f',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    position: 'relative',
  },
  promoImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  promoTextContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  promoText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  pressedShadow: {
    transform: [{ scale: 0.98 }],
    elevation: 12,
    shadowColor: '#0a84ff',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  activePromo: {
    borderColor: '#0a84ff',
    borderWidth: 1,
  },
  //fab order button
  quickOrderFab: {
    position: 'absolute',
    bottom: 70,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowColor: 'rgba(10, 132, 255, 0.4)',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 5,
    zIndex: 10,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },

  eventCard: {
    width: 260,
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1f1f1f',
    marginRight: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    position: 'relative',
  },
  eventImage: {
    width: '100%',
    height: 100,
  },
  eventTextContainer: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  eventTitle: {
    color: '#0a84ff',
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 4,
  },
  eventDate: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 6,
  },
  eventTeaser: {
    color: '#ddd',
    fontSize: 14,
    flexShrink: 1,
  },
  eventButton: {
    marginTop: 8,
    color: '#1e90ff',
    fontWeight: '600',
    fontSize: 14,
    textDecorationLine: 'underline',
  },

  // Empty States
  emptyState: {
    padding: 15,
    backgroundColor: '#222',
    borderRadius: 8,
    marginTop: 10,
  },
  emptyStateText: {
    color: '#fff',
    textAlign: 'center',
  },
});