import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Badge } from '../../components/Badge';

export const MoreMenuScreen = () => {
  const { user, logout, serverUrl, updateServerUrl } = useAuth();

  // Server URL Edit Modal
  const [serverModalVisible, setServerModalVisible] = useState(false);
  const [newUrl, setNewUrl] = useState(serverUrl);

  // Change Password Modal
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const handleSaveServerUrl = async () => {
    try {
      await updateServerUrl(newUrl);
      Alert.alert('Success', 'API Base URL updated successfully');
      setServerModalVisible(false);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not update API URL');
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Required', 'Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Weak Password', 'New password must be at least 6 characters long.');
      return;
    }

    setSavingPassword(true);
    try {
      await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      Alert.alert('Success', 'Password changed successfully');
      setPasswordModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      Alert.alert('Failed', e.message || 'Could not update password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Profile Card */}
      <Card style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
          </Text>
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.profileName}>{user?.name || 'Administrator'}</Text>
          <Text style={styles.profileEmail}>{user?.email || 'admin@inventory.local'}</Text>
          <View style={{ marginTop: 6 }}>
            <Badge label={user?.role?.toUpperCase() || 'SUPER ADMIN'} variant="info" />
          </View>
        </View>
      </Card>

      {/* Settings Section */}
      <Text style={styles.sectionHeader}>System & Preferences</Text>

      <Card style={styles.menuCard}>
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => setServerModalVisible(true)}
        >
          <View style={[styles.menuIconBox, { backgroundColor: '#f0f9ff' }]}>
            <Ionicons name="server-outline" size={20} color="#0284c7" />
          </View>
          <View style={styles.menuTextCol}>
            <Text style={styles.menuTitle}>API Server URL</Text>
            <Text style={styles.menuSub} numberOfLines={1}>
              {serverUrl || 'Default'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => setPasswordModalVisible(true)}
        >
          <View style={[styles.menuIconBox, { backgroundColor: '#f0fdf4' }]}>
            <Ionicons name="key-outline" size={20} color="#10b981" />
          </View>
          <View style={styles.menuTextCol}>
            <Text style={styles.menuTitle}>Change Password</Text>
            <Text style={styles.menuSub}>Update your account security</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </TouchableOpacity>
      </Card>

      {/* App Info Card */}
      <Text style={styles.sectionHeader}>App Information</Text>
      <Card style={styles.menuCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>App Version</Text>
          <Text style={styles.infoVal}>1.0.0 (Expo SDK 52)</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Database Mode</Text>
          <Text style={styles.infoVal}>PostgreSQL via Prisma ORM</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Scanner Support</Text>
          <Text style={styles.infoVal}>Camera EAN/UPC + Hardware</Text>
        </View>
      </Card>

      {/* Logout Button */}
      <View style={styles.logoutContainer}>
        <Button
          title="Sign Out"
          variant="danger"
          onPress={handleLogout}
          icon="log-out-outline"
          size="lg"
        />
      </View>

      {/* Server URL Config Modal */}
      <Modal
        visible={serverModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setServerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Backend API Endpoint</Text>
              <TouchableOpacity onPress={() => setServerModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalNotice}>
              Enter the IP address of the machine running the backend server.
              {'\n'}• Android Emulator: http://10.0.2.2:5000/api
              {'\n'}• Physical Device (WiFi): http://192.168.x.x:5000/api
            </Text>

            <Input
              label="API Base URL"
              value={newUrl}
              onChangeText={setNewUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalActionRow}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setServerModalVisible(false)}
                style={{ flex: 1, marginRight: 8 }}
              />
              <Button
                title="Save & Connect"
                onPress={handleSaveServerUrl}
                style={{ flex: 1, marginLeft: 8 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={passwordModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Account Password</Text>
              <TouchableOpacity onPress={() => setPasswordModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Input
              label="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              placeholder="••••••••"
            />

            <Input
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholder="••••••••"
            />

            <Input
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder="••••••••"
            />

            <Button
              title="Update Password"
              onPress={handleChangePassword}
              loading={savingPassword}
              icon="checkmark-circle-outline"
              size="lg"
              style={{ marginTop: 14 }}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingVertical: 14,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  profileEmail: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: 20,
    marginTop: 18,
    marginBottom: 6,
  },
  menuCard: {
    padding: 6,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextCol: {
    flex: 1,
    marginLeft: 12,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  menuSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
  },
  logoutContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalNotice: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    backgroundColor: '#f1f5f9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  modalActionRow: {
    flexDirection: 'row',
    marginTop: 14,
  },
});

