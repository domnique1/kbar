// app/(tabs)/settings.tsx
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

// Define proper types for MaterialCommunityIcons names
type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

// Add Order interface to match orders screen
interface Order {
  id: string;
  status: string;
}

export default function SettingsScreen() {
  const { theme, isDarkMode, setDarkMode } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [userData, setUserData] = useState({
    name: "Bill Dom",
    email: "billdom@gmail.com",
    loyaltyPoints: 0,
    loyaltyTier: "KBar Member",
    phone: "+1 (555) 123-4567"
  });
  const router = useRouter();

  // Load user data including loyalty points from AsyncStorage
  useEffect(() => {
    loadUserData();
    loadPreferences();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async (): Promise<void> => {
    try {
      // Load loyalty points from the same AsyncStorage key used in orders screen
      const savedLoyaltyPoints = await AsyncStorage.getItem('userLoyaltyPoints');
      const savedUserProfile = await AsyncStorage.getItem('userProfile');
      
      if (savedLoyaltyPoints !== null) {
        const points = JSON.parse(savedLoyaltyPoints);
        setUserData(prevData => ({
          ...prevData,
          loyaltyPoints: points,
          loyaltyTier: getLoyaltyTier(points)
        }));
      } else {
        // Initialize if not exists (same as orders screen)
        await AsyncStorage.setItem('userLoyaltyPoints', JSON.stringify(0));
        setUserData(prevData => ({
          ...prevData,
          loyaltyPoints: 0,
          loyaltyTier: "KBar Member"
        }));
      }
      
      if (savedUserProfile !== null) {
        const profile = JSON.parse(savedUserProfile);
        setUserData(prevData => ({ ...prevData, ...profile }));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
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

 // CORRECTED: Update the loyalty progress calculation to match the corrected tiers
  const getLoyaltyProgress = () => {
    const points = userData.loyaltyPoints;
    
    if (points < 10) return { 
      progress: points, 
      nextTier: "Bronze", 
      pointsNeeded: 10 - points, 
      currentTierRange: 10, 
      currentTier: "KBar Member" 
    };
    if (points < 100) return { 
      progress: points - 10, 
      nextTier: "Silver", 
      pointsNeeded: 100 - points, 
      currentTierRange: 90, 
      currentTier: "Bronze Member" 
    };
    if (points < 250) return { 
      progress: points - 100, 
      nextTier: "Gold", 
      pointsNeeded: 250 - points, 
      currentTierRange: 150, 
      currentTier: "Silver Member" 
    };
    if (points < 500) return { 
      progress: points - 250, 
      nextTier: "Platinum", 
      pointsNeeded: 500 - points, 
      currentTierRange: 250, 
      currentTier: "Gold Member" 
    };
    if (points < 600) return { 
      progress: points - 500, 
      nextTier: "Diamond", 
      pointsNeeded: 600 - points, 
      currentTierRange: 100, 
      currentTier: "Platinum Member" 
    };
    if (points < 1000) return { 
      progress: points - 600, 
      nextTier: "VIP", 
      pointsNeeded: 1000 - points, 
      currentTierRange: 400, 
      currentTier: "Diamond Member" 
    };
    return { 
      progress: 0, 
      nextTier: "Max", 
      pointsNeeded: 0, 
      currentTierRange: 0, 
      currentTier: "VIP Member" 
    };
  };

  const loyaltyProgress = getLoyaltyProgress();

  // Load saved preferences on component mount
  const loadPreferences = async (): Promise<void> => {
    try {
      const savedNotifications = await AsyncStorage.getItem('notificationsEnabled');
      if (savedNotifications !== null) {
        setNotificationsEnabled(JSON.parse(savedNotifications));
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const handleNotificationsChange = async (value: boolean): Promise<void> => {
    setNotificationsEnabled(value);
    try {
      await AsyncStorage.setItem('notificationsEnabled', JSON.stringify(value));
    } catch (error) {
      console.error('Error saving notification preference:', error);
    }
  };

  const handleClearHistory = async (): Promise<void> => {
    Alert.alert(
      "Clear History",
      "Are you sure you want to clear your order history? Your loyalty points will be preserved. This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel" as const
        },
        {
          text: "Clear",
          style: "destructive" as const,
          onPress: async () => {
            try {
              // First, get the current loyalty points before clearing history
              const currentLoyaltyPoints = userData.loyaltyPoints;
              
              // Clear the order history but keep current/pending orders
              const allOrders = await AsyncStorage.getItem('userOrders');
              
              if (allOrders) {
                const orders: Order[] = JSON.parse(allOrders);
                
                // Keep only orders that are not completed (pending payment, processing, preparing, ready)
                const activeOrders = orders.filter(order => 
                  order.status !== 'completed' && order.status !== 'cancelled'
                );
                
                // Save only active orders back to storage
                await AsyncStorage.setItem('userOrders', JSON.stringify(activeOrders));
              }
              
              // Preserve loyalty points by saving them separately
              await AsyncStorage.setItem('userLoyaltyPoints', JSON.stringify(currentLoyaltyPoints));
              
              Alert.alert("Success", "Order history has been cleared. Your loyalty points are preserved.");
              
              // Reload the data to reflect changes
              loadUserData();
            } catch (error) {
              console.error('Error clearing history:', error);
              Alert.alert("Error", "Failed to clear order history.");
            }
          }
        }
      ]
    );
  };

  const handleContactSupport = (): void => {
    Alert.alert("Contact Support", "Email us at: support@kbar.com");
  };

  const handleAbout = (): void => {
    Alert.alert("About KBar", "KBar App v1.0.0\n\nYour favorite drinks at your fingertips!");
  };

  const handleLogout = (): void => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel" as const
        },
        {
          text: "Logout",
          onPress: () => {
            router.replace('/');
          }
        }
      ]
    );
  };

  // Refresh loyalty points when modal is opened
  const handleProfileModalOpen = async (): Promise<void> => {
    await loadUserData(); // Refresh points data
    setProfileModalVisible(true);
  };

  const SettingsItem = ({ 
    icon, 
    title, 
    onPress, 
    isSwitch = false, 
    value = false, 
    onValueChange 
  }: {
    icon: IconName;
    title: string;
    onPress?: () => void;
    isSwitch?: boolean;
    value?: boolean;
    onValueChange?: (value: boolean) => void;
  }) => (
    <TouchableOpacity 
      style={[styles.settingsItem, { borderBottomColor: theme.border }]} 
      onPress={onPress}
      disabled={isSwitch}
    >
      <View style={styles.settingsItemLeft}>
        <MaterialCommunityIcons name={icon} size={24} color={theme.primary} />
        <Text style={[styles.settingsItemText, { color: theme.text }]}>{title}</Text>
      </View>
      
      {isSwitch ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#767577', true: theme.primary }}
          thumbColor={value ? '#f4f3f4' : '#f4f3f4'}
        />
      ) : (
        <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textSecondary} />
      )}
    </TouchableOpacity>
  );

  const SettingsSection = ({ title, children }: { title?: string; children: React.ReactNode }) => (
    <View style={[styles.settingsSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {title && <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{title}</Text>}
      {children}
    </View>
  );

  const LoyaltyCard = () => (
    <TouchableOpacity 
      style={[styles.loyaltyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
      onPress={handleProfileModalOpen}
    >
      <View style={styles.loyaltyCardHeader}>
        <MaterialCommunityIcons name="crown" size={24} color="#FFD700" />
        <Text style={[styles.loyaltyCardTitle, { color: theme.text }]}>Loyalty Program</Text>
      </View>
      
      <View style={styles.loyaltyCardContent}>
        <View style={styles.loyaltyInfo}>
          <Text style={[styles.loyaltyTier, { color: theme.primary }]}>{userData.loyaltyTier}</Text>
          <Text style={[styles.loyaltyPoints, { color: theme.text }]}>{userData.loyaltyPoints} Points</Text>
        </View>
        
        {loyaltyProgress.pointsNeeded > 0 ? (
          <View style={styles.progressContainer}>
            <Text style={[styles.progressText, { color: theme.textSecondary }]}>
              {loyaltyProgress.pointsNeeded} points to {loyaltyProgress.nextTier}
            </Text>
            <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    backgroundColor: theme.primary,
                    width: `${Math.min((loyaltyProgress.progress / loyaltyProgress.currentTierRange) * 100, 100)}%`
                  }
                ]} 
              />
            </View>
          </View>
        ) : (
          <View style={styles.progressContainer}>
            <Text style={[styles.progressText, { color: theme.textSecondary }]}>
              VIP Status Achieved! 🎉
            </Text>
            <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    backgroundColor: theme.primary,
                    width: '100%'
                  }
                ]} 
              />
            </View>
          </View>
        )}
        
        <TouchableOpacity 
          style={[styles.viewDetailsButton, { backgroundColor: theme.primary }]}
          onPress={handleProfileModalOpen}
        >
          <Text style={styles.viewDetailsText}>View Details</Text>
          <MaterialCommunityIcons name="chevron-right" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const ProfileModal = () => {
    const [expandedSections, setExpandedSections] = useState({
      howToEarn: false,
      tierBenefits: false
    });

    const toggleSection = (section: string) => {
      setExpandedSections(prev => ({
        ...prev,
        [section]: !prev[section as keyof typeof prev]
      }));
    };

    // Point earning methods data
    const earningMethods = [
      { method: "Every $1 spent", points: "1 point", icon: "cash" as IconName },
      { method: "Specialty drinks", points: "+5 bonus points", icon: "cupcake" as IconName },
      { method: "Daily check-in", points: "+2 points", icon: "calendar-check" as IconName },
      { method: "Refer a friend", points: "+25 points", icon: "account-plus" as IconName },
      { method: "Birthday month", points: "Double points", icon: "gift" as IconName }
    ];

    // CORRECTED: Tier benefits data - updated to match corrected tier system
    const tierBenefits = [
      {
        tier: "Bronze",
        points: "10-99 points",
        benefits: ["Welcome discount", "Basic rewards access"],
        color: "#CD7F32"
      },
      {
        tier: "Silver",
        points: "100-249 points",
        benefits: ["Free drink customization", "5% off all orders"],
        color: "#C0C0C0"
      },
      {
        tier: "Gold", 
        points: "250-499 points",
        benefits: ["Free medium drink monthly", "Priority ordering", "10% off all orders"],
        color: "#FFD700"
      },
      {
        tier: "Platinum",
        points: "500-599 points", 
        benefits: ["Free large drink weekly", "Exclusive offers", "15% off all orders", "Early access to new drinks"],
        color: "#E5E4E2"
      },
      {
        tier: "Diamond",
        points: "600-999 points",
        benefits: ["Free drink anytime", "Personal barista recognition", "20% off all orders", "VIP event invites"],
        color: "#B9F2FF"
      },
      {
        tier: "VIP",
        points: "1000+ points",
        benefits: ["All Diamond benefits", "Custom drink creations", "25% off all orders", "Executive status"],
        color: "#FF69B4"
      }
    ];

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={profileModalVisible}
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Your Profile</Text>
              <TouchableOpacity 
                onPress={() => setProfileModalVisible(false)}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.profileInfo}>
                <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                  <MaterialCommunityIcons name="account" size={40} color="#fff" />
                </View>
                
                <Text style={[styles.userName, { color: theme.text }]}>{userData.name}</Text>
                <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{userData.email}</Text>
                
                <View style={[styles.loyaltyBadge, { 
                  backgroundColor: isDarkMode ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 215, 0, 0.2)',
                  borderColor: isDarkMode ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 215, 0, 0.4)'
                }]}>
                  <MaterialCommunityIcons name="crown" size={16} color="#FFD700" />
                  <Text style={styles.loyaltyText}>{userData.loyaltyTier}</Text>
                </View>
                
                <View style={[styles.pointsContainer, { 
                  backgroundColor: isDarkMode ? 'rgba(10, 132, 255, 0.1)' : 'rgba(128, 0, 32, 0.1)',
                  borderColor: isDarkMode ? 'rgba(10, 132, 255, 0.3)' : 'rgba(128, 0, 32, 0.3)'
                }]}>
                  <Text style={[styles.pointsLabel, { color: theme.textSecondary }]}>Loyalty Points</Text>
                  <Text style={[styles.pointsValue, { color: theme.primary }]}>{userData.loyaltyPoints}</Text>
                </View>

                {/* Progress section for the profile modal */}
                {loyaltyProgress.pointsNeeded > 0 ? (
                  <View style={styles.modalProgressContainer}>
                    <Text style={[styles.modalProgressText, { color: theme.textSecondary }]}>
                      {loyaltyProgress.pointsNeeded} points needed for {loyaltyProgress.nextTier} Tier
                    </Text>
                    <View style={[styles.modalProgressBar, { backgroundColor: theme.border }]}>
                      <View 
                        style={[
                          styles.modalProgressFill, 
                          { 
                            backgroundColor: theme.primary,
                            width: `${Math.min((loyaltyProgress.progress / loyaltyProgress.currentTierRange) * 100, 100)}%`
                          }
                        ]} 
                      />
                    </View>
                  </View>
                ) : (
                  <View style={styles.modalProgressContainer}>
                    <Text style={[styles.modalProgressText, { color: theme.textSecondary }]}>
                      Maximum tier achieved! 🎉
                    </Text>
                    <View style={[styles.modalProgressBar, { backgroundColor: theme.border }]}>
                      <View 
                        style={[
                          styles.modalProgressFill, 
                          { 
                            backgroundColor: theme.primary,
                            width: '100%'
                          }
                        ]} 
                      />
                    </View>
                  </View>
                )}
              </View>

              {/* How to Earn Points Section */}
              <View style={[styles.expandableSection, { borderColor: theme.border }]}>
                <TouchableOpacity 
                  style={styles.sectionHeader}
                  onPress={() => toggleSection('howToEarn')}
                >
                  <View style={styles.sectionHeaderLeft}>
                    <MaterialCommunityIcons name="trending-up" size={20} color={theme.primary} />
                    <Text style={[styles.sectionTitleText, { color: theme.text }]}>How to Earn Points</Text>
                  </View>
                  <MaterialCommunityIcons 
                    name={expandedSections.howToEarn ? "chevron-up" : "chevron-down"} 
                    size={24} 
                    color={theme.textSecondary} 
                  />
                </TouchableOpacity>
                
                {expandedSections.howToEarn && (
                  <View style={styles.sectionContent}>
                    {earningMethods.map((item, index) => (
                      <View key={index} style={[styles.earningMethod, { 
                        borderBottomColor: theme.border,
                        borderBottomWidth: index === earningMethods.length - 1 ? 0 : 1
                      }]}>
                        <View style={styles.methodLeft}>
                          <MaterialCommunityIcons name={item.icon} size={16} color={theme.primary} />
                          <Text style={[styles.methodText, { color: theme.text }]}>{item.method}</Text>
                        </View>
                        <Text style={[styles.pointsText, { color: theme.primary }]}>{item.points}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Tier Benefits Section */}
              <View style={[styles.expandableSection, { borderColor: theme.border }]}>
                <TouchableOpacity 
                  style={styles.sectionHeader}
                  onPress={() => toggleSection('tierBenefits')}
                >
                  <View style={styles.sectionHeaderLeft}>
                    <MaterialCommunityIcons name="medal" size={20} color={theme.primary} />
                    <Text style={[styles.sectionTitleText, { color: theme.text }]}>Tier Benefits</Text>
                  </View>
                  <MaterialCommunityIcons 
                    name={expandedSections.tierBenefits ? "chevron-up" : "chevron-down"} 
                    size={24} 
                    color={theme.textSecondary} 
                  />
                </TouchableOpacity>
                
                {expandedSections.tierBenefits && (
                  <View style={styles.sectionContent}>
                    {tierBenefits.map((tier, index) => (
                      <View key={index} style={[styles.tierCard, { 
                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                        borderColor: theme.border
                      }]}>
                        <View style={styles.tierHeader}>
                          <View style={styles.tierNameContainer}>
                            <View style={[styles.tierDot, { backgroundColor: tier.color }]} />
                            <Text style={[styles.tierName, { color: theme.text }]}>{tier.tier}</Text>
                          </View>
                          <Text style={[styles.tierPoints, { color: theme.textSecondary }]}>{tier.points}</Text>
                        </View>
                        
                        <View style={styles.benefitsList}>
                          {tier.benefits.map((benefit, benefitIndex) => (
                            <View key={benefitIndex} style={styles.benefitItem}>
                              <MaterialCommunityIcons name="check" size={14} color={theme.primary} />
                              <Text style={[styles.benefitText, { color: theme.text }]}>{benefit}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
              <TouchableOpacity 
                style={[styles.editButton, { backgroundColor: theme.primary }]}
                onPress={() => {
                  setProfileModalVisible(false);
                  Alert.alert("Edit Profile", "Profile editing feature coming soon!");
                }}
              >
                <MaterialCommunityIcons name="pencil" size={16} color="#fff" />
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const styles = createStyles(theme);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Fixed Header */}
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={handleProfileModalOpen}
        >
          <View style={[styles.profileAvatar, { backgroundColor: theme.primary }]}>
            <MaterialCommunityIcons name="account" size={24} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Loyalty Card Section */}
        <LoyaltyCard />

        <SettingsSection title="Preferences">
          <SettingsItem
            icon="bell-outline"
            title="Notifications"
            isSwitch
            value={notificationsEnabled}
            onValueChange={handleNotificationsChange}
          />
          <SettingsItem
            icon={isDarkMode ? "weather-night" : "weather-sunny"}
            title={isDarkMode ? "Dark Mode" : "Light Mode"}
            isSwitch
            value={isDarkMode}
            onValueChange={setDarkMode}
          />
        </SettingsSection>

        <SettingsSection title="Data">
          <SettingsItem
            icon="history"
            title="Clear Order History"
            onPress={handleClearHistory}
          />
        </SettingsSection>

        <SettingsSection title="About">
          <SettingsItem
            icon="help-circle-outline"
            title="About KBar"
            onPress={handleAbout}
          />
          <SettingsItem
            icon="email-outline"
            title="Contact Support"
            onPress={handleContactSupport}
          />
        </SettingsSection>

        <SettingsSection>
          <TouchableOpacity 
            style={[styles.logoutButton, { 
              backgroundColor: isDarkMode ? 'rgba(255, 71, 87, 0.1)' : 'rgba(255, 71, 87, 0.08)' 
            }]} 
            onPress={handleLogout}
          >
            <MaterialCommunityIcons name="logout" size={20} color="#ff4757" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </SettingsSection>

        <Text style={[styles.versionText, { color: theme.textSecondary }]}>KBar App v1.0.0</Text>
      </ScrollView>

      <ProfileModal />
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileButton: {
    padding: 4,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  // Loyalty Card Styles
  loyaltyCard: {
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    padding: 16,
  },
  loyaltyCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  loyaltyCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loyaltyCardContent: {
    gap: 12,
  },
  loyaltyInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loyaltyTier: {
    fontSize: 16,
    fontWeight: '600',
  },
  loyaltyPoints: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    gap: 6,
  },
  progressText: {
    fontSize: 12,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 4,
  },
  viewDetailsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Settings Section Styles
  settingsSection: {
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    padding: 16,
    paddingBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsItemText: {
    fontSize: 16,
    marginLeft: 16,
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    margin: 16,
  },
  logoutButtonText: {
    color: '#ff4757',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 20,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
  },
  loyaltyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  loyaltyText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  pointsContainer: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
  },
  pointsLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  pointsValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalProgressContainer: {
    width: '100%',
    gap: 6,
    marginTop: 8,
  },
  modalProgressText: {
    fontSize: 12,
    textAlign: 'center',
  },
  modalProgressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  modalProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  modalFooter: {
    borderTopWidth: 1,
    paddingTop: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalScrollView: {
    maxHeight: 500,
  },
  expandableSection: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  sectionContent: {
    paddingTop: 8,
  },
  earningMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  methodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodText: {
    fontSize: 14,
    marginLeft: 12,
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tierCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tierNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tierDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  tierName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  tierPoints: {
    fontSize: 12,
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
});