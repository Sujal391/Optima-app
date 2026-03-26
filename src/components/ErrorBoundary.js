import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../theme';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error?.message || String(error), info?.componentStack || '');
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>🍷</Text>
          <Text style={styles.title}>Something spilled...</Text>
          <Text style={styles.message}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </Text>
          <TouchableOpacity style={styles.btn} onPress={this.reset}>
            <Text style={styles.btnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxxl,
  },
  emoji: { fontSize: 64, marginBottom: SPACING.lg },
  title: {
    fontSize: TYPOGRAPHY.xxl,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  message: {
    fontSize: TYPOGRAPHY.base,
    fontFamily: 'DMSans_400Regular',
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xxl,
  },
  btn: {
    backgroundColor: COLORS.burgundy,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
  },
  btnText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.base,
    fontFamily: 'DMSans_700Bold',
  },
});
