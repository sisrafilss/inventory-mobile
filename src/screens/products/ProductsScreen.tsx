import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { apiClient } from '../../api/client';
import { Badge } from '../../components/Badge';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';

export const ProductsScreen = () => {
  const navigation = useNavigation<any>();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [search, setSearch] = useState('');
  const [stockStatus, setStockStatus] = useState<string>('ALL');

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Quick Price Edit Modal
  const [editProduct, setEditProduct] = useState<any | null>(null);
  const [newSellingPrice, setNewSellingPrice] = useState('');
  const [savingRate, setSavingRate] = useState(false);

  const fetchProducts = useCallback(
    async (pageToLoad = 1, isRefresh = false) => {
      try {
        const params: any = {
          page: pageToLoad,
          limit: 20,
        };
        if (search.trim()) params.search = search.trim();
        if (selectedCategory) params.categoryId = selectedCategory;
        if (stockStatus !== 'ALL') params.stockStatus = stockStatus;

        const res = await apiClient.get('/products', { params });
        const list = res.data?.data?.products || res.data?.products || res.data?.data || [];
        const meta = res.data?.meta || res.data?.data?.meta;

        if (isRefresh || pageToLoad === 1) {
          setProducts(list);
        } else {
          setProducts((prev) => [...prev, ...list]);
        }

        if (meta) {
          setHasMore(pageToLoad < meta.totalPages);
        } else {
          setHasMore(list.length === 20);
        }
      } catch (e) {
        console.warn('Failed to load products:', e);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [search, selectedCategory, stockStatus]
  );

  useEffect(() => {
    // Fetch categories
    const loadCategories = async () => {
      try {
        const res = await apiClient.get('/categories');
        const list = res.data?.data?.categories || res.data?.categories || res.data?.data || [];
        setCategories(list);
      } catch (e) {
        console.warn('Failed to load categories:', e);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    setPage(1);
    setLoading(true);
    fetchProducts(1, true);
  }, [fetchProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchProducts(1, true);
  };

  const onLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProducts(nextPage, false);
    }
  };

  const handleUpdatePrice = async () => {
    if (!editProduct || !newSellingPrice) return;
    setSavingRate(true);
    try {
      await apiClient.post('/products/sale-rate', {
        productId: editProduct.id,
        newSalePrice: Number(newSellingPrice),
      });

      // Update local state
      setProducts((prev) =>
        prev.map((p) => (p.id === editProduct.id ? { ...p, sellingPrice: Number(newSellingPrice) } : p))
      );
      Alert.alert('Success', 'Selling rate updated successfully');
      setEditProduct(null);
    } catch (e: any) {
      Alert.alert('Update Failed', e.message || 'Could not update rate');
    } finally {
      setSavingRate(false);
    }
  };

  const getStockVariant = (qty: number, reorderLevel = 10) => {
    if (qty <= 0) return { label: 'Out of Stock', variant: 'danger' as const };
    if (qty <= reorderLevel) return { label: 'Low Stock', variant: 'warning' as const };
    return { label: 'In Stock', variant: 'success' as const };
  };

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
          <Input
            placeholder="Search by name, SKU, or barcode..."
            value={search}
            onChangeText={setSearch}
            style={styles.searchInputField}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Stock Filter Pills */}
        <View style={styles.pillRow}>
          {['ALL', 'LOW_STOCK', 'OUT_OF_STOCK', 'IN_STOCK'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.statusPill, stockStatus === status && styles.statusPillActive]}
              onPress={() => setStockStatus(status)}
            >
              <Text
                style={[
                  styles.statusPillText,
                  stockStatus === status && styles.statusPillTextActive,
                ]}
              >
                {status.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Product List */}
      {loading ? (
        <ActivityIndicator size="large" color="#0284c7" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const stockInfo = getStockVariant(item.quantity, item.reorderLevel);
            return (
              <TouchableOpacity
                style={styles.productCard}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('ProductDetail', { product: item })}
              >
                <View style={styles.cardTop}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.productName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.productCode}>
                      SKU: {item.sku || 'N/A'} {item.barcode ? `• Barcode: ${item.barcode}` : ''}
                    </Text>
                  </View>
                  <Badge label={stockInfo.label} variant={stockInfo.variant} />
                </View>

                <View style={styles.cardBottom}>
                  <View>
                    <Text style={styles.priceLabel}>Selling Rate</Text>
                    <Text style={styles.productPrice}>৳{Number(item.sellingPrice || 0).toLocaleString()}</Text>
                  </View>

                  <View style={styles.stockCountBox}>
                    <Text style={styles.stockCountLabel}>Available</Text>
                    <Text style={styles.stockCountNum}>
                      {item.quantity} {item.unit || 'units'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.editPriceBtn}
                    onPress={() => {
                      setEditProduct(item);
                      setNewSellingPrice(String(item.sellingPrice || ''));
                    }}
                  >
                    <Ionicons name="pencil" size={14} color="#0284c7" />
                    <Text style={styles.editPriceText}>Edit Rate</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator size="small" color="#0284c7" style={{ marginVertical: 16 }} />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="file-tray-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptySub}>Try adjusting your search query or filter pills</Text>
            </View>
          }
        />
      )}

      {/* Quick Rate Edit Modal */}
      <Modal
        visible={!!editProduct}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditProduct(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Update Selling Rate</Text>
            <Text style={styles.modalProductName}>{editProduct?.name}</Text>
            <Text style={styles.modalCurrentPrice}>
              Current Price: ৳{Number(editProduct?.sellingPrice || 0).toLocaleString()}
            </Text>

            <Input
              label="New Selling Price (৳)"
              value={newSellingPrice}
              onChangeText={setNewSellingPrice}
              keyboardType="numeric"
              placeholder="0.00"
              autoFocus
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setEditProduct(null)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title="Save Rate"
                variant="primary"
                onPress={handleUpdatePrice}
                loading={savingRate}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  searchHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchInputField: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingVertical: 8,
  },
  pillRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  statusPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
  },
  statusPillActive: {
    backgroundColor: '#0284c7',
  },
  statusPillText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  statusPillTextActive: {
    color: '#ffffff',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 20,
  },
  productCode: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 3,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
    paddingTop: 8,
  },
  priceLabel: {
    fontSize: 11,
    color: '#94a3b8',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0284c7',
  },
  stockCountBox: {
    alignItems: 'center',
  },
  stockCountLabel: {
    fontSize: 11,
    color: '#94a3b8',
  },
  stockCountNum: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  editPriceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  editPriceText: {
    color: '#0284c7',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
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
  emptySub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalProductName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginTop: 4,
  },
  modalCurrentPrice: {
    fontSize: 13,
    color: '#0284c7',
    marginTop: 2,
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 16,
  },
});

