import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
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
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Enhanced Interfaces
interface Category {
  id: string;
  name: string;
  image: any;
  popularity?: number;
  isTrending?: boolean;
}

interface Promotion {
  id: string;
  text: string;
  image: any;
  badge?: string;
  gradient?: readonly [string, string, ...string[]];
}

interface Event {
  id: string;
  title: string;
  date: string;
  teaser: string;
  image: any;
  description?: string;
  countdown?: string;
  isLive?: boolean;
}

// Loyalty System Interface from Settings
interface LoyaltyInfo {
  points: number;
  tier: string;
  hasOrders: boolean;
}

// Enhanced Props
interface PromoCardProps {
  item: Promotion;
  index: number;
  scrollX: Animated.SharedValue<number>;
  theme: any;
  isDarkMode: boolean;
}

interface CategoryTileProps {
  item: Category;
  theme: any;
  isDarkMode: boolean;
}

interface EventCardProps {
  item: Event;
  theme: any;
  isDarkMode: boolean;
}

// Fixed gradient definitions with professional blue for light mode
const PROMO_GRADIENTS = {
  primary: ['#667eea', '#764ba2'] as const,
  secondary: ['#f093fb', '#f5576c'] as const,
  accent: ['#4facfe', '#00f2fe'] as const,
};

const HERO_GRADIENTS = {
  light: ['#00ADEF', '#2b5876'] as const, // Professional blue gradient
  dark: ['#1a1a2e', '#16213e'] as const,
};

// Enhanced Sample Data - USING ONLY EXISTING IMAGES
const categories: Category[] = [
  { id: '1', name: 'Cocktails', image: require('../../assets/images/cocktail.jpg'), popularity: 95, isTrending: true },
  { id: '2', name: 'Craft Beers', image: require('../../assets/images/beer.png'), popularity: 88 },
  { id: '3', name: 'Snacks', image: require('../../assets/images/snacks.jpg'), popularity: 76 },
  { id: '4', name: 'Specials', image: require('../../assets/images/specials.jpg'), popularity: 92, isTrending: true },
  { id: '5', name: 'Happy Hour', image: require('../../assets/images/happy-hour.jpg'), popularity: 82 },
  { id: '6', name: 'Events', image: require('../../assets/images/kwe1.jpeg'), popularity: 78 },
];

const promotions: Promotion[] = [
  { 
    id: '1', 
    text: 'Get 10% off on all cocktails this weekend!', 
    image: require('../../assets/images/cocktail-promo.jpg'),
    badge: 'Limited Time',
    gradient: PROMO_GRADIENTS.primary
  },
  { 
    id: '2', 
    text: 'Happy Hour: 2-for-1 beers 4-6pm daily', 
    image: require('../../assets/images/beer-promo.jpg'),
    badge: 'Daily Deal',
    gradient: PROMO_GRADIENTS.secondary
  },
  { 
    id: '3', 
    text: 'Free snacks with 3+ drink orders', 
    image: require('../../assets/images/snack-promo.jpg'),
    badge: 'Popular',
    gradient: PROMO_GRADIENTS.accent
  },
];

const events: Event[] = [
  {
    id: '1',
    title: 'K Frayo Live',
    date: 'Fri, Aug 15 • 8 PM',
    teaser: 'Crazy mixes & special cocktails!',
    image: require('../../assets/images/kwe1.jpeg'),
    countdown: '2 days left',
    isLive: true,
  },
  {
    id: '2',
    title: 'Happy Hour Madness',
    date: 'Mon-Fri • 4-6 PM',
    teaser: '2-for-1 beers and discounted snacks.',
    image: require('../../assets/images/happy-hour.jpg'),
    isLive: false,
  },
  {
    id: '3',
    title: 'Fantastic Saturdays',
    date: 'Every Saturday • 7pm till late',
    teaser: 'Unmissable night with DJ sets',
    image: require('../../assets/images/kwe4.jpeg'),
    countdown: 'This Saturday',
    isLive: false,
  },
];

