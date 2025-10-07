import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';

// Create a simple event system for real-time updates
let refreshCallbacks: (() => void)[] = [];

export const triggerBadgeRefresh = () => {
  refreshCallbacks.forEach(callback => callback());
};

export const useTabBadges = () => {
  const [cartCount, setCartCount] = useState(0);
  const [unpaidOrdersCount, setUnpaidOrdersCount] = useState(0);

  const refreshBadges = useCallback(async () => {
    try {
      // Refresh cart count
      const cartItems = JSON.parse(await AsyncStorage.getItem('userCart') || '[]');
      const newCartCount = cartItems.reduce((total: number, item: any) => total + item.quantity, 0);
      setCartCount(newCartCount);
      
      // Refresh unpaid orders count
      const storedOrders = await AsyncStorage.getItem('userOrders');
      if (storedOrders) {
        const orders: any[] = JSON.parse(storedOrders);
        const unpaidOrders = orders.filter(order => 
          order.status === 'pending_payment' || 
          order.status === 'payment_processing' ||
          order.status === 'payment_failed'
        );
        setUnpaidOrdersCount(unpaidOrders.length);
      } else {
        setUnpaidOrdersCount(0);
      }
    } catch (error) {
      console.error('Error refreshing badges:', error);
    }
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    const callback = () => refreshBadges();
    refreshCallbacks.push(callback);
    
    return () => {
      refreshCallbacks = refreshCallbacks.filter(cb => cb !== callback);
    };
  }, [refreshBadges]);

  // Also refresh on focus (existing behavior)
  useFocusEffect(useCallback(() => {
    refreshBadges();
  }, [refreshBadges]));

  return { cartCount, unpaidOrdersCount, refreshBadges };
};