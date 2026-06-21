import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { RootNavigator } from './src/navigation/RootNavigator';
import { Colors, FontSize, FontWeight } from './src/constants';

interface ErrorBoundaryState { hasError: boolean; error?: string; }

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error: error?.message ?? 'Unknown error' };
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={errStyles.container}>
          <Text style={errStyles.title}>Something went wrong</Text>
          <Text style={errStyles.sub}>{this.state.error}</Text>
          <TouchableOpacity
            style={errStyles.btn}
            onPress={() => this.setState({ hasError: false })}
          >
            <Text style={errStyles.btnText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const errStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: 12, textAlign: 'center' },
  sub: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  btn: { backgroundColor: Colors.primary, paddingVertical: 12, paddingHorizontal: 32, borderRadius: 12 },
  btnText: { color: Colors.white, fontWeight: FontWeight.semibold, fontSize: FontSize.base },
});

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <StatusBar style="light" backgroundColor="transparent" translucent />
          <RootNavigator />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