// Enhanced PromoCard with Parallax
function EnhancedPromoCard({ item, index, scrollX, theme, isDarkMode }: PromoCardProps) {
  const [isPressed, setIsPressed] = useState(false);
  
  const inputRange = [
    (index - 1) * SCREEN_WIDTH,
    index * SCREEN_WIDTH,
    (index + 1) * SCREEN_WIDTH,
  ];

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.9, 1, 0.9],
      'clamp'
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.6, 1, 0.6],
      'clamp'
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const styles = createPromoCardStyles(theme, isDarkMode);

  return (
    <Animated.View style={[styles.promoCardContainer, animatedStyle]}>
      <Pressable
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        style={[
          styles.promoCard,
          isPressed && styles.pressedShadow,
        ]}
      >
        <LinearGradient
          colors={item.gradient || PROMO_GRADIENTS.primary}
          style={styles.promoGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Image
            source={item.image}
            style={styles.promoImage}
            resizeMode="cover"
          />
          <View style={styles.promoOverlay} />
          
          {item.badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.badge}</Text>
            </View>
          )}
          
          <View style={styles.promoTextContainer}>
            <Text style={styles.promoText}>{item.text}</Text>
            <View style={styles.promoCta}>
              <Text style={styles.promoCtaText}>Claim Offer</Text>
              <MaterialCommunityIcons name="arrow-right" size={16} color="#fff" />
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// Enhanced Category Tile
function EnhancedCategoryTile({ item, theme, isDarkMode }: CategoryTileProps) {
  const [isPressed, setIsPressed] = useState(false);
  const router = useRouter();
  const styles = createCategoryTileStyles(theme, isDarkMode);

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
      <View style={styles.categoryImageContainer}>
        <Image
          source={item.image}
          style={styles.categoryImage}
        />
        {item.isTrending && (
          <View style={styles.trendingBadge}>
            <MaterialCommunityIcons name="fire" size={12} color="#fff" />
          </View>
        )}
        <View style={styles.popularityBar}>
          <View 
            style={[
              styles.popularityFill,
              { 
                transform: [
                  { 
                    scaleX: item.popularity 
                      ? Math.max(0, Math.min(1, item.popularity / 100)) 
                      : 0 
                  }
                ] 
              }
            ]} 
          />
        </View>
      </View>
      <Text style={styles.categoryText}>{item.name}</Text>
      <Text style={styles.popularityText}>{item.popularity}% popular</Text>
    </Pressable>
  );
}

