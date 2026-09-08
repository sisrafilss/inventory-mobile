import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';

export const DashboardScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await apiClient.get('/dashboard/summary');
      setDashboardData(res.data?.data || res.data);
    } catch (e) {
      console.warn('Failed to load dashboard:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  const stats = dashboardData?.stats || {
    todaySalesAmount: '0.00',
    todaySalesCount: 0,
    monthSalesAmount: '0.00',
    productsCount: 0,
    lowStockCount: 0,
    inventoryQuantity: 0,
  };

  const recentSales = dashboardData?.recentSales || [];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0284c7']} />}
    >
      {/* Top Banner */}
      <View style={styles.headerBanner}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.name || 'Administrator'}</Text>
          <Text style={styles.userRole}>{user?.role?.toUpperCase() || 'SUPER ADMIN'}</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('POS')}
          style={styles.headerPosBtn}
          activeOpacity={0.8}
        >
          <Ionicons name="barcode-outline" size={20} color="#0284c7" />
          <Text style={styles.headerPosBtnText}>POS</Text>
        </TouchableOpacity>
      </View>

      {/* KPI Cards Grid */}
      <View style={styles.kpiGrid}>
        {/* Today's Sales */}
        <View style={[styles.kpiCard, { backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }]}>
          <View style={styles.kpiHeader}>
            <Text style={styles.kpiLabel}>Today's Sales</Text>
            <View style={[styles.kpiIconBox, { backgroundColor: '#0284c7' }]}>
              <Ionicons name="cash-outline" size={18} color="#ffffff" />
            </View>
          </View>
          <Text style={styles.kpiValue}>৳{Number(stats.todaySalesAmount || 0).toLocaleString()}</Text>
          <Text style={styles.kpiSub}>{stats.todaySalesCount || 0} completed orders</Text>
        </View>

        {/* Monthly Sales */}
        <View style={[styles.kpiCard, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
          <View style={styles.kpiHeader}>
            <Text style={styles.kpiLabel}>This Month</Text>
            <View style={[styles.kpiIconBox, { backgroundColor: '#10b981' }]}>
              <Ionicons name="trending-up-outline" size={18} color="#ffffff" />
            </View>
          </View>
          <Text style={styles.kpiValue}>৳{Number(stats.monthSalesAmount || 0).toLocaleString()}</Text>
          <Text style={styles.kpiSub}>Gross revenue</Text>
        </View>

        {/* Total Stock */}
        <View style={[styles.kpiCard, { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }]}>
          <View style={styles.kpiHeader}>
            <Text style={styles.kpiLabel}>Total Products</Text>
            <View style={[styles.kpiIconBox, { backgroundColor: '#64748b' }]}>
              <Ionicons name="cube-outline" size={18} color="#ffffff" />
            </View>
          </View>
          <Text style={styles.kpiValue}>{stats.productsCount || 0}</Text>
          <Text style={styles.kpiSub}>{stats.inventoryQuantity || 0} units in warehouse</Text>
        </View>

        {/* Low Stock Alert */}
        <View
          style={[
            styles.kpiCard,
            {
              backgroundColor: stats.lowStockCount > 0 ? '#fff1f2' : '#f8fafc',
              borderColor: stats.lowStockCount > 0 ? '#fecdd3' : '#e2e8f0',
            },
          ]}
        >
          <View style={styles.kpiHeader}>
            <Text style={styles.kpiLabel}>Low Stock Alert</Text>
            <View
              style={[
                styles.kpiIconBox,
                { backgroundColor: stats.lowStockCount > 0 ? '#ef4444' : '#94a3b8' },
              ]}
            >
              <Ionicons name="warning-outline" size={18} color="#ffffff" />
            </View>
          </View>
          <Text
            style={[
              styles.kpiValue,
              stats.lowStockCount > 0 ? { color: '#dc2626' } : undefined,
            ]}
          >
            {stats.lowStockCount || 0}
          </Text>
          <Text style={styles.kpiSub}>Items need reorder</Text>
        </View>
      </View>

      {/* Quick Launch Buttons */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick Shortcuts</Text>
      </View>
      <View style={styles.quickLaunchRow}>
        <TouchableOpacity
          style={styles.quickLaunchBtn}
          onPress={() => navigation.navigate('POS')}
        >
          <View style={[styles.quickLaunchIcon, { backgroundColor: '#38bdf8' }]}>
            <Ionicons name="barcode" size={24} color="#ffffff" />
          </View>
          <Text style={styles.quickLaunchText}>New Sale (POS)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickLaunchBtn}
          onPress={() => navigation.navigate('Products')}
        >
          <View style={[styles.quickLaunchIcon, { backgroundColor: '#34d399' }]}>
            <Ionicons name="list" size={24} color="#ffffff" />
          </View>
          <Text style={styles.quickLaunchText}>Products</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickLaunchBtn}
          onPress={() => navigation.navigate('Parties')}
        >
          <View style={[styles.quickLaunchIcon, { backgroundColor: '#f59e0b' }]}>
            <Ionicons name="people" size={24} color="#ffffff" />
          </View>
          <Text style={styles.quickLaunchText}>Parties (Dues)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickLaunchBtn}
          onPress={() => navigation.navigate('BalanceSheet')}
        >
          <View style={[styles.quickLaunchIcon, { backgroundColor: '#818cf8' }]}>
            <Ionicons name="receipt" size={24} color="#ffffff" />
          </View>
          <Text style={styles.quickLaunchText}>Balance Sheet</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Sales Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Invoices</Text>
        <TouchableOpacity onPress={() => navigation.navigate('POS')}>
          <Text style={styles.seeAllText}>Sell Item +</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color="#0284c7" style={{ marginVertical: 20 }} />
      ) : recentSales.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="receipt-outline" size={36} color="#94a3b8" />
          <Text style={styles.emptyText}>No sales recorded yet</Text>
        </Card>
      ) : (
        recentSales.map((sale: any) => (
          <Card key={sale.id} style={styles.saleItemCard}>
            <View style={styles.saleItemRow}>
              <View>
                <Text style={styles.invoiceNo}>{sale.invoiceNo || 'INV-TEMP'}</Text>
                <Text style={styles.saleDate}>
                  {new Date(sale.createdAt).toLocaleDateString()} •{' '}
                  {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.saleAmount}>৳{Number(sale.totalAmount || 0).toLocaleString()}</Text>
                <Badge
                  label={sale.status?.toLowerCase() || 'completed'}
                  variant={sale.status?.toLowerCase() === 'completed' ? 'success' : 'warning'}
                />
              </View>
            </View>
          </Card>
        ))
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerBanner: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    color: '#bae6fd',
    fontSize: 13,
  },
  userName: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  userRole: {
    color: '#e0f2fe',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  headerPosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    elevation: 2,
  },
  headerPosBtnText: {
    color: '#0284c7',
    fontWeight: '700',
    marginLeft: 6,
    fontSize: 13,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    marginTop: -10,
  },
  kpiCard: {
    width: '46%',
    marginHorizontal: '2%',
    marginBottom: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  kpiIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  kpiSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284c7',
  },
  quickLaunchRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  quickLaunchBtn: {
    alignItems: 'center',
    width: 80,
  },
  quickLaunchIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    elevation: 2,
  },
  quickLaunchText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  saleItemCard: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  saleItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceNo: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  saleDate: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  saleAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0284c7',
    marginBottom: 2,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    color: '#94a3b8',
    marginTop: 8,
    fontSize: 13,
  },
});

