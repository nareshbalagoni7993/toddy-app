import React, { useState, useRef, useEffect, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Animated, KeyboardAvoidingView, Platform, ScrollView, StatusBar, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { AppContext } from '../../context/AppContext';

export default function LoginScreen({ navigation }) {
  const { loginUser } = useContext(AppContext);
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
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
    const t = setInterval(() => {
      setTimer((v) => {
        if (v <= 1) { clearInterval(t); setCanResend(true); return 0; }
        return v - 1;
      });
    }, 1000);
  };

  const handleSendOTP = () => {
    if (phone.length !== 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep('otp'); }, 1200);
  };

  const handleOTPChange = (val, idx) => {
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
    if (!val && idx > 0) otpRefs.current[idx - 1]?.focus();
    if (next.every((d) => d) && next.join('').length === 6) verifyOTP(next.join(''));
  };

  const verifyOTP = async (code) => {
    setLoading(true);
    setTimeout(async () => {
      const role = await loginUser(phone);
      setLoading(false);
      if (role === 'admin') {
        navigation.replace('AdminMain');
      } else {
        navigation.replace('UserMain');
      }
    }, 1000);
  };

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

            <View style={s.card}>
              <LinearGradient colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.03)']} style={s.cardGrad}>
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
                      style={[s.btn, loading && s.btnDisabled]}
                      onPress={handleSendOTP}
                      disabled={loading}
                      activeOpacity={0.85}
                    >
                      <LinearGradient colors={loading ? ['#444', '#333'] : ['#2d8653', '#1a5c38']} style={s.btnGrad}>
                        <Text style={s.btnText}>{loading ? 'Sending OTP...' : 'Send OTP'}</Text>
                        {!loading && <Ionicons name="arrow-forward" size={20} color="#fff" />}
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View style={s.otpHeader}>
                      <TouchableOpacity onPress={() => setStep('phone')}><Ionicons name="arrow-back" size={20} color={COLORS.primaryLight} /></TouchableOpacity>
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
                        />
                      ))}
                    </View>
                    <View style={s.resendRow}>
                      {canResend ? (
                        <TouchableOpacity onPress={() => { setOtp(['','','','','','']); startTimer(); }}>
                          <Text style={s.resendActive}>Resend OTP</Text>
                        </TouchableOpacity>
                      ) : (
                        <Text style={s.resendTimer}>Resend in {timer}s</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={[s.btn, (loading || otp.some((d) => !d)) && s.btnDisabled]}
                      onPress={() => verifyOTP(otp.join(''))}
                      disabled={loading || otp.some((d) => !d)}
                      activeOpacity={0.85}
                    >
                      <LinearGradient colors={loading ? ['#444', '#333'] : ['#2d8653', '#1a5c38']} style={s.btnGrad}>
                        <Text style={s.btnText}>{loading ? 'Verifying...' : 'Verify & Continue'}</Text>
                        {!loading && <Ionicons name="checkmark" size={20} color="#fff" />}
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
  header: { alignItems: 'center', marginBottom: SPACING.xxl },
  logoWrap: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(45,134,83,0.25)', borderWidth: 2, borderColor: 'rgba(45,134,83,0.5)', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg },
  logoEmoji: { fontSize: 44 },
  title: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.white, marginBottom: SPACING.xs },
  subtitle: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, textAlign: 'center' },
  card: { borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', marginBottom: SPACING.lg, ...SHADOWS.card },
  cardGrad: { padding: SPACING.xl },
  label: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, marginBottom: SPACING.sm, fontWeight: '600' },
  phoneRow: { flexDirection: 'row', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: RADIUS.md, marginBottom: SPACING.xl, overflow: 'hidden' },
  countryCode: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.lg, backgroundColor: 'rgba(255,255,255,0.07)', borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.1)', justifyContent: 'center' },
  countryText: { color: COLORS.white, fontSize: FONTS.sizes.md },
  phoneInput: { flex: 1, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.lg, color: COLORS.white, fontSize: FONTS.sizes.lg },
  btn: { borderRadius: RADIUS.md, overflow: 'hidden', marginTop: SPACING.xs, ...SHADOWS.button },
  btnDisabled: { opacity: 0.6 },
  btnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.lg, gap: SPACING.sm },
  btnText: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: '700' },
  otpHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xl, gap: SPACING.sm },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.lg },
  otpBox: { width: 46, height: 56, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.05)', color: COLORS.white, fontSize: FONTS.sizes.xl, textAlign: 'center', fontWeight: '700' },
  otpBoxFilled: { borderColor: COLORS.primaryLight, backgroundColor: 'rgba(45,134,83,0.2)' },
  resendRow: { alignItems: 'center', marginBottom: SPACING.xl },
  resendTimer: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  resendActive: { color: COLORS.primaryLight, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  terms: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, textAlign: 'center', lineHeight: 18 },
  termsLink: { color: COLORS.primaryLight },
});
