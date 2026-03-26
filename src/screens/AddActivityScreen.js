import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOW } from '../theme';
import { Button, Input, Icon } from '../components/UI';
import { addActivity } from '../api';

const VISIT_TYPES = ['on_field', 'virtual', 'office', 'phone'];
const VISIT_LABELS = { on_field: 'On Field', virtual: 'Virtual', office: 'Office', phone: 'Phone' };

export default function AddActivityScreen({ navigation }) {
  const [form, setForm] = useState({
    customerName: '',
    customerMobile: '',
    discussion: '',
    location: '',
    visitType: 'on_field',
    inquiryType: '',
    remarks: '',
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const e = {};
    if (!form.customerName.trim()) e.customerName = 'Customer name is required';
    if (!form.customerMobile.trim()) e.customerMobile = 'Mobile number is required';
    else if (!/^[0-9]{10}$/.test(form.customerMobile.trim())) e.customerMobile = 'Enter a valid 10-digit mobile number';
    if (!form.discussion.trim()) e.discussion = 'Discussion summary is required';
    if (!form.location.trim()) e.location = 'Location is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const pickImages = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 5,
    });
    if (!result.canceled && result.assets?.length > 0) {
      setImages((prev) => [...prev, ...result.assets].slice(0, 5));
    }
  };

  const removeImage = (index) => setImages((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('customerName', form.customerName.trim());
      formData.append('customerMobile', form.customerMobile.trim());
      formData.append('discussion', form.discussion.trim());
      formData.append('location', form.location.trim());
      formData.append('visitType', form.visitType);
      if (form.inquiryType.trim()) formData.append('inquiryType', form.inquiryType.trim());
      if (form.remarks.trim()) formData.append('remarks', form.remarks.trim());

      images.forEach((img, idx) => {
        const mimeType = img.mimeType || img.type || 'image/jpeg';
        const ext = mimeType.split('/')[1] || 'jpg';
        formData.append('images', {
          uri: img.uri,
          type: mimeType,
          name: img.fileName || `activity_image_${idx + 1}.${ext}`,
        });
      });

      await addActivity(formData);
      Alert.alert('Success', 'Activity logged successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Failed', e.message || 'Could not log activity. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={18} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Log Activity</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Info</Text>
          <Input label="Customer Name *" placeholder="e.g. John Doe" value={form.customerName} onChangeText={(v) => set('customerName', v)} error={errors.customerName} />
          <Input label="Mobile Number *" placeholder="10-digit mobile" value={form.customerMobile} onChangeText={(v) => set('customerMobile', v)} keyboardType="phone-pad" error={errors.customerMobile} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visit Details</Text>

          <Text style={styles.fieldLabel}>VISIT TYPE</Text>
          <View style={styles.visitTypeRow}>
            {VISIT_TYPES.map((vt) => (
              <TouchableOpacity
                key={vt}
                style={[styles.typeChip, form.visitType === vt && styles.typeChipActive]}
                onPress={() => set('visitType', vt)}
              >
                <Text style={[styles.typeChipText, form.visitType === vt && styles.typeChipTextActive]}>
                  {VISIT_LABELS[vt]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input label="Location *" placeholder="e.g. Ahmedabad" value={form.location} onChangeText={(v) => set('location', v)} error={errors.location} />
          <Input label="Discussion *" placeholder="What was discussed?" value={form.discussion} onChangeText={(v) => set('discussion', v)} multiline numberOfLines={3} error={errors.discussion} />
          <Input label="Inquiry Type" placeholder="e.g. product inquiry" value={form.inquiryType} onChangeText={(v) => set('inquiryType', v)} />
          <Input label="Remarks" placeholder="e.g. Follow up next week" value={form.remarks} onChangeText={(v) => set('remarks', v)} multiline numberOfLines={2} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos <Text style={styles.optional}>(optional, max 5)</Text></Text>
          <View style={styles.imageGrid}>
            {images.map((img, i) => (
              <View key={i} style={styles.imgBox}>
                <Image source={{ uri: img.uri }} style={styles.imgPreview} resizeMode="cover" />
                <TouchableOpacity style={styles.imgRemove} onPress={() => removeImage(i)}>
                  <Icon name="x" size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 5 && (
              <TouchableOpacity style={styles.imgAdd} onPress={pickImages}>
                <Icon name="camera" size={24} color={COLORS.burgundy} />
                <Text style={styles.imgAddText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Button
          title={loading ? 'Submitting…' : 'Log Activity'}
          onPress={handleSubmit}
          loading={loading}
          size="lg"
          style={{ marginHorizontal: SPACING.lg, marginBottom: SPACING.xxxl }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: SPACING.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: 52,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.burgundyDark,
    gap: SPACING.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: TYPOGRAPHY.xl, fontFamily: 'DMSans_700Bold', color: '#fff' },
  section: {
    margin: SPACING.lg, marginBottom: 0,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  sectionTitle: { fontSize: TYPOGRAPHY.md, fontFamily: 'DMSans_700Bold', color: COLORS.textPrimary, marginBottom: SPACING.md },
  optional: { fontSize: TYPOGRAPHY.sm, fontFamily: 'DMSans_400Regular', color: COLORS.textMuted },
  fieldLabel: {
    fontSize: TYPOGRAPHY.xs, fontFamily: 'DMSans_500Medium', color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.sm,
  },
  visitTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  typeChip: {
    paddingHorizontal: SPACING.md, paddingVertical: 7,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.backgroundDark,
  },
  typeChipActive: { backgroundColor: COLORS.burgundy, borderColor: COLORS.burgundy },
  typeChipText: { fontSize: TYPOGRAPHY.sm, fontFamily: 'DMSans_500Medium', color: COLORS.textSecondary },
  typeChipTextActive: { color: '#fff' },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  imgBox: { width: 80, height: 80, borderRadius: RADIUS.md, overflow: 'hidden' },
  imgPreview: { width: '100%', height: '100%' },
  imgRemove: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 10, padding: 3,
  },
  imgAdd: {
    width: 80, height: 80, borderRadius: RADIUS.md,
    borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed',
    backgroundColor: COLORS.backgroundDark, alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  imgAddText: { fontSize: TYPOGRAPHY.xs, fontFamily: 'DMSans_500Medium', color: COLORS.burgundy },
});