// Enhanced Event Card
function EnhancedEventCard({ item, theme, isDarkMode }: EventCardProps) {
  const [isPressed, setIsPressed] = useState(false);
  const router = useRouter();
  const styles = createEventCardStyles(theme, isDarkMode);

  return (
    <Pressable
      onPress={() => router.push('/eventdetails')}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={[styles.eventCard, isPressed && styles.pressedShadow]}
    >
      <Image source={item.image} style={styles.eventImage} />
      
      {item.isLive && (
        <View style={styles.liveBadge}>
          <View style={styles.livePulse} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      )}
      
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)'] as const}
        style={styles.eventGradient}
      >
        <View style={styles.eventContent}>
          <View>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <Text style={styles.eventDate}>{item.date}</Text>
            <Text style={styles.eventTeaser}>{item.teaser}</Text>
          </View>
          
          <View style={styles.eventFooter}>
            {item.countdown && (
              <Text style={styles.countdownText}>{item.countdown}</Text>
            )}
            <View style={styles.eventButton}>
              <Text style={styles.eventButtonText}>Details</Text>
              <MaterialCommunityIcons name="chevron-right" size={16} color={theme.primary} />
            </View>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

// Loyalty Display Component with proper logic from Settings
function LoyaltyDisplay({ loyaltyInfo }: { loyaltyInfo: LoyaltyInfo }) {
  const styles = createLoyaltyStyles();

  if (!loyaltyInfo.hasOrders) {
    return (
      <View style={styles.loyaltyContainer}>
        <Text style={styles.welcomeMessage}>
          🎉 Welcome to K Bar! 
        </Text>
        <Text style={styles.earnPointsText}>
          Start ordering to earn points and unlock rewards!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.loyaltyContainer}>
      <Text style={styles.userPoints}>{loyaltyInfo.points} Points</Text>
      <Text style={styles.userTier}>• {loyaltyInfo.tier}</Text>
    </View>
  );
}

export default function EnhancedHomeScreen() {
  const { theme, isDarkMode } = useTheme();
  const router = useRouter();
  
  // State
  const [search, setSearch] = useState<string>('');
  const [currentPromoIndex, setCurrentPromoIndex] = useState<number>(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(true);
  const [loyaltyInfo, setLoyaltyInfo] = useState<LoyaltyInfo>({
    points: 0,
    tier: "KBar Member",
    hasOrders: false
  });
  
  // Animation values
  const scrollX = useSharedValue(0);
  const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
  const scaleValue = useSharedValue(1);

  // Refs - Using number type for React Native compatibility
  const promoFlatListRef = useRef<FlatList>(null);
  const scrollInterval = useRef<number | null>(null);
  const autoScrollTimeout = useRef<number | null>(null);

  // Load loyalty data from AsyncStorage (same as settings screen)
  const loadLoyaltyData = async () => {
    try {
      const savedLoyaltyPoints = await AsyncStorage.getItem('userLoyaltyPoints');
      const savedOrders = await AsyncStorage.getItem('userOrders');
      
      let points = 0;
      let hasOrders = false;

      if (savedLoyaltyPoints !== null) {
        points = JSON.parse(savedLoyaltyPoints);
      }

      if (savedOrders !== null) {
        const orders = JSON.parse(savedOrders);
        hasOrders = orders && orders.length > 0;
      }

      // Determine tier using the same logic as settings screen
      const tier = getLoyaltyTier(points);

      setLoyaltyInfo({
        points,
        tier,
        hasOrders
      });
    } catch (error) {
      console.error('Error loading loyalty data:', error);
    }
  };

  // Loyalty tier logic from settings screen
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

  // Enhanced auto-scroll with user interaction handling - FIXED
  const startAutoScroll = () => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
    }

    scrollInterval.current = setInterval(() => {
      if (isAutoScrolling && promotions.length > 0) {
        setCurrentPromoIndex(prev => {
          const nextIndex = (prev + 1) % promotions.length;
          // Use scrollToOffset instead of scrollToIndex for better control
          promoFlatListRef.current?.scrollToOffset({
            offset: nextIndex * (SCREEN_WIDTH * 0.8 + 15),
            animated: true,
          });
          return nextIndex;
        });
      }
    }, 3000) as unknown as number;
  };

  const stopAutoScroll = () => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
      scrollInterval.current = null;
    }
  };

  const handleUserInteraction = () => {
    setIsAutoScrolling(false);
    stopAutoScroll();

    // Resume auto-scroll after 3 seconds of inactivity
    if (autoScrollTimeout.current) {
      clearTimeout(autoScrollTimeout.current);
    }

    autoScrollTimeout.current = setTimeout(() => {
      setIsAutoScrolling(true);
      startAutoScroll();
    }, 3000) as unknown as number;
  };

  // Load loyalty data on component mount
  useEffect(() => {
    loadLoyaltyData();
    startAutoScroll();

    return () => {
      stopAutoScroll();
      if (autoScrollTimeout.current) {
        clearTimeout(autoScrollTimeout.current);
      }
    };
  }, []);

  // FAB animation
  useEffect(() => {
    scaleValue.value = withRepeat(
      withTiming(1.1, { duration: 1500, easing: Easing.ease }),
      -1,
      true,
    );
  }, []);

  // Fixed scroll handler for promotions
  const promoScrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
      const newIndex = Math.round(event.contentOffset.x / (SCREEN_WIDTH * 0.8 + 15));
      if (newIndex >= 0 && newIndex < promotions.length) {
        runOnJS(setCurrentPromoIndex)(newIndex);
      }
    },
    onBeginDrag: () => {
      runOnJS(handleUserInteraction)();
    },
    onMomentumEnd: () => {
      runOnJS(handleUserInteraction)();
    },
  });

  // Get time-based greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const styles = createMainStyles(theme, isDarkMode);

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Enhanced Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={isDarkMode ? HERO_GRADIENTS.dark : HERO_GRADIENTS.light}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.heroContent}>
              <Text style={styles.heroGreeting}>
                {getTimeBasedGreeting()}, Imos! {' '}
                <MaterialCommunityIcons name="glass-cocktail" size={28} color="#fff" />
              </Text>
              <Text style={styles.heroSubtitle}>
                Ready to discover your next favorite drink?
              </Text>
              
              {/* Loyalty Display */}
              <LoyaltyDisplay loyaltyInfo={loyaltyInfo} />
            </View>
          </LinearGradient>
        </View>

        {/* Enhanced Search */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color={theme.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search drinks, snacks, or events..."
            placeholderTextColor={theme.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Enhanced Promotions with Auto-scroll - FIXED */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🔥 Hot Deals</Text>
          {/* No "See All" button as requested */}
        </View>
        
        <Animated.FlatList
          ref={promoFlatListRef}
          horizontal
          data={promotions}
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          snapToInterval={SCREEN_WIDTH * 0.8 + 15}
          decelerationRate="fast"
          onScroll={promoScrollHandler}
          scrollEventThrottle={16}
          contentContainerStyle={styles.promoListContent}
          renderItem={({ item, index }) => (
            <EnhancedPromoCard
              item={item}
              index={index}
              scrollX={scrollX}
              theme={theme}
              isDarkMode={isDarkMode}
            />
          )}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH * 0.8 + 15,
            offset: (SCREEN_WIDTH * 0.8 + 15) * index,
            index,
          })}
        />
        
        {/* Promo Indicators */}
        <View style={styles.promoIndicators}>
          {promotions.map((_, index) => (
            <View
              key={index}
              style={[
                styles.promoIndicator,
                index === currentPromoIndex && styles.promoIndicatorActive,
              ]}
            />
          ))}
        </View>

        {/* Enhanced Categories */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🎯 Popular Categories</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/menu')}>
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        <FlatList
          horizontal
          data={categories}
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
          renderItem={({ item }) => (
            <EnhancedCategoryTile
              item={item}
              theme={theme}
              isDarkMode={isDarkMode}
            />
          )}
        />

        {/* Enhanced Events */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🎉 Upcoming Events</Text>
          {/* No "See All" button as requested */}
        </View>
        
        <FlatList
          horizontal
          data={events}
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.eventsContent}
          renderItem={({ item }) => (
            <EnhancedEventCard
              item={item}
              theme={theme}
              isDarkMode={isDarkMode}
            />
          )}
        />

      </ScrollView>

      {/* Enhanced FAB */}
      <AnimatedTouchable
        style={[styles.quickOrderFab, useAnimatedStyle(() => ({
          transform: [{ scale: scaleValue.value }]
        }))]}
        onPress={() => router.push('/quick-order')}
      >
        <LinearGradient
          colors={['#ff6b6b', '#ff3838'] as const}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialCommunityIcons name="lightning-bolt" size={24} color="white" />
          <Text style={styles.fabText}>Quick</Text>
        </LinearGradient>
      </AnimatedTouchable>
    </>
  );
}

