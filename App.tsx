import 'react-native-gesture-handler';
import React, { Component } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text } from 'react-native';
import { Colors } from './src/constants';
import { RootNavigator } from './src/navigation/RootNavigator';

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error: error?.message ?? 'Unknown error' };
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ color: Colors.textPrimary, fontSize: 18, fontWeight: '600', marginBottom: 12 }}>Something went wrong</Text>
          <Text style={{ color: Colors.textSecondary, fontSize: 13, textAlign: 'center' }}>{this.state.error}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={styles.root}>
        <View style={styles.bg}>
          <SafeAreaProvider>
            <StatusBar style="light" backgroundColor={Colors.background} translucent={false} />
            <RootNavigator />
          </SafeAreaProvider>
        </View>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bg: { flex: 1, backgroundColor: Colors.background },
});
