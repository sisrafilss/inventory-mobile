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
  Linking,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../api/client';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';

export const PartiesScreen = () => {
  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers'>('customers');
  const [parties, setParties] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [duesSummary, setDuesSummary] = useState<any>(null);

  // Settle Due Modal
  const [selectedParty, setSelectedParty] = useState<any | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'CASH' | 'BKASH' | 'NAGAD' | 'BANK'>('CASH');
  const [payNote, setPayNote] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  // Add New Party Modal
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [savingParty, setSavingParty] = useState(false);

  const fetchParties = useCallback(async () => {
    try {
      const endpoint = activeTab === 'customers' ? '/parties/customers' : '/parties/suppliers';
      const [partiesRes, summaryRes] = await Promise.all([
        apiClient.get(endpoint, { params: { search: search.trim() || undefined, limit: 50 } }),
        apiClient.get('/parties/summary').catch(() => ({ data: null })),
      ]);

      const list =
        partiesRes.data?.data?.parties ||
        partiesRes.data?.data ||
        partiesRes.data?.parties ||
        [];
      setParties(list);

      if (summaryRes?.data?.data) {
        setDuesSummary(summaryRes.data.data);
      }
    } catch (e) {
      console.warn('Failed to load parties:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    setLoading(true);
    fetchParties();
  }, [fetchParties]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchParties();
  };

  const handleCall = (phone: string) => {
    if (!phone) {
      Alert.alert('No Phone', 'This party has no phone number recorded.');
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  const handleProcessPayment = async () => {
    if (!selectedParty || !payAmount) return;
    const amountNum = Number(payAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid positive payment amount.');
      return;
    }

    setProcessingPayment(true);
    try {
      if (activeTab === 'customers') {
        // Collect from customer
        await apiClient.post('/payments/collect', {
          customerId: selectedParty.id,
          amount: amountNum,
          paymentMethod: payMethod,
          referenceNote: payNote || undefined,
        });
        Alert.alert('Success', `Collected ৳${amountNum.toLocaleString()} from ${selectedParty.name}`);
      } else {
        // Pay to supplier
        await apiClient.post('/payments/pay', {
          supplierId: selectedParty.id,
          amount: amountNum,
          paymentMethod: payMethod,
          referenceNote: payNote || undefined,
        });
        Alert.alert('Success', `Paid ৳${amountNum.toLocaleString()} to ${selectedParty.name}`);
      }

      setSelectedParty(null);
      setPayAmount('');
      setPayNote('');
      fetchParties();
    } catch (e: any) {
      Alert.alert('Payment Failed', e.message || 'Could not process transaction');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleCreateParty = async () => {
    if (!newName.trim() || !newPhone.trim()) {
      Alert.alert('Required Fields', 'Name and Phone number are required.');
      return;
    }

    setSavingParty(true);
    try {
      if (activeTab === 'customers') {
        await apiClient.post('/parties/customers', {
          name: newName.trim(),
          phone: newPhone.trim(),
          email: newEmail.trim() || undefined,
          address: newAddress.trim() || undefined,
        });
      } else {
        await apiClient.post('/parties/suppliers', {
          name: newName.trim(),
          phone: newPhone.trim(),
          email: newEmail.trim() || undefined,
          address: newAddress.trim() || undefined,
          companyName: newCompany.trim() || undefined,
        });
      }

      Alert.alert('Success', `${activeTab === 'customers' ? 'Customer' : 'Supplier'} registered successfully`);
      setAddModalVisible(false);
      setNewName('');
      setNewPhone('');
      setNewEmail('');
      setNewAddress('');
      setNewCompany('');
      fetchParties();
    } catch (e: any) {
      Alert.alert('Failed to Add', e.message || 'Could not register party');
    } finally {
      setSavingParty(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Dues KPI Header */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Customer Receivable</Text>
          <Text style={[styles.summaryVal, { color: '#0284c7' }]}>
            ৳{Number(duesSummary?.totalCustomerDue || duesSummary?.customerReceivables || 0).toLocaleString()}
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Supplier Payable</Text>
          <Text style={[styles.summaryVal, { color: '#ef4444' }]}>
            ৳{Number(duesSummary?.totalSupplierDue || duesSummary?.supplierPayables || 0).toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Segmented Control */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'customers' && styles.tabBtnActive]}
          onPress={() => setActiveTab('customers')}
        >
          <Ionicons
            name="people"
            size={18}
            color={activeTab === 'customers' ? '#0284c7' : '#64748b'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabText, activeTab === 'customers' && styles.tabTextActive]}>
            Customers
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'suppliers' && styles.tabBtnActive]}
          onPress={() => setActiveTab('suppliers')}
        >
          <Ionicons
            name="business"
            size={18}
            color={activeTab === 'suppliers' ? '#0284c7' : '#64748b'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.tabText, activeTab === 'suppliers' && styles.tabTextActive]}>
            Suppliers
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search & Add Row */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
          <Input
            placeholder={`Search ${activeTab} by name or phone...`}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setAddModalVisible(true)}
        >
          <Ionicons name="person-add" size={18} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Party List */}
      {loading ? (
        <ActivityIndicator size="large" color="#0284c7" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={parties}
          keyExtractor={(item) => item.id}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const due = Number(item.currentDue || item.dueAmount || 0);
            return (
              <View style={styles.partyCard}>
                <View style={styles.partyTopRow}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.partyName}>{item.name}</Text>
                    {item.companyName ? (
                      <Text style={styles.partyCompany}>{item.companyName}</Text>
                    ) : null}
                    <Text style={styles.partyPhone}>{item.phone || 'No phone'}</Text>
                    {item.address ? (
                      <Text style={styles.partyAddress} numberOfLines={1}>
                        {item.address}
                      </Text>
                    ) : null}
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.dueLabel}>Outstanding Due</Text>
                    <Text style={[styles.dueAmount, due > 0 ? { color: '#dc2626' } : { color: '#10b981' }]}>
                      ৳{due.toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* Actions: Call & Collect/Pay */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.callBtn}
                    onPress={() => handleCall(item.phone)}
                  >
                    <Ionicons name="call" size={16} color="#0284c7" />
                    <Text style={styles.callBtnText}>Call</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.settleBtn,
                      activeTab === 'customers' ? styles.collectBtn : styles.paySupplierBtn,
                    ]}
                    onPress={() => {
                      setSelectedParty(item);
                      setPayAmount(due > 0 ? String(due) : '');
                    }}
                  >
                    <Ionicons
                      name="cash-outline"
                      size={16}
                      color="#ffffff"
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.settleBtnText}>
                      {activeTab === 'customers' ? 'Collect Due' : 'Pay Due'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No {activeTab} found</Text>
              <Text style={styles.emptySub}>Tap the (+) button above to register a new one</Text>
            </View>
          }
        />
      )}

      {/* Settle Due Modal */}
      <Modal
        visible={!!selectedParty}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedParty(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activeTab === 'customers' ? 'Collect Customer Due' : 'Pay Supplier Due'}
              </Text>
              <TouchableOpacity onPress={() => setSelectedParty(null)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalPartyName}>{selectedParty?.name}</Text>
            <Text style={styles.modalCurrentDue}>
              Current Due Balance: ৳
              {Number(selectedParty?.currentDue || selectedParty?.dueAmount || 0).toLocaleString()}
            </Text>

            <Input
              label="Transaction Amount (৳)"
              value={payAmount}
              onChangeText={setPayAmount}
              keyboardType="numeric"
              placeholder="0.00"
            />

            {/* Payment Method Pills */}
            <Text style={styles.methodLabel}>Payment Method</Text>
            <View style={styles.methodRow}>
              {(['CASH', 'BKASH', 'NAGAD', 'BANK'] as const).map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[styles.methodPill, payMethod === method && styles.methodPillActive]}
                  onPress={() => setPayMethod(method)}
                >
                  <Text
                    style={[styles.methodText, payMethod === method && styles.methodTextActive]}
                  >
                    {method}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="Reference / Receipt Note (Optional)"
              value={payNote}
              onChangeText={setPayNote}
              placeholder="e.g. Bank slip or memo note"
            />

            <Button
              title={
                activeTab === 'customers'
                  ? 'Confirm Due Collection'
                  : 'Confirm Supplier Payment'
              }
              onPress={handleProcessPayment}
              loading={processingPayment}
              icon="checkmark-circle-outline"
              size="lg"
              style={{ marginTop: 14 }}
            />
          </View>
        </View>
      </Modal>

      {/* Add Party Modal */}
      <Modal
        visible={addModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Add New {activeTab === 'customers' ? 'Customer' : 'Supplier'}
              </Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Input
                label="Full Name *"
                value={newName}
                onChangeText={setNewName}
                placeholder="e.g. Rahim Chowdhury"
              />

              <Input
                label="Phone Number *"
                value={newPhone}
                onChangeText={setNewPhone}
                keyboardType="phone-pad"
                placeholder="017xxxxxxxx"
              />

              {activeTab === 'suppliers' ? (
                <Input
                  label="Company / Enterprise Name"
                  value={newCompany}
                  onChangeText={setNewCompany}
                  placeholder="e.g. Acme Agro Ltd"
                />
              ) : null}

              <Input
                label="Email (Optional)"
                value={newEmail}
                onChangeText={setNewEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="rahim@example.com"
              />

              <Input
                label="Address"
                value={newAddress}
                onChangeText={setNewAddress}
                placeholder="Shop #4, Market Square, Dhaka"
              />

              <Button
                title={`Register ${activeTab === 'customers' ? 'Customer' : 'Supplier'}`}
                onPress={handleCreateParty}
                loading={savingParty}
                icon="person-add-outline"
                size="lg"
                style={{ marginTop: 16, marginBottom: 10 }}
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
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  summaryVal: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#e2e8f0',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  tabBtnActive: {
    backgroundColor: '#f0f9ff',
    borderBottomWidth: 2,
    borderBottomColor: '#0284c7',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#0284c7',
    fontWeight: '700',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingVertical: 8,
  },
  addBtn: {
    backgroundColor: '#0284c7',
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  partyCard: {
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
  partyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  partyName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  partyCompany: {
    fontSize: 12,
    color: '#0284c7',
    fontWeight: '600',
    marginTop: 2,
  },
  partyPhone: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  partyAddress: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  dueLabel: {
    fontSize: 11,
    color: '#94a3b8',
  },
  dueAmount: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
    marginTop: 10,
    paddingTop: 8,
    gap: 8,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  callBtnText: {
    color: '#0284c7',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  settleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  collectBtn: {
    backgroundColor: '#10b981',
  },
  paySupplierBtn: {
    backgroundColor: '#f59e0b',
  },
  settleBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
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
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalPartyName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0284c7',
    marginTop: 4,
  },
  modalCurrentDue: {
    fontSize: 13,
    color: '#dc2626',
    fontWeight: '600',
    marginBottom: 12,
  },
  methodLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  methodRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  methodPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
  },
  methodPillActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  methodText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  methodTextActive: {
    color: '#ffffff',
  },
});

