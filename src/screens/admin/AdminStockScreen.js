import React, { useContext, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, Alert, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { AppContext } from '../../context/AppContext';

export default function AdminStockScreen() {
  const { stock, updateStock } = useContext(AppContext);
  const morningStock = stock?.morningStock ?? 50;
  const eveningStock = stock?.eveningStock ?? 40;
  const [morning, setMorning] = useState(String(morningStock));
  const [evening, setEvening] = useState(String(eveningStock));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    const m = parseInt(morning, 10);
    const e = parseInt(evening, 10);
    if (isNaN(m) || m < 0) { Alert.alert('Invalid', 'Enter a valid morning stock number (0 or more).'); return; }
    if (isNaN(e) || e < 0) { Alert.alert('Invalid', 'Enter a valid evening stock number (0 or more).'); return; }
    setSaving(true);
    await updateStock(m, e);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const adjust = (setter, current, delta) => {
    const val = Math.max(0, parseInt(current, 10) + delta);
    setter(String(isNaN(val) ? 0 : val));
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient colors={['#0d1f14', '#142a1c']} style={s.header}>
        <Text style={s.headerTitle}>Daily Stock Management</Text>
        <Text style={s.headerSub}>Set available bottles for today</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {saved && (
          <View style={s.savedBanner}>
            <Ionicons name="checkmark-circle" size={18} color="#4caf50" />
            <Text style={s.savedText}>Stock updated successfully!</Text>
          </View>
        )}

        <Text style={s.sectionTitle}>🌅 Morning Toddy Stock</Text>
        <View style={s.card}>
          <View style={s.currentRow}>
            <Text style={s.currentLabel}>Current stock</Text>
            <Text style={[s.currentValue, morningStock < 10 && s.lowText]}>{morningStock} bottles</Text>
          </View>
          {morningStock === 0 && <Text style={s.zeroAlert}>⚠️ Morning ordering DISABLED (stock = 0)</Text>}
          {morningStock < 10 && morningStock > 0 && <Text style={s.lowAlert}>⚠️ Low stock warning</Text>}
          <Text style={s.inputLabel}>Update to:</Text>
          <View style={s.inputRow}>
            <TouchableOpacity style={s.adjBtn} onPress={() => adjust(setMorning, morning, -5)}>
              <Text style={s.adjBtnText}>-5</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.adjBtn} onPress={() => adjust(setMorning, morning, -1)}>
              <Text style={s.adjBtnText}>-1</Text>
            </TouchableOpacity>
            <TextInput
              style={s.input}
              value={morning}
              onChangeText={setMorning}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor="rgba(255,255,255,0.3)"
              selectTextOnFocus
            />
            <TouchableOpacity style={s.adjBtn} onPress={() => adjust(setMorning, morning, 1)}>
              <Text style={s.adjBtnText}>+1</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.adjBtn} onPress={() => adjust(setMorning, morning, 10)}>
              <Text style={s.adjBtnText}>+10</Text>
            </TouchableOpacity>
          </View>
          <View style={s.presets}>
            {[20, 30, 40, 50].map((v) => (
              <TouchableOpacity key={v} style={s.presetBtn} onPress={() => setMorning(String(v))}>
                <Text style={s.presetText}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={s.sectionTitle}>🌇 Evening Toddy Stock</Text>
        <View style={s.card}>
          <View style={s.currentRow}>
            <Text style={s.currentLabel}>Current stock</Text>
            <Text style={[s.currentValue, eveningStock < 10 && s.lowText]}>{eveningStock} bottles</Text>
          </View>
          {eveningStock === 0 && <Text style={s.zeroAlert}>⚠️ Evening ordering DISABLED (stock = 0)</Text>}
          {eveningStock < 10 && eveningStock > 0 && <Text style={s.lowAlert}>⚠️ Low stock warning</Text>}
          <Text style={s.inputLabel}>Update to:</Text>
          <View style={s.inputRow}>
            <TouchableOpacity style={s.adjBtn} onPress={() => adjust(setEvening, evening, -5)}>
              <Text style={s.adjBtnText}>-5</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.adjBtn} onPress={() => adjust(setEvening, evening, -1)}>
              <Text style={s.adjBtnText}>-1</Text>
            </TouchableOpacity>
            <TextInput
              style={s.input}
              value={evening}
              onChangeText={setEvening}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor="rgba(255,255,255,0.3)"
              selectTextOnFocus
            />
            <TouchableOpacity style={s.adjBtn} onPress={() => adjust(setEvening, evening, 1)}>
              <Text style={s.adjBtnText}>+1</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.adjBtn} onPress={() => adjust(setEvening, evening, 10)}>
              <Text style={s.adjBtnText}>+10</Text>
            </TouchableOpacity>
          </View>
          <View style={s.presets}>
            {[20, 30, 40, 50].map((v) => (
              <TouchableOpacity key={v} style={s.presetBtn} onPress={() => setEvening(String(v))}>
                <Text style={s.presetText}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[s.saveBtn, saving && s.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          <LinearGradient colors={saving ? ['#444', '#333'] : ['#2d8653', '#1a5c38']} style={s.saveBtnGrad}>
            {saving ? (
              <Text style={s.saveBtnText}>Saving...</Text>
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#fff" />
                <Text style={s.saveBtnText}>Save Stock</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={s.infoCard}>
          <Ionicons name="information-circle-outline" size={18} color={COLORS.primaryLight} />
          <Text style={s.infoText}>
            Setting stock to 0 disables customer ordering for that session. Stock resets daily when you update it here each morning and evening.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  header: { paddingTop: 54, paddingBottom: SPACING.lg, paddingHorizontal: SPACING.xl },
  headerTitle: { color: COLORS.white, fontSize: FONTS.sizes.xl, fontWeight: '800' },
  headerSub: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, marginTop: 2 },
  scroll: { padding: SPACING.xl },
  savedBanner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: 'rgba(76,175,80,0.1)', borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.lg, borderWidth: 1, borderColor: 'rgba(76,175,80,0.3)' },
  savedText: { color: '#4caf50', fontSize: FONTS.sizes.sm, fontWeight: '700' },
  sectionTitle: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: '700', marginBottom: SPACING.md },
  card: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginBottom: SPACING.xl, gap: SPACING.md },
  currentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  currentLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  currentValue: { color: COLORS.white, fontSize: FONTS.sizes.xxl, fontWeight: '800' },
  lowText: { color: '#ffb74d' },
  zeroAlert: { color: '#ef5350', fontSize: FONTS.sizes.sm, fontWeight: '700', backgroundColor: 'rgba(239,83,80,0.1)', padding: SPACING.sm, borderRadius: RADIUS.sm },
  lowAlert: { color: '#ffb74d', fontSize: FONTS.sizes.sm, backgroundColor: 'rgba(255,152,0,0.1)', padding: SPACING.sm, borderRadius: RADIUS.sm },
  inputLabel: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  adjBtn: { width: 44, height: 44, borderRadius: RADIUS.md, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  adjBtnText: { color: COLORS.white, fontSize: FONTS.sizes.sm, fontWeight: '700' },
  input: { flex: 1, height: 48, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(45,134,83,0.4)', color: COLORS.white, fontSize: FONTS.sizes.xxl, fontWeight: '800', textAlign: 'center' },
  presets: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  presetBtn: { paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: RADIUS.full, backgroundColor: 'rgba(45,134,83,0.15)', borderWidth: 1, borderColor: 'rgba(45,134,83,0.3)' },
  presetText: { color: COLORS.primaryLight, fontSize: FONTS.sizes.sm, fontWeight: '700' },
  saveBtn: { borderRadius: RADIUS.md, overflow: 'hidden', ...SHADOWS.button, marginBottom: SPACING.xl },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.lg, gap: SPACING.sm },
  saveBtnText: { color: '#fff', fontSize: FONTS.sizes.lg, fontWeight: '700' },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, backgroundColor: 'rgba(45,134,83,0.08)', borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: 'rgba(45,134,83,0.15)' },
  infoText: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, lineHeight: 20, flex: 1 },
});