// Loyalty Styles
const createLoyaltyStyles = () => StyleSheet.create({
  loyaltyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  userPoints: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  userTier: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 8,
  },
  welcomeMessage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  earnPointsText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
});

// Enhanced Styles
const createMainStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  heroSection: {
    height: 200,
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'center',
  },
  heroContent: {
    padding: 20,
  },
  heroGreeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#1f1f1f' : theme.surface,
    margin: 20,
    marginTop: -30,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: theme.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 25,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.text,
  },
  seeAllText: {
    color: theme.primary,
    fontWeight: '600',
  },
  promoListContent: {
    paddingHorizontal: 20,
  },
  promoIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  promoIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.textSecondary,
    marginHorizontal: 4,
  },
  promoIndicatorActive: {
    width: 20,
    backgroundColor: theme.primary,
  },
  categoriesContent: {
    paddingHorizontal: 20,
  },
  eventsContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  quickOrderFab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    elevation: 12,
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
});

const createPromoCardStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  promoCardContainer: {
    width: SCREEN_WIDTH * 0.8,
    height: 200,
    marginRight: 15,
  },
  promoCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  promoGradient: {
    flex: 1,
    position: 'relative',
  },
  promoImage: {
    width: '100%',
    height: '100%',
    opacity: 0.7,
  },
  promoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  promoTextContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  promoText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  promoCta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promoCtaText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  pressedShadow: {
    transform: [{ scale: 0.96 }],
  },
});

const createCategoryTileStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  categoryTile: {
    marginRight: 15,
    alignItems: 'center',
    width: 100,
  },
  categoryImageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  categoryImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  trendingBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ff4757',
    borderRadius: 8,
    padding: 2,
  },
  popularityBar: {
    position: 'absolute',
    bottom: -6,
    left: 10,
    right: 10,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1.5,
  },
  popularityFill: {
    height: '100%',
    backgroundColor: theme.primary,
    borderRadius: 1.5,
  },
  categoryText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  popularityText: {
    color: theme.textSecondary,
    fontSize: 10,
  },
  pressedShadow: {
    transform: [{ scale: 0.95 }],
  },
});

const createEventCardStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  eventCard: {
    width: 280,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 15,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  eventGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  eventContent: {
    padding: 16,
  },
  eventTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  eventDate: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginBottom: 6,
  },
  eventTeaser: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    marginBottom: 12,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countdownText: {
    color: '#ffd700',
    fontSize: 11,
    fontWeight: '600',
  },
  eventButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventButtonText: {
    color: theme.primary,
    fontSize: 12,
    fontWeight: '600',
    marginRight: 2,
  },
  liveBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    marginRight: 4,
  },
  liveText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  pressedShadow: {
    transform: [{ scale: 0.96 }],
  },
});