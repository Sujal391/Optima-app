import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../theme';
import { Icon, EmptyState, LoadingSpinner } from '../components/UI';
import { getMyActivities } from '../api';

const VISIT_LABELS = {
  on_field: 'On Field',
  virtual: 'Virtual',
  office: 'Office',
  phone: 'Phone',
};

function ActivityCard({ item, onPress }) {
  const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN') : '';
  const visitLabel = VISIT_LABELS[item.visitType] || item.visitType || '';
  const thumb = item.images?.[0];

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(item)} activeOpacity={0.82}>
      <View style={styles.cardRow}>
        <View style={styles.cardThumbBox}>
          {thumb ? (
            <Image source={{ uri: thumb }} style={styles.cardThumb} resizeMode="cover" />
          ) : (
            <View style={styles.cardThumbPlaceholder}>
              <Icon name="map-pin" size={22} color={COLORS.burgundy} />
            </View>
          )}
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardName} numberOfLines={1}>{item.customerName || '—'}</Text>
          <Text style={styles.cardMobile}>{item.customerMobile || ''}</Text>
          <Text style={styles.cardDiscussion} numberOfLines={2}>{item.discussion || ''}</Text>
          <View style={styles.cardFooter}>
            {!!visitLabel && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{visitLabel}</Text>
              </View>
            )}
            <Text style={styles.cardDate}>{date}</Text>
          </View>
        </View>
      </View>
      {!!item.location && (
        <View style={styles.locationRow}>
          <Icon name="map-pin" size={12} color={COLORS.textMuted} />
          <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: 52,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.burgundyDark,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontFamily: 'DMSans_700Bold',
    color: '#fff',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.burgundy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { padding: SPACING.lg, gap: SPACING.md, paddingBottom: SPACING.xxxl },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    ...SHADOW.sm,
  },
  cardRow: { flexDirection: 'row', gap: SPACING.md },
  cardThumbBox: { width: 64, height: 64, borderRadius: RADIUS.md, overflow: 'hidden' },
  cardThumb: { width: '100%', height: '100%' },
  cardThumbPlaceholder: {
    flex: 1,
    backgroundColor: COLORS.burgundyMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, gap: 2 },
  cardName: { fontSize: TYPOGRAPHY.base, fontFamily: 'DMSans_700Bold', color: COLORS.textPrimary },
  cardMobile: { fontSize: TYPOGRAPHY.sm, fontFamily: 'DMSans_400Regular', color: COLORS.textMuted },
  cardDiscussion: { fontSize: TYPOGRAPHY.sm, fontFamily: 'DMSans_400Regular', color: COLORS.textSecondary, marginTop: 2 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  badge: {
    backgroundColor: COLORS.burgundyMuted,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { fontSize: TYPOGRAPHY.xs, fontFamily: 'DMSans_500Medium', color: COLORS.burgundy },
  cardDate: { fontSize: TYPOGRAPHY.xs, fontFamily: 'DMSans_400Regular', color: COLORS.textMuted },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: SPACING.xs },
  locationText: { fontSize: TYPOGRAPHY.xs, fontFamily: 'DMSans_400Regular', color: COLORS.textMuted, flex: 1 },
});

export default function MarketingActivitiesScreen({ navigation }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActivities = async () => {
    try {
      const res = await getMyActivities();
      setActivities(res.data?.activities || []);
    } catch (e) {
      console.log('Fetch activities error:', e?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchActivities(); }, []));

  const handleRefresh = () => { setRefreshing(true); fetchActivities(); };

  if (loading) return <LoadingSpinner text="Loading activities…" />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Activities</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('AddActivity')}
          activeOpacity={0.8}
        >
          <Icon name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={activities}
        keyExtractor={(item) => item._id || String(Math.random())}
        renderItem={({ item }) => (
          <ActivityCard item={item} onPress={(a) => navigation.navigate('ActivityDetail', { activity: a })} />
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.burgundy]} />}
        ListEmptyComponent={
          <EmptyState
            icon={<Icon name="clipboard" size={52} color={COLORS.burgundy} />}
            title="No Activities Yet"
            subtitle="Tap + to log your first field visit"
            action="Add Activity"
            onAction={() => navigation.navigate('AddActivity')}
          />
        }
      />
    </View>
  );
}

