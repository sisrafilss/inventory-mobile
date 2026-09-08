import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

// Screen imports
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { POSScreen } from '../screens/pos/POSScreen';
import { ProductsScreen } from '../screens/products/ProductsScreen';
import { PartiesScreen } from '../screens/parties/PartiesScreen';
import { BalanceSheetScreen } from '../screens/reports/BalanceSheetScreen';
import { MoreMenuScreen } from '../screens/more/MoreMenuScreen';

const Tab = createBottomTabNavigator();

export const AppTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: {
          backgroundColor: '#0284c7',
          elevation: 4,
          shadowOpacity: 0.15,
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
        tabBarActiveTintColor: '#0284c7',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'grid' : 'grid-outline';
              break;
            case 'POS':
              iconName = focused ? 'barcode' : 'barcode-outline';
              break;
            case 'Products':
              iconName = focused ? 'cube' : 'cube-outline';
              break;
            case 'Parties':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'BalanceSheet':
              iconName = focused ? 'receipt' : 'receipt-outline';
              break;
            case 'More':
              iconName = focused ? 'menu' : 'menu-outline';
              break;
            default:
              iconName = 'ellipse-outline';
          }

          return <Ionicons name={iconName} size={size || 22} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="POS"
        component={POSScreen}
        options={{ title: 'Barcode POS' }}
      />
      <Tab.Screen
        name="Products"
        component={ProductsScreen}
        options={{ title: 'Products' }}
      />
      <Tab.Screen
        name="Parties"
        component={PartiesScreen}
        options={{ title: 'Parties & Dues' }}
      />
      <Tab.Screen
        name="BalanceSheet"
        component={BalanceSheetScreen}
        options={{ title: 'Balance Sheet' }}
      />
      <Tab.Screen
        name="More"
        component={MoreMenuScreen}
        options={{ title: 'More' }}
      />
    </Tab.Navigator>
  );
};

