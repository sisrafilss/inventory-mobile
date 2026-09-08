import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

// Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { AppTabs } from './AppTabs';
import { ReceiptScreen } from '../screens/pos/ReceiptScreen';
import { ProductDetailScreen } from '../screens/products/ProductDetailScreen';
import { InventoryScreen } from '../screens/inventory/InventoryScreen';
import { PurchasesScreen } from '../screens/purchases/PurchasesScreen';
import { ExpensesScreen } from '../screens/expenses/ExpensesScreen';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0284c7',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: '700',
        },
      }}
    >
      {!user ? (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="Main"
            component={AppTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Receipt"
            component={ReceiptScreen}
            options={{
              title: 'Cash Memo & Receipt',
              headerBackTitle: 'POS',
            }}
          />
          <Stack.Screen
            name="ProductDetail"
            component={ProductDetailScreen}
            options={{
              title: 'Product Details',
            }}
          />
          <Stack.Screen
            name="Inventory"
            component={InventoryScreen}
            options={{
              title: 'Stock Movements',
            }}
          />
          <Stack.Screen
            name="Purchases"
            component={PurchasesScreen}
            options={{
              title: 'Procurement Bills',
            }}
          />
          <Stack.Screen
            name="Expenses"
            component={ExpensesScreen}
            options={{
              title: 'Operating Expenses',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
});

