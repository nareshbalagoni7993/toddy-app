import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, StatusBar, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { superAdminAPI } from '../../config/api';

function Field({ label, value, onChangeText, placeholder, keyboardType, multiline, required, icon }) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}{required && <Text style={{ color: '#ef5350' }}> *</Text>}</Text>
      <View style={[s.inputWrap, multiline && s.inputMulti]}>
        {icon && <Ionicons name={icon} size={18} color={COLORS.textMuted} />}
        <TextInput
          style={[s.input, multiline && { height: 70, textAlignVertical: 'top' }]}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType || 'default'}
          multiline={multiline}
          autoCapitalize={keyboardType === 'phone-pad' || keyboardType === 'numeric' ? 'none' : 'words'}
        />
      </View>
    </View>
  );
}

export default function CreateAdminScreen({ navigation, route }) {
  const editAdmin = route?.params?.admin;
  const isEdit = !!editAdmin;

  const [form, setForm] = useState({
    phone: editAdmin?.phone || '',
    name: editAdmin?.name || '',
    shopName: editAdmin?.shopName || '',
    ownerName: editAdmin?.ownerName || '',
    email: editAdmin?.email || '',
    address: editAdmin?.address || '',
    latitude: editAdmin?.latitude ? String(editAdmin.latitude) : '',
    longitude: editAdmin?.longitude ? String(editAdmin.longitude) : '',
    openTime: editAdmin?.openTime || '06:00 AM',
    closeTime: editAdmin?.closeTime || '08:00 PM',
    deliveryRadius: editAdmin?.deliveryRadius ? String(editAdmin.deliveryRadius) : '2',
    minOrder: editAdmin?.minOrder ? String(editAdmin.minOrder) : '100',
    description: editAdmin?.description || '',
    image: editAdmin?.image || '',
  });
  const [loading, setLoading] = useState(false);

  const set = (key) => (val) => setForm((prev) => ({ ...prev, [key]: val }));

  const validate = () => {
    if (!form.phone.trim() || !/^\d{10}$/.test(form.phone.trim())) {
      Alert.alert('Validation', 'Enter a valid 10-digit phone number');
      return false;
    }
    if (!form.shopName.trim()) { Alert.alert('Validation', 'Shop name is required'); return false; }
    if (!form.ownerName.trim()) { Alert.alert('Validation', 'Owner name is required'); return false; }
    if (!form.address.trim()) { Alert.alert('Validation', 'Address is required'); return false; }
    if (!form.latitude || isNaN(parseFloat(form.latitude))) {
      Alert.alert('Validation', 'Valid latitude is required (e.g. 16.5062)');
      return false;
    }
    if (!form.longitude || isNaN(parseFloat(form.longitude))) {
      Alert.alert('Validation', 'Valid longitude is required (e.g. 80.648)');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        ...form,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        deliveryRadius: parseFloat(form.deliveryRadius) || 2,
        minOrder: parseInt(form.minOrder) || 100,
      };

      if (isEdit) {
        await superAdminAPI.updateAdmin(editAdmin._id, payload);
        Alert.alert('Success', `${form.shopName} updated successfully!`);
      } else {
        await superAdminAPI.createAdmin(payload);
        Alert.alert('Success', `${form.shopName} created!\n\nAdmin can now login with phone: ${form.phone}\nOTP: 123456 (dev mode)`, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
        return;
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.container}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <LinearGradient colors={['#0d0d1a', '#0d1f14']} style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>{isEdit ? 'Edit Shop' : 'Add New Shop'}</Text>
        </LinearGradient>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

          {/* Account Info */}
          <Text style={s.sectionTitle}>Account Information</Text>
          <Field label="Mobile Number" value={form.phone} onChangeText={set('phone')} placeholder="10-digit number" keyboardType="phone-pad" required icon="call-outline" />
          <Field label="Full Name" value={form.name} onChangeText={set('name')} placeholder="Admin's full name" icon="person-outline" />
          <Field label="Email (Optional)" value={form.email} onChangeText={set('email')} placeholder="admin@email.com" keyboardType="email-address" icon="mail-outline" />

          {/* Shop Details */}
          <Text style={[s.sectionTitle, { marginTop: SPACING.xl }]}>Shop Details</Text>
          <Field label="Shop Name" value={form.shopName} onChangeText={set('shopName')} placeholder="e.g. Kallu Reddy Toddy Shop" required icon="storefront-outline" />
          <Field label="Owner Name" value={form.ownerName} onChangeText={set('ownerName')} placeholder="e.g. Ravi Kumar Reddy" required icon="person-circle-outline" />
          <Field label="Description" value={form.description} onChangeText={set('description')} placeholder="Short description of the shop..." multiline icon="information-circle-outline" />
          <Field label="Shop Image URL (Optional)" value={form.image} onChangeText={set('image')} placeholder="https://..." icon="image-outline" />

          {/* Location */}
          <Text style={[s.sectionTitle, { marginTop: SPACING.xl }]}>Location</Text>
          <Field label="Full Address" value={form.address} onChangeText={set('address')} placeholder="e.g. Benz Circle, Vijayawada, AP 520010" required multiline icon="location-outline" />
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Field label="Latitude" value={form.latitude} onChangeText={set('latitude')} placeholder="16.5062" keyboardType="decimal-pad" required />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Longitude" value={form.longitude} onChangeText={set('longitude')} placeholder="80.648" keyboardType="decimal-pad" required />
            </View>
          </View>
          <View style={s.hint}>
            <Ionicons name="information-circle-outline" size={14} color={COLORS.textMuted} />
            <Text style={s.hintText}>Get lat/long from Google Maps → right-click → "What's here?"</Text>
          </View>

          {/* Business Settings */}
          <Text style={[s.sectionTitle, { marginTop: SPACING.xl }]}>Business Settings</Text>
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Field label="Open Time" value={form.openTime} onChangeText={set('openTime')} placeholder="06:00 AM" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Close Time" value={form.closeTime} onChangeText={set('closeTime')} placeholder="08:00 PM" />
            </View>
          </View>
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Field label="Delivery Radius (km)" value={form.deliveryRadius} onChangeText={set('deliveryRadius')} placeholder="2" keyboardType="decimal-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Min Order (₹)" value={form.minOrder} onChangeText={set('minOrder')} placeholder="100" keyboardType="numeric" />
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[s.submitBtn, loading && s.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient colors={loading ? ['#444', '#333'] : ['#2d8653', '#1a5c38']} style={s.submitGrad}>
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name={isEdit ? 'save-outline' : 'checkmark-circle-outline'} size={20} color="#fff" />
              )}
              <Text style={s.submitText}>
                {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Admin Account'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {!isEdit && (
            <View style={s.infoBox}>
              <Ionicons name="information-circle-outline" size={16} color={COLORS.primaryLight} />
              <Text style={s.infoText}>
                The admin will receive their phone number as login credential.
                In dev mode, OTP is always <Text style={{ color: COLORS.accent, fontWeight: '700' }}>123456</Text>.
              </Text>
            </View>
          )}

        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingTop: 54, paddingBottom: SPACING.lg, paddingHorizontal: SPACING.xl,
  },
  headerTitle: { flex: 1, color: COLORS.white, fontSize: FONTS.sizes.xl, fontWeight: '800' },
  scroll: { padding: SPACING.xl, paddingBottom: 60 },
  sectionTitle: { color: COLORS.primaryLight, fontSize: FONTS.sizes.sm, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: SPACING.md },
  field: { marginBottom: SPACING.md },
  label: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, fontWeight: '600', marginBottom: SPACING.xs },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  inputMulti: { alignItems: 'flex-start', paddingVertical: SPACING.md },
  input: { flex: 1, color: COLORS.white, fontSize: FONTS.sizes.md },
  row: { flexDirection: 'row', gap: SPACING.md },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.md, marginTop: -SPACING.xs },
  hintText: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, flex: 1 },
  submitBtn: { borderRadius: RADIUS.lg, overflow: 'hidden', marginTop: SPACING.xl },
  submitBtnDisabled: { opacity: 0.6 },
  submitGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.lg, gap: SPACING.sm },
  submitText: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: '700' },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, backgroundColor: 'rgba(45,134,83,0.1)', borderRadius: RADIUS.md, padding: SPACING.md, marginTop: SPACING.md, borderWidth: 1, borderColor: 'rgba(45,134,83,0.25)' },
  infoText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, flex: 1, lineHeight: 18 },
});
