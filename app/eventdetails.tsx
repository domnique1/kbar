import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  ImageSourcePropType,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useTheme } from './contexts/ThemeContext';

// Define the expected params
type EventParams = Record<string, string | string[] | undefined>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function EventDetails() {
  const { theme, isDarkMode } = useTheme();
  const params = useLocalSearchParams();
  const { title, date, teaser, imageId, description } = params;
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [buttonScale] = useState(new Animated.Value(1));

  const styles = createStyles(theme, isDarkMode);

  // Simple function to get image based on imageId
  const getImageSource = (): ImageSourcePropType | null => {
    if (!imageId) return null;
    
    const idValue = Array.isArray(imageId) ? imageId[0] : imageId;
    
    switch (idValue) {
      case 'K Frayo':
      case '1':
        return require('../assets/images/kwe1.jpeg');
      case 'Happy Hour':
      case '2':
        return require('../assets/images/happy-hour.jpg');
      case 'Fantastic-Saturdays':
      case '3':
        return require('../assets/images/kwe4.jpeg');
      default:
        return null;
    }
  };

  const imageSource = getImageSource();

  // Helper function to get string value from potential array
  const getStringValue = (value: string | string[] | undefined): string => {
    if (Array.isArray(value)) {
      return value[0] || '';
    }
    return value || '';
  };

  // Format date to be more user-friendly
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // Button animation
  const animateButton = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleShare = () => {
    animateButton();
    console.log('Share event');
    // Add your share logic here
  };

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons 
            name="chevron-left" 
            size={28} 
            color={theme.text} 
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
      >
        {/* Image Section with Gradient Overlay */}
        <View style={styles.imageContainer}>
          {imageSource ? (
            <>
              {imageLoading && !imageError && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color={theme.primary} />
                </View>
              )}
              
              <Image
                source={imageSource}
                style={styles.image}
                resizeMode="cover"
                onLoadStart={() => {
                  setImageLoading(true);
                  setImageError(false);
                }}
                onLoadEnd={() => setImageLoading(false)}
                onError={() => {
                  setImageLoading(false);
                  setImageError(true);
                }}
              />
              
              {imageError && (
                <View style={styles.errorOverlay}>
                  <MaterialCommunityIcons name="image-off" size={48} color={theme.textSecondary} />
                  <Text style={styles.errorText}>Image failed to load</Text>
                </View>
              )}
              
              {/* Gradient Overlay using multiple views */}
              <View style={styles.gradientOverlayTop} />
              <View style={styles.gradientOverlayBottom} />
            </>
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialCommunityIcons name="image-off" size={48} color={theme.textSecondary} />
              <Text style={styles.placeholderText}>No Image Available</Text>
            </View>
          )}
        </View>

        {/* Event Content Card */}
        <View style={styles.contentCard}>
          <View style={styles.content}>
            <Text style={styles.title}>{getStringValue(title) || 'Event Title'}</Text>
            
            {date && (
              <View style={styles.dateContainer}>
                <View style={styles.dateIconContainer}>
                  <MaterialCommunityIcons 
                    name="calendar" 
                    size={20} 
                    color={theme.primary} 
                  />
                </View>
                <Text style={styles.date}>{formatDate(getStringValue(date))}</Text>
              </View>
            )}

            {/* Description with better typography */}
            <View style={styles.descriptionContainer}>
              <Text style={styles.description}>
                {getStringValue(description)?.trim() || getStringValue(teaser) || 'No details available.'}
              </Text>
            </View>

            {/* Action Button with animation */}
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleShare}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons 
                  name="share-variant" 
                  size={20} 
                  color="#fff" 
                  style={styles.buttonIcon}
                />
                <Text style={styles.actionButtonText}>Share This Event</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

        {/* Additional Info Section */}
        <View style={styles.infoCard}>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons 
              name="clock-outline" 
              size={20} 
              color={theme.primary} 
            />
            <Text style={styles.infoText}>Duration: 3-4 hours</Text>
          </View>
          <View style={styles.infoItem}>
            <MaterialCommunityIcons 
              name="account-group" 
              size={20} 
              color={theme.primary} 
            />
            <Text style={styles.infoText}>All ages welcome</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.background 
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: theme.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
  },
  headerTitle: {
    color: theme.text,
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  imageContainer: {
    width: '100%',
    height: 280,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  // Gradient overlay using solid colors with opacity
  gradientOverlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.2)',
  },
  gradientOverlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isDarkMode ? 'rgba(30,30,30,0.9)' : 'rgba(240,240,240,0.9)',
  },
  errorText: {
    color: theme.error,
    fontWeight: 'bold',
    marginTop: 8,
  },
  imagePlaceholder: {
    width: '100%',
    height: 280,
    backgroundColor: isDarkMode ? theme.surface : theme.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: theme.textSecondary,
    fontSize: 16,
    marginTop: 8,
  },
  contentCard: {
    backgroundColor: theme.surface,
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: theme.border,
  },
  content: { 
    padding: 24,
  },
  title: {
    color: theme.text,
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
    lineHeight: 38,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    padding: 12,
    borderRadius: 12,
  },
  dateIconContainer: {
    padding: 8,
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    marginRight: 12,
  },
  date: { 
    color: theme.textSecondary, 
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  description: { 
    color: theme.text,
    fontSize: 16, 
    lineHeight: 24,
    letterSpacing: 0.3,
  },
  actionButton: {
    backgroundColor: theme.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: theme.surface,
    marginHorizontal: 16,
    marginVertical: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    color: theme.textSecondary,
    fontSize: 14,
    marginLeft: 12,
    fontWeight: '500',
  },
});