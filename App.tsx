import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { initDB } from './database/db';

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initDB()
      .then(() => {
        console.log('Database initialized ✅');
        setDbReady(true);
      })
      .catch((err) => {
        console.error('DB init error:', err);
        setError(err.toString());
      });
  }, []);

  // ❌ Error state
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: 'red' }}>DB Error: {error}</Text>
      </View>
    );
  }

  // ⏳ Loading state
  if (!dbReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text>Initializing database...</Text>
      </View>
    );
  }

  // ✅ App ready
  return (
    <SafeAreaProvider>
      <View style={styles.center}>
        <Text style={styles.title}>🛒 MyGroceryListTracker</Text>
        <Text style={styles.sub}>Database ready ✅</Text>
        <StatusBar style="auto" />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  sub: {
    fontSize: 14,
    color: '#555',
  },
});