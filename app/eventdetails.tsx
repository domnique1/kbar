import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Define the expected params as a record instead
type EventParams = Record<string, string | string[] | undefined>;

export default function EventDetails() {
  const params = useLocalSearchParams();
  const { title, date, teaser, image, description } = params;
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const getImageSource = (): ImageSourcePropType | null => {
    if (!image) return null;

    // Handle case where image might be an array (multiple values)
    const imageValue = Array.isArray(image) ? image[0] : image;

    if (Platform.OS === 'web' && typeof imageValue === 'object') {
      return imageValue as ImageSourcePropType;
    }

    if (typeof imageValue === 'string') {
      return { uri: imageValue };
    }

    return null;
  };

  const imageSource = getImageSource();

  // Helper function to get string value from potential array
  const getStringValue = (value: string | string[] | undefined): string => {
    if (Array.isArray(value)) {
      return value[0] || '';
    }
    return value || '';
  };

  return (
    <ScrollView style={styles.container}>
      {/* Image Section */}
      {imageSource ? (
        <View style={styles.imageContainer}>
          {imageLoading && !imageError && (  // Only show spinner when loading AND no error
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#0a84ff" />
            </View>
          )}
          
          <Image
            source={imageSource}
            style={styles.image}
            resizeMode="cover"
            onLoadStart={() => {
              setImageLoading(true);
              setImageError(false); // Reset error state when trying to load again
            }}
            onLoadEnd={() => setImageLoading(false)}
            onError={() => {
              setImageLoading(false);
              setImageError(true);
            }}
          />
          
          {imageError && (
            <View style={styles.errorOverlay}>
              <Text style={styles.errorText}>Image failed to load</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderText}>No Image Available</Text>
        </View>
      )}

      {/* Event Content */}
      <View style={styles.content}>
        <Text style={styles.title}>{getStringValue(title) || 'Event Title'}</Text>
        
        {date && (
          <View style={styles.dateContainer}>
            <MaterialCommunityIcons 
              name="calendar" 
              size={18} 
              color="#0a84ff" 
              style={styles.dateIcon}
            />
            <Text style={styles.date}>{getStringValue(date)}</Text>
          </View>
        )}

        <Text style={styles.description}>
          {getStringValue(description)?.trim() || getStringValue(teaser) || 'No details available.'}
        </Text>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => console.log('Share event')}
        >
          <Text style={styles.actionButtonText}>Share This Event</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#121212' 
  },
  imageContainer: {
    width: '100%',
    height: 220,
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(30,30,30,0.7)',
  },
  errorText: {
    color: '#ff5555',
    fontWeight: 'bold',
  },
  imagePlaceholder: {
    width: '100%',
    height: 220,
    backgroundColor: '#1f1f1f',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  placeholderText: {
    color: '#666',
    fontSize: 16,
  },
  content: { 
    padding: 20 
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateIcon: {
    marginRight: 8,
  },
  date: { 
    color: '#bbb', 
    fontSize: 16 
  },
  description: { 
    color: '#ddd', 
    fontSize: 16, 
    lineHeight: 24,
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: '#0a84ff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 16,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});