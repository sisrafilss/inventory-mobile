import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';

export const LoginScreen = () => {
  const { login, demoLogin, serverUrl, updateServerUrl } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [customUrl, setCustomUrl] = useState(serverUrl);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter both email and password');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e: any) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setDemoLoading(true);
    try {
      await demoLogin();
    } catch (e: any) {
      setError(e.message || 'Demo login failed');
    } finally {
      setDemoLoading(false);
    }
  };

  const handleSaveServerUrl = async () => {
    try {
      await updateServerUrl(customUrl);
      Alert.alert('Success', 'Backend API URL updated successfully');
      setShowServerConfig(false);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update URL');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header Branding */}
        <View style={styles.brandContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="cube" size={44} color="#0284c7" />
          </View>
          <Text style={styles.brandTitle}>Smart Inventory</Text>
          <Text style={styles.brandSubtitle}>Management & Mobile POS</Text>
        </View>

        {/* Login Form Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>
          <Text style={styles.cardSubtitle}>Enter your credentials to manage inventory</Text>

          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#dc2626" style={{ marginRight: 6 }} />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          <Input
            label="Email Address"
            placeholder="admin@inventory.local"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError(null);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            icon="mail-outline"
          />

          <Input
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError(null);
            }}
            secureTextEntry={!showPassword}
            icon="lock-closed-outline"
            rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
            onRightIconPress={() => setShowPassword(!showPassword)}
          />

          <Button
            title="Log In"
            onPress={handleLogin}
            loading={loading}
            icon="log-in-outline"
            style={styles.submitBtn}
          />

          {/* 1-Tap Demo Login Button */}
          <Button
            title="1-Tap Admin Demo Login"
            variant="success"
            onPress={handleDemoLogin}
            loading={demoLoading}
            icon="flash-outline"
            style={styles.demoBtn}
          />

          {/* Server Config Toggle */}
          <TouchableOpacity
            onPress={() => setShowServerConfig(!showServerConfig)}
            style={styles.serverToggle}
          >
            <Ionicons name="settings-outline" size={16} color="#64748b" style={{ marginRight: 4 }} />
            <Text style={styles.serverToggleText}>
              {showServerConfig ? 'Hide Server Configuration' : 'Configure Backend API IP / URL'}
            </Text>
          </TouchableOpacity>

          {showServerConfig ? (
            <View style={styles.serverConfigBox}>
              <Text style={styles.serverConfigNotice}>
                Tip: When running on a physical Android device, enter your computer's local Wi-Fi IP (e.g. http://192.168.1.10:5000/api).
              </Text>
              <Input
                label="API Base URL"
                value={customUrl}
                onChangeText={setCustomUrl}
                placeholder="http://192.168.1.100:5000/api"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Button
                title="Save & Connect"
                variant="outline"
                size="sm"
                onPress={handleSaveServerUrl}
                style={{ marginTop: 6 }}
              />
            </View>
          ) : null}
        </View>

        <Text style={styles.footerNote}>v1.0.0 • Connected to Inventory System API</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: 48,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#bae6fd',
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.3,
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  errorBannerText: {
    color: '#dc2626',
    fontSize: 13,
    flex: 1,
  },
  submitBtn: {
    marginTop: 12,
  },
  demoBtn: {
    marginTop: 10,
  },
  serverToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 6,
  },
  serverToggleText: {
    fontSize: 13,
    color: '#64748b',
    textDecorationLine: 'underline',
  },
  serverConfigBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  serverConfigNotice: {
    fontSize: 11,
    color: '#475569',
    marginBottom: 6,
    lineHeight: 16,
  },
  footerNote: {
    textAlign: 'center',
    marginTop: 24,
    fontSize: 12,
    color: '#94a3b8',
  },
});

