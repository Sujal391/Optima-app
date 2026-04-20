import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../theme';
import { Icon } from '../components/UI';
import { getActivityById } from '../api';

const { width: SCREEN_W } = Dimensions.get('window');

const VISIT_LABELS = {
  on_field: 'On Field', virtual: 'Virtual', office: 'Office', phone: 'Phone',
};

function InfoRow({ label, value, valueStyle }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueStyle]}>{value}</Text>
    </View>
  );
}

export default function ActivityDetailScreen({ navigation, route }) {
  // Accept either a pre-loaded activity from list, or just the id to fetch
  const { activity: initial, activityId } = route.params || {};
  const [activity, setActivity] = useState(initial || null);
  const [loading, setLoading] = useState(!initial);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    if (!initial && activityId) {
      fetchDetail(activityId);
    }
  }, [activityId, initial]);

  const fetchDetail = async (id) => {
    try {
      const res = await getActivityById(id);
      // Response structure: { activity: {...} }
      setActivity(res.data?.activity || res.data || null);
    } catch (e) {
      console.log('Activity detail error:', e?.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color={COLORS.burgundy} />
      </View>
    );
  }

  if (!activity) {
    return (
      <View style={styles.loadingBox}>
        <Icon name="alert-circle" size={48} color={COLORS.textMuted} />
        <Text style={styles.notFound}>Activity not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.goBack}>
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const date = activity.createdAt ? new Date(activity.createdAt).toLocaleString('en-IN') : '';
  const visitLabel = VISIT_LABELS[activity.visitType] || activity.visitType || '';
  const images = activity.images || [];

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={18} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {activity.customerName || 'Activity Detail'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {images.length > 0 && (
          <View style={styles.imageSection}>
            <Image
              source={images[activeImg]}
              style={styles.mainImage}
              contentFit="cover"
              transition={300}
              cachePolicy="disk"
              priority="high"
            />
            {images.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbRow}>
                {images.map((uri, i) => (
                  <TouchableOpacity key={i} onPress={() => setActiveImg(i)}>
                    <Image
                      source={uri}
                      style={[styles.thumb, i === activeImg && styles.thumbActive]}
                      contentFit="contain"
                      transition={150}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.customerName}>{activity.customerName}</Text>
              <Text style={styles.customerMobile}>{activity.customerMobile}</Text>
            </View>
            {!!visitLabel && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{visitLabel}</Text>
              </View>
            )}
          </View>
          {!!date && <Text style={styles.dateText}>{date}</Text>}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Discussion</Text>
          <Text style={styles.discussion}>{activity.discussion || '—'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Details</Text>
          <InfoRow label="Location" value={activity.location} />
          <InfoRow label="Inquiry Type" value={activity.inquiryType} />
          <InfoRow label="Remarks" value={activity.remarks} />
        </View>

        {(activity.marketingUser || activity.reviewedBy) && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>People</Text>
            {activity.marketingUser && (
              <InfoRow
                label="Logged By"
                value={`${activity.marketingUser.name || ''}${activity.marketingUser.email ? ` (${activity.marketingUser.email})` : ''}`}
              />
            )}
            {activity.reviewedBy && (
              <InfoRow
                label="Reviewed By"
                value={`${activity.reviewedBy.name || ''}${activity.reviewedBy.role ? ` · ${activity.reviewedBy.role}` : ''}`}
              />
            )}
          </View>
        )}

        <View style={{ height: SPACING.xxxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md, backgroundColor: COLORS.background },
  notFound: { fontSize: TYPOGRAPHY.md, fontFamily: 'DMSans_500Medium', color: COLORS.textMuted },
  goBack: { marginTop: SPACING.sm, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm, backgroundColor: COLORS.burgundy, borderRadius: RADIUS.full },
  goBackText: { color: '#fff', fontFamily: 'DMSans_700Bold', fontSize: TYPOGRAPHY.base },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingTop: 52, paddingBottom: SPACING.md,
    backgroundColor: COLORS.burgundyDark, gap: SPACING.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: TYPOGRAPHY.xl, fontFamily: 'DMSans_700Bold', color: '#fff', flex: 1 },
  container: { paddingBottom: SPACING.xl },
  imageSection: { backgroundColor: COLORS.surface, marginBottom: SPACING.md },
  mainImage: { width: SCREEN_W, height: 260 },
  thumbRow: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  thumb: { width: 60, height: 60, borderRadius: RADIUS.md, marginRight: SPACING.sm, opacity: 0.6 },
  thumbActive: { opacity: 1, borderWidth: 2, borderColor: COLORS.burgundy },
  card: {
    margin: SPACING.lg, marginBottom: 0,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.xl,
    padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, ...SHADOW.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  customerName: { fontSize: TYPOGRAPHY.lg, fontFamily: 'DMSans_700Bold', color: COLORS.textPrimary },
  customerMobile: { fontSize: TYPOGRAPHY.sm, fontFamily: 'DMSans_400Regular', color: COLORS.textMuted, marginTop: 2 },
  badge: { backgroundColor: COLORS.burgundyMuted, borderRadius: RADIUS.full, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: TYPOGRAPHY.xs, fontFamily: 'DMSans_700Bold', color: COLORS.burgundy },
  dateText: { fontSize: TYPOGRAPHY.xs, fontFamily: 'DMSans_400Regular', color: COLORS.textMuted, marginTop: SPACING.sm },
  sectionTitle: { fontSize: TYPOGRAPHY.base, fontFamily: 'DMSans_700Bold', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  discussion: { fontSize: TYPOGRAPHY.base, fontFamily: 'DMSans_400Regular', color: COLORS.textSecondary, lineHeight: 24 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  infoLabel: { fontSize: TYPOGRAPHY.sm, fontFamily: 'DMSans_500Medium', color: COLORS.textMuted, flex: 1 },
  infoValue: { fontSize: TYPOGRAPHY.sm, fontFamily: 'DMSans_400Regular', color: COLORS.textPrimary, flex: 2, textAlign: 'right' },
});

