import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../api/client';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Input } from '../../components/Input';

export const PurchasesScreen = () => {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPurchases = useCallback(async () => {
    try {
      const res = await apiClient.get('/purchases', {
        params: { search: search.trim() || undefined, limit: 30 },
      });
      const list = res.data?.data?.purchases || res.data?.data || res.data?.purchases || [];
      setPurchases(list);
    } catch (e) {
      console.warn('Failed to load purchases:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    setLoading(true);
    fetchPurchases();
  }, [fetchPurchases]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPurchases();
  };

  const totalProcurement = purchases.reduce(
    (sum, p) => sum + Number(p.totalAmount || 0),
    0
  );

  return (
    <View style={styles.container}>
      {/* Header Banner */}
      <View style={styles.headerBanner}>
        <View>
          <Text style={styles.headerLabel}>Total Invoices Shown</Text>
          <Text style={styles.headerTotal}>৳{totalProcurement.toLocaleString()}</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{purchases.length} Bills</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Search by invoice number or supplier..."
          value={search}
          onChangeText={setSearch}
          icon="search"
        />
      </View>

      {/* Purchases List */}
      {loading ? (
        <ActivityIndicator size="large" color="#0284c7" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={purchases}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const due = Number(item.dueAmount || 0);
            return (
              <Card style={styles.purchaseCard}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.invoiceNo}>
                      {item.invoiceNumber || item.billNo || 'BILL-000'}
                    </Text>
                    <Text style={styles.supplierName}>
                      {item.supplier?.name || item.supplierName || 'Unknown Supplier'}
                    </Text>
                  </View>
                  <Badge
                    label={due > 0 ? 'Due Pending' : 'Paid in Full'}
                    variant={due > 0 ? 'warning' : 'success'}
                  />
                </View>

                <View style={styles.divider} />

                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.dateText}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                    {item.note ? (
                      <Text style={styles.noteText} numberOfLines={1}>
                        Note: {item.note}
                      </Text>
                    ) : null}
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.amountLabel}>Bill Amount</Text>
                    <Text style={styles.amountValue}>
                      ৳{Number(item.totalAmount || 0).toLocaleString()}
                    </Text>
                    {due > 0 ? (
                      <Text style={styles.dueSub}>Due: ৳{due.toLocaleString()}</Text>
                    ) : null}
                  </View>
                </View>
              </Card>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No purchase bills found</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerBanner: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  headerTotal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  countBadgeText: {
    color: '#0284c7',
    fontSize: 12,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: '#ffffff',
  },
  listContainer: {
    paddingVertical: 10,
    paddingBottom: 30,
  },
  purchaseCard: {
    padding: 14,
    marginVertical: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  invoiceNo: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  supplierName: {
    fontSize: 13,
    color: '#0284c7',
    fontWeight: '600',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  noteText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    maxWidth: 180,
  },
  amountLabel: {
    fontSize: 11,
    color: '#94a3b8',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  dueSub: {
    fontSize: 12,
    fontWeight: '700',
    color: '#dc2626',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 10,
  },
});

