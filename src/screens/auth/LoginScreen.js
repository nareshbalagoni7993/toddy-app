import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Animated, KeyboardAvoidingView, Platform, ScrollView, StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { AppContext } from '../../context/AppContext';
import { authAPI } from '../../config/api';

const ROLE_META = {
  super_admin: { label: 'Super Admin', icon: 'shield-checkmark', color: '#9fa8da', bg: 'rgba(121,134,203,0.2)' },
  admin:       { label: 'Shop Admin',  icon: 'storefront',       color: COLORS.accent, bg: 'rgba(244,200,66,0.15)' },
  user:        { label: 'Customer',    icon: 'person',            color: COLORS.primaryLight, bg: 'rgba(45,134,83,0.2)' },
};

export default function LoginScreen({ navigation }) {
  const { loginUser } = useContext(AppContext);
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [detectedRole, setDetectedRole] = useState(null);

  const otpRefs = useRef([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (step === 'otp') startTimer();
  }, [step]);

  const startTimer = () => {
    setTimer(30);
    setCanResend(false);
    const interval = setInterval(() => {
      setTimer((v) => {
        if (v <= 1) { clearInterval(interval); setCanResend(true); return 0; }
        return v - 1;
      });
    }, 1000);
  };

  const handleSendOTP = async () => {
    if (phone.length !== 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authAPI.sendOTP(phone);
      setDetectedRole(data.role || 'user');
      if (data.otp) {
        Alert.alert('OTP (Dev Mode)', `Your OTP: ${data.otp}\nRole: ${data.role}`);
      }
      setStep('otp');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send OTP. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (val, idx) => {
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
    if (!val && idx > 0) otpRefs.current[idx - 1]?.focus();
    if (next.every((d) => d)) verifyOTP(next.join(''));
  };

  const verifyOTP = async (code) => {
    setLoading(true);
    try {
      const { data } = await authAPI.verifyOTP(phone, code || otp.join(''));
      await loginUser(data.user, data.accessToken, data.refreshToken);
      const route = data.user.role === 'super_admin'
        ? 'SuperAdminMain'
        : data.user.role === 'admin' ? 'AdminMain' : 'UserMain';
      navigation.replace(route);
    } catch (err) {
      Alert.alert('Verification Failed', err.response?.data?.message || 'Invalid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const roleMeta = detectedRole ? ROLE_META[detectedRole] : null;

  return (
    <LinearGradient colors={['#0d1f14', '#142a1c', '#1e3d2a']} style={s.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={s.bgDecor1} />
      <View style={s.bgDecor2} />
      <Text style={s.bgPalm1}>🌴</Text>
      <Text style={s.bgPalm2}>🌴</Text>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Animated.View style={[s.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

            <View style={s.header}>
              <View style={s.logoWrap}><Text style={s.logoEmoji}>🍶</Text></View>
              <Text style={s.title}>Toddy Connect</Text>
              <Text style={s.subtitle}>
                {step === 'phone' ? 'Enter your mobile number to continue' : `OTP sent to +91 ${phone}`}
              </Text>
            </View>

            {/* Role badge */}
            {step === 'otp' && roleMeta && (
              <View style={[s.roleBadge, { backgroundColor: roleMeta.bg, borderColor: roleMeta.color + '40' }]}>
                <Ionicons name={roleMeta.icon} size={16} color={roleMeta.color} />
                <Text style={[s.roleLabel, { color: roleMeta.color }]}>Logging in as {roleMeta.label}</Text>
              </View>
            )}

            <View style={s.card}>
              <LinearGradient colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']} style={s.cardGrad}>
                {step === 'phone' ? (
                  <>
                    <Text style={s.label}>Mobile Number</Text>
                    <View style={s.phoneRow}>
                      <View style={s.countryCode}><Text style={s.countryText}>🇮🇳 +91</Text></View>
                      <TextInput
                        style={s.phoneInput}
                        placeholder="Enter 10-digit number"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        keyboardType="phone-pad"
                        maxLength={10}
                        value={phone}
                        onChangeText={setPhone}
                        autoFocus
                      />
                    </View>
                    <TouchableOpacity
                      style={[s.btn, (loading || phone.length !== 10) && s.btnDisabled]}
                      onPress={handleSendOTP}
                      disabled={loading || phone.length !== 10}
                      activeOpacity={0.85}
                    >
                      <LinearGradient colors={loading ? ['#444', '#333'] : ['#2d8653', '#1a5c38']} style={s.btnGrad}>
                        {loading
                          ? <ActivityIndicator color="#fff" size="small" />
                          : <Ionicons name="arrow-forward" size={20} color="#fff" />}
                        <Text style={s.btnText}>{loading ? 'Sending OTP...' : 'Send OTP'}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View style={s.otpHeader}>
                      <TouchableOpacity onPress={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); setDetectedRole(null); }}>
                        <Ionicons name="arrow-back" size={20} color={COLORS.primaryLight} />
                      </TouchableOpacity>
                      <Text style={s.label}>Enter 6-digit OTP</Text>
                    </View>
                    <View style={s.otpRow}>
                      {otp.map((d, i) => (
                        <TextInput
                          key={i}
                          ref={(r) => (otpRefs.current[i] = r)}
                          style={[s.otpBox, d && s.otpBoxFilled]}
                          maxLength={1}
                          keyboardType="number-pad"
                          value={d}
                          onChangeText={(v) => handleOTPChange(v, i)}
                          selectTextOnFocus
                          editable={!loading}
                        />
                      ))}
                    </View>
                    {loading && (
                      <View style={s.verifyingRow}>
                        <ActivityIndicator size="small" color={COLORS.primaryLight} />
                        <Text style={s.verifyingText}>Verifying...</Text>
                      </View>
                    )}
                    <View style={s.resendRow}>
                      {canResend
                        ? <TouchableOpacity onPress={() => { setOtp(['', '', '', '', '', '']); handleSendOTP(); }}><Text style={s.resendActive}>Resend OTP</Text></TouchableOpacity>
                        : <Text style={s.resendTimer}>Resend in {timer}s</Text>}
                    </View>
                    <TouchableOpacity
                      style={[s.btn, (loading || otp.some((d) => !d)) && s.btnDisabled]}
                      onPress={() => verifyOTP(otp.join(''))}
                      disabled={loading || otp.some((d) => !d)}
                      activeOpacity={0.85}
                    >
                      <LinearGradient colors={loading ? ['#444', '#333'] : ['#2d8653', '#1a5c38']} style={s.btnGrad}>
                        <Ionicons name="checkmark" size={20} color="#fff" />
                        <Text style={s.btnText}>Verify & Login</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                )}
              </LinearGradient>
            </View>

            <Text style={s.terms}>
              By continuing, you agree to our{' '}
              <Text style={s.termsLink}>Terms of Service</Text> and{' '}
              <Text style={s.termsLink}>Privacy Policy</Text>
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  bgDecor1: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(45,134,83,0.12)', top: -60, right: -60 },
  bgDecor2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(244,200,66,0.06)', bottom: 80, left: -50 },
  bgPalm1: { position: 'absolute', fontSize: 100, opacity: 0.05, bottom: 120, right: 10 },
  bgPalm2: { position: 'absolute', fontSize: 80, opacity: 0.05, top: 80, left: 10, transform: [{ scaleX: -1 }] },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: SPACING.xl },
  content: { paddingVertical: SPACING.xxxl },
  header: { alignItems: 'center', marginBottom: SPACING.xl },
  logoWrap: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(45,134,83,0.25)', borderWidth: 2, borderColor: 'rgba(45,134,83,0.5)', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg },
  logoEmoji: { fontSize: 44 },
  title: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.white, marginBottom: SPACING.xs },
  subtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, textAlign: 'center' },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, borderRadius: RADIUS.full, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderWidth: 1, alignSelf: 'center', marginBottom: SPACING.md },
  roleLabel: { fontSize: FONTS.sizes.sm, fontWeight: '700' },
  card: { borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', marginBottom: SPACING.lg, ...SHADOWS.card },
  cardGrad: { padding: SPACING.xl },
  label: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, marginBottom: SPACING.sm, fontWeight: '600' },
  phoneRow: { flexDirection: 'row', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: RADIUS.md, marginBottom: SPACING.xl, overflow: 'hidden' },
  countryCode: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.lg, backgroundColor: 'rgba(255,255,255,0.07)', borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.1)', justifyContent: 'center' },
  countryText: { color: COLORS.white, fontSize: FONTS.sizes.md },
  phoneInput: { flex: 1, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.lg, color: COLORS.white, fontSize: FONTS.sizes.lg },
  btn: { borderRadius: RADIUS.md, overflow: 'hidden', marginTop: SPACING.xs },
  btnDisabled: { opacity: 0.5 },
  btnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.lg, gap: SPACING.sm },
  btnText: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: '700' },
  otpHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xl, gap: SPACING.sm },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.lg },
  otpBox: { width: 46, height: 56, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.05)', color: COLORS.white, fontSize: FONTS.sizes.xl, textAlign: 'center', fontWeight: '700' },
  otpBoxFilled: { borderColor: COLORS.primaryLight, backgroundColor: 'rgba(45,134,83,0.2)' },
  verifyingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  verifyingText: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  resendRow: { alignItems: 'center', marginBottom: SPACING.xl },
  resendTimer: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  resendActive: { color: COLORS.primaryLight, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  terms: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, textAlign: 'center', lineHeight: 18 },
  termsLink: { color: COLORS.primaryLight },
});
