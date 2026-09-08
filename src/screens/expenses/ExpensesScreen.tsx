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
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../api/client';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';

const EXPENSE_CATEGORIES = [
  'RENT',
  'ELECTRICITY',
  'SALARY',
  'TRANSPORT',
  'TEA_SNACKS',
  'MAINTENANCE',
  'MARKETING',
  'OTHER',
];

export const ExpensesScreen = () => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add Expense Modal
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('TEA_SNACKS');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchExpenses = useCallback(async () => {
    try {
      const params: any = { limit: 50 };
      if (selectedCategory !== 'ALL') {
        params.category = selectedCategory;
      }
      const res = await apiClient.get('/expenses', { params });
      const list = res.data?.data?.expenses || res.data?.data || res.data?.expenses || [];
      setExpenses(list);
    } catch (e) {
      console.warn('Failed to load expenses:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    setLoading(true);
    fetchExpenses();
  }, [fetchExpenses]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchExpenses();
  };

  const handleCreateExpense = async () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter an expense purpose or title.');
      return;
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid expense cost.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post('/expenses', {
        title: title.trim(),
        category,
        amount: numAmount,
        note: note.trim() || undefined,
        date: new Date().toISOString(),
      });

      Alert.alert('Success', 'Expense entry recorded successfully');
      setAddModalVisible(false);
      setTitle('');
      setAmount('');
      setNote('');
      fetchExpenses();
    } catch (e: any) {
      Alert.alert('Failed to Save', e.message || 'Could not record expense');
    } finally {
      setSubmitting(false);
    }
  };

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return (
    <View style={styles.container}>
      {/* Top Banner */}
      <View style={styles.headerBanner}>
        <View>
          <Text style={styles.bannerLabel}>Total Expenses Logged</Text>
          <Text style={styles.bannerAmount}>৳{totalExpenseAmount.toLocaleString()}</Text>
        </View>
        <TouchableOpacity
          style={styles.addExpenseBtn}
          onPress={() => setAddModalVisible(true)}
        >
          <Ionicons name="add-circle" size={18} color="#ffffff" style={{ marginRight: 4 }} />
          <Text style={styles.addExpenseBtnText}>Add Expense</Text>
        </TouchableOpacity>
      </View>

      {/* Category Pills Filter */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.catPill, selectedCategory === 'ALL' && styles.catPillActive]}
            onPress={() => setSelectedCategory('ALL')}
          >
            <Text style={[styles.catPillText, selectedCategory === 'ALL' && styles.catPillTextActive]}>
              All Categories
            </Text>
          </TouchableOpacity>
          {EXPENSE_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catPill, selectedCategory === cat && styles.catPillActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.catPillText, selectedCategory === cat && styles.catPillTextActive]}>
                {cat.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Expense List */}
      {loading ? (
        <ActivityIndicator size="large" color="#0284c7" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <Card style={styles.expenseCard}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.expenseTitle}>{item.title}</Text>
                  <Text style={styles.expenseDate}>
                    {new Date(item.date || item.createdAt).toLocaleDateString()} •{' '}
                    {new Date(item.date || item.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  {item.note ? <Text style={styles.expenseNote}>{item.note}</Text> : null}
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.amountValue}>৳{Number(item.amount || 0).toLocaleString()}</Text>
                  <Badge
                    label={(item.category || 'OTHER').replace('_', ' ')}
                    variant="neutral"
                  />
                </View>
              </View>
            </Card>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No expense records found</Text>
              <Text style={styles.emptySub}>Tap the (+ Add Expense) button to log shop expenditures</Text>
            </View>
          }
        />
      )}

      {/* Add Expense Modal */}
      <Modal
        visible={addModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Daily Expense</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Input
                label="Expense Title / Description *"
                placeholder="e.g. Office electricity bill, Tea & breakfast"
                value={title}
                onChangeText={setTitle}
              />

              <Input
                label="Amount (৳) *"
                placeholder="0.00"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryGrid}>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.modalCatPill, category === cat && styles.modalCatPillActive]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.modalCatText,
                        category === cat && styles.modalCatTextActive,
                      ]}
                    >
                      {cat.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Input
                label="Notes (Optional)"
                placeholder="Voucher or recipient details..."
                value={note}
                onChangeText={setNote}
              />

              <Button
                title="Save Expense"
                onPress={handleCreateExpense}
                loading={submitting}
                icon="checkmark-circle-outline"
                size="lg"
                style={{ marginTop: 14, marginBottom: 10 }}
              />
            </ScrollView>
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
  bannerLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  bannerAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ef4444',
    marginTop: 2,
  },
  addExpenseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addExpenseBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  filterBar: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  catPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
  },
  catPillActive: {
    backgroundColor: '#0284c7',
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  catPillTextActive: {
    color: '#ffffff',
  },
  listContainer: {
    paddingVertical: 10,
    paddingBottom: 30,
  },
  expenseCard: {
    padding: 14,
    marginVertical: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  expenseTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  expenseDate: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  expenseNote: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
    fontStyle: 'italic',
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ef4444',
    marginBottom: 4,
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
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  modalCatPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalCatPillActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  modalCatText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  modalCatTextActive: {
    color: '#ffffff',
  },
});

