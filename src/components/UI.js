import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../theme';

const BRAND_ICON = require('../../assets/icon.png');

export const Icon = ({ name, size = 20, color = COLORS.textPrimary, style }) => (
  <Feather name={name} size={size} color={color} style={style} />
);

export const BrandMark = ({ size = 48, style, imageStyle }) => (
  <View
    style={[
      styles.brandMark,
      {
        width: size,
        height: size,
        borderRadius: size / 2,
      },
      style,
    ]}
  >
    <Image
      source={BRAND_ICON}
      style={[
        {
          width: size * 0.68,
          height: size * 0.68,
          borderRadius: size * 0.18,
        },
        imageStyle,
      ]}
      resizeMode="contain"
    />
  </View>
);

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
}) => {
  const variantStyle = {
    primary: {
      bg: COLORS.burgundy,
      text: COLORS.textInverse,
      border: COLORS.burgundy,
    },
    secondary: {
      bg: COLORS.gold,
      text: COLORS.textPrimary,
      border: COLORS.gold,
    },
    outline: {
      bg: 'transparent',
      text: COLORS.burgundy,
      border: COLORS.burgundy,
    },
    ghost: {
      bg: 'transparent',
      text: COLORS.burgundy,
      border: 'transparent',
    },
    danger: {
      bg: COLORS.error,
      text: '#fff',
      border: COLORS.error,
    },
  }[variant];

  const sizeStyle = {
    sm: { paddingVertical: 8, paddingHorizontal: 16, fontSize: TYPOGRAPHY.sm },
    md: { paddingVertical: 14, paddingHorizontal: 24, fontSize: TYPOGRAPHY.base },
    lg: { paddingVertical: 17, paddingHorizontal: 32, fontSize: TYPOGRAPHY.md },
  }[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.btn,
        {
          backgroundColor: variantStyle.bg,
          borderColor: variantStyle.border,
          paddingVertical: sizeStyle.paddingVertical,
          paddingHorizontal: sizeStyle.paddingHorizontal,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.text} size="small" />
      ) : (
        <View style={styles.btnInner}>
          {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
          <Text style={[styles.btnText, { color: variantStyle.text, fontSize: sizeStyle.fontSize }]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'none',
  error,
  multiline,
  numberOfLines,
  icon,
  rightIcon,
  style,
  editable = true,
}) => (
  <View style={[styles.inputContainer, style]}>
    {label && <Text style={styles.inputLabel}>{label}</Text>}
    <View
      style={[
        styles.inputWrapper,
        error && { borderColor: COLORS.error },
        !editable && { backgroundColor: COLORS.backgroundDark },
      ]}
    >
      {icon && <View style={styles.inputIcon}>{icon}</View>}
      <TextInput
        style={[
          styles.input,
          icon && { paddingLeft: 0 },
          multiline && { height: numberOfLines * 24, textAlignVertical: 'top' },
        ]}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        numberOfLines={numberOfLines}
        editable={editable}
      />
      {rightIcon && <View style={styles.inputRightIcon}>{rightIcon}</View>}
    </View>
    {error && <Text style={styles.inputError}>{error}</Text>}
  </View>
);

export const Card = ({ children, style, onPress, elevated = false }) => {
  const Component = onPress ? TouchableOpacity : View;
  return (
    <Component
      onPress={onPress}
      activeOpacity={0.92}
      style={[styles.card, elevated && SHADOW.md, style]}
    >
      {children}
    </Component>
  );
};

export const Badge = ({ label, color = COLORS.burgundy, textColor = '#fff', style }) => (
  <View style={[styles.badge, { backgroundColor: color }, style]}>
    <Text style={[styles.badgeText, { color: textColor }]}>{label}</Text>
  </View>
);

export const SectionHeader = ({ title, subtitle, action, onAction }) => (
  <View style={styles.sectionHeader}>
    <View style={{ flex: 1 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    </View>
    {action && (
      <TouchableOpacity onPress={onAction}>
        <Text style={styles.sectionAction}>{action}</Text>
      </TouchableOpacity>
    )}
  </View>
);

export const Divider = ({ style }) => (
  <View style={[styles.divider, style]} />
);

export const EmptyState = ({ icon, title, subtitle, action, onAction }) => (
  <View style={styles.emptyState}>
    {icon || <Icon name="inbox" size={52} color={COLORS.burgundy} style={styles.emptyIcon} />}
    <Text style={styles.emptyTitle}>{title}</Text>
    {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
    {action && (
      <Button title={action} onPress={onAction} style={{ marginTop: SPACING.lg }} />
    )}
  </View>
);

export const LoadingSpinner = ({ text }) => (
  <View style={styles.loading}>
    <ActivityIndicator color={COLORS.burgundy} size="large" />
    {text && <Text style={styles.loadingText}>{text}</Text>}
  </View>
);

export const PriceDisplay = ({ price, originalPrice, size = 'md' }) => {
  const fontSize = size === 'sm' ? TYPOGRAPHY.sm : size === 'lg' ? TYPOGRAPHY.xl : TYPOGRAPHY.md;
  return (
    <View style={styles.priceRow}>
      <Text style={[styles.price, { fontSize }]}>Rs.{price?.toLocaleString()}</Text>
      {originalPrice && originalPrice > price && (
        <Text style={styles.originalPrice}>Rs.{originalPrice?.toLocaleString()}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  btn: {
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  btnText: {
    fontFamily: 'DMSans_500Medium',
    letterSpacing: 0.2,
  },

  inputContainer: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.sm,
    fontFamily: 'DMSans_500Medium',
    color: COLORS.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: TYPOGRAPHY.base,
    color: COLORS.textPrimary,
    fontFamily: 'DMSans_400Regular',
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  inputRightIcon: {
    marginLeft: SPACING.sm,
  },
  inputError: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.error,
    marginTop: 4,
    fontFamily: 'DMSans_400Regular',
  },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    fontSize: TYPOGRAPHY.xs,
    fontFamily: 'DMSans_500Medium',
    letterSpacing: 0.3,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.textPrimary,
  },
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.sm,
    fontFamily: 'DMSans_400Regular',
    color: COLORS.textMuted,
    marginTop: 2,
  },
  sectionAction: {
    fontSize: TYPOGRAPHY.sm,
    fontFamily: 'DMSans_500Medium',
    color: COLORS.burgundy,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxxl,
  },
  emptyIcon: {
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontFamily: 'DMSans_700Bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.base,
    fontFamily: 'DMSans_400Regular',
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },

  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textMuted,
    fontFamily: 'DMSans_400Regular',
    marginTop: SPACING.sm,
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  price: {
    fontFamily: 'DMSans_700Bold',
    color: COLORS.burgundy,
  },
  originalPrice: {
    fontSize: TYPOGRAPHY.sm,
    fontFamily: 'DMSans_400Regular',
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },

  brandMark: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    ...SHADOW.sm,
  },
});
