import React, { useState, useContext } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Image,
  StatusBar, Linking, FlatList, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../constants/theme';
import { EDUCATIONAL_CONTENT, GOVERNMENT_UPDATES, GALLERY_ITEMS, EDU_VIDEOS } from '../../constants/data';
import { useWeather } from '../../hooks/useWeather';

const TABS = ['Learn', 'Govt', 'Gallery', 'Weather'];

export default function ExploreScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Learn');
  const [expandedEdu, setExpandedEdu] = useState(null);
  const { temp, humidity, wind, label, icon: wIcon, isRainy, tappingAlert, forecast, loading: wLoading } = useWeather();

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <LinearGradient colors={['#0d1f14', '#142a1c']} style={s.header}>
        <Text style={s.headerTitle}>Explore</Text>
        <Text style={s.headerSub}>Learn • Updates • Gallery • Weather</Text>
      </LinearGradient>

      {/* Tabs */}
      <View style={s.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[s.tab, activeTab === t && s.tabActive]}
            onPress={() => setActiveTab(t)}
            activeOpacity={0.85}
          >
            <Text style={[s.tabText, activeTab === t && s.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── LEARN TAB ─────────────────────────────────────────────────────── */}
        {activeTab === 'Learn' && (
          <>
            <Text style={s.sectionTitle}>📚 About Palm & Toddy</Text>
            {EDUCATIONAL_CONTENT.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={s.eduCard}
                onPress={() => setExpandedEdu(expandedEdu === item.id ? null : item.id)}
                activeOpacity={0.85}
              >
                <View style={s.eduCardTop}>
                  <View style={[s.eduIconWrap, { backgroundColor: `${item.color}20` }]}>
                    <Ionicons name={item.icon} size={22} color={item.color} />
                  </View>
                  <View style={s.eduMeta}>
                    <Text style={s.eduTitle}>{item.title}</Text>
                    <Text style={s.eduTitleTe}>{item.titleTelugi}</Text>
                  </View>
                  <Ionicons
                    name={expandedEdu === item.id ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={COLORS.textMuted}
                  />
                </View>
                {expandedEdu === item.id && (
                  <View style={s.eduExpanded}>
                    <Image source={{ uri: item.image }} style={s.eduImg} />
                    <Text style={s.eduContent}>{item.content}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}

            {/* Videos */}
            <Text style={s.sectionTitle}>🎬 Videos</Text>
            {EDU_VIDEOS.map((v) => (
              <TouchableOpacity
                key={v.id}
                style={s.videoCard}
                onPress={() => Linking.openURL(v.url).catch(() => {})}
                activeOpacity={0.85}
              >
                <View style={s.videoThumbWrap}>
                  <Image source={{ uri: v.thumb }} style={s.videoThumb} />
                  <View style={s.playBtn}>
                    <Ionicons name="play" size={22} color="#fff" />
                  </View>
                </View>
                <View style={s.videoInfo}>
                  <Text style={s.videoTitle} numberOfLines={2}>{v.title}</Text>
                  <Text style={s.videoDesc} numberOfLines={2}>{v.desc}</Text>
                  <View style={s.youtubeTag}>
                    <Ionicons name="logo-youtube" size={12} color="#f00" />
                    <Text style={s.youtubeTagText}>YouTube</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* ── GOVERNMENT TAB ────────────────────────────────────────────────── */}
        {activeTab === 'Govt' && (
          <>
            <Text style={s.sectionTitle}>🏛️ Government Updates</Text>
            {GOVERNMENT_UPDATES.map((item) => (
              <View key={item.id} style={[s.govCard, item.urgent && s.govCardUrgent]}>
                {item.urgent && (
                  <View style={s.urgentBadge}>
                    <Text style={s.urgentText}>⚠️ Action Required</Text>
                  </View>
                )}
                <View style={s.govCardTop}>
                  <View style={[s.govIconWrap, { backgroundColor: `${item.color}20` }]}>
                    <Ionicons name={item.icon} size={20} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.govTitle}>{item.title}</Text>
                    <Text style={s.govTitleTe}>{item.titleTelugi}</Text>
                  </View>
                </View>
                <Text style={s.govContent}>{item.content}</Text>
                <View style={s.govFooter}>
                  <Text style={s.govSource}>📋 {item.source}</Text>
                  <Text style={s.govDate}>{new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* ── GALLERY TAB ───────────────────────────────────────────────────── */}
        {activeTab === 'Gallery' && (
          <>
            <Text style={s.sectionTitle}>📸 Photo Gallery</Text>
            <View style={s.gallery}>
              {GALLERY_ITEMS.map((item, idx) => (
                <View key={item.id} style={[s.galleryItem, idx % 3 === 0 && s.galleryItemWide]}>
                  <Image source={{ uri: item.image }} style={s.galleryImg} />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={s.galleryOverlay}>
                    <Text style={s.galleryTitle} numberOfLines={2}>{item.title}</Text>
                  </LinearGradient>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── WEATHER TAB ───────────────────────────────────────────────────── */}
        {activeTab === 'Weather' && (
          <>
            <Text style={s.sectionTitle}>🌤️ Live Weather — Vijayawada</Text>

            {wLoading ? (
              <View style={s.wLoadingWrap}>
                <ActivityIndicator size="large" color={COLORS.primaryLight} />
                <Text style={s.wLoadingText}>Fetching weather...</Text>
              </View>
            ) : (
              <>
                {/* Main weather card */}
                <LinearGradient colors={['rgba(45,134,83,0.2)', 'rgba(45,134,83,0.05)']} style={s.wMainCard}>
                  <Text style={s.wIcon}>{wIcon}</Text>
                  <Text style={s.wTemp}>{temp}°C</Text>
                  <Text style={s.wLabel}>{label}</Text>
                  <View style={s.wStats}>
                    <View style={s.wStat}>
                      <Ionicons name="water-outline" size={16} color={COLORS.primaryLight} />
                      <Text style={s.wStatText}>{humidity}% Humidity</Text>
                    </View>
                    <View style={s.wStat}>
                      <Ionicons name="cellular-outline" size={16} color={COLORS.primaryLight} />
                      <Text style={s.wStatText}>{wind} km/h Wind</Text>
                    </View>
                  </View>
                </LinearGradient>

                {/* Tapping alert */}
                {isRainy && (
                  <View style={s.rainAlert}>
                    <Text style={{ fontSize: 24 }}>⛈️</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={s.rainAlertTitle}>Rain Alert for Tappers</Text>
                      <Text style={s.rainAlertBody}>{tappingAlert}</Text>
                    </View>
                  </View>
                )}

                {/* 7-day forecast */}
                <Text style={s.sectionTitle}>7-Day Forecast</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.forecastRow}>
                  {(forecast || []).map((day, i) => (
                    <View key={i} style={[s.forecastCard, day.rain > 2 && s.forecastCardRainy]}>
                      <Text style={s.forecastDay}>{i === 0 ? 'Today' : new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short' })}</Text>
                      <Text style={s.forecastIcon}>{day.icon}</Text>
                      <Text style={s.forecastMax}>{day.max}°</Text>
                      <Text style={s.forecastMin}>{day.min}°</Text>
                      {day.rain > 1 && <Text style={s.forecastRain}>💧{day.rain}mm</Text>}
                    </View>
                  ))}
                </ScrollView>

                <View style={s.wNote}>
                  <Ionicons name="information-circle-outline" size={14} color={COLORS.textMuted} />
                  <Text style={s.wNoteText}>Data from Open-Meteo • Updated hourly</Text>
                </View>
              </>
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  header: { paddingTop: 54, paddingBottom: SPACING.lg, paddingHorizontal: SPACING.xl },
  headerTitle: { color: COLORS.white, fontSize: FONTS.sizes.xxl, fontWeight: '800' },
  headerSub: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, marginTop: 2 },
  tabRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.04)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  tab: { flex: 1, paddingVertical: SPACING.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primaryLight },
  tabText: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  tabTextActive: { color: COLORS.primaryLight },
  scroll: { padding: SPACING.xl },
  sectionTitle: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: '700', marginBottom: SPACING.md, marginTop: SPACING.md },

  // Education
  eduCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  eduCardTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  eduIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  eduMeta: { flex: 1 },
  eduTitle: { color: COLORS.white, fontSize: FONTS.sizes.md, fontWeight: '700' },
  eduTitleTe: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 1 },
  eduExpanded: { marginTop: SPACING.md },
  eduImg: { width: '100%', height: 140, borderRadius: RADIUS.md, marginBottom: SPACING.md, resizeMode: 'cover' },
  eduContent: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, lineHeight: 20 },

  // Videos
  videoCard: { flexDirection: 'row', gap: SPACING.md, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.lg, overflow: 'hidden', marginBottom: SPACING.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  videoThumbWrap: { position: 'relative', width: 110, height: 80 },
  videoThumb: { width: '100%', height: '100%', resizeMode: 'cover' },
  playBtn: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)' },
  videoInfo: { flex: 1, padding: SPACING.sm, justifyContent: 'center' },
  videoTitle: { color: COLORS.white, fontSize: FONTS.sizes.sm, fontWeight: '700', marginBottom: 2 },
  videoDesc: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, lineHeight: 16 },
  youtubeTag: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  youtubeTagText: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },

  // Government
  govCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  govCardUrgent: { borderColor: 'rgba(255,152,0,0.4)', backgroundColor: 'rgba(255,152,0,0.06)' },
  urgentBadge: { backgroundColor: 'rgba(255,152,0,0.15)', borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: SPACING.sm },
  urgentText: { color: '#ffb74d', fontSize: FONTS.sizes.xs, fontWeight: '700' },
  govCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, marginBottom: SPACING.md },
  govIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  govTitle: { color: COLORS.white, fontSize: FONTS.sizes.md, fontWeight: '700', marginBottom: 2 },
  govTitleTe: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  govContent: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, lineHeight: 20, marginBottom: SPACING.md },
  govFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: SPACING.sm },
  govSource: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  govDate: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },

  // Gallery
  gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  galleryItem: { width: '47%', height: 120, borderRadius: RADIUS.md, overflow: 'hidden' },
  galleryItemWide: { width: '100%', height: 160 },
  galleryImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  galleryOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: SPACING.sm },
  galleryTitle: { color: COLORS.white, fontSize: FONTS.sizes.xs, fontWeight: '700' },

  // Weather
  wLoadingWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: SPACING.md },
  wLoadingText: { color: COLORS.textMuted, fontSize: FONTS.sizes.md },
  wMainCard: { borderRadius: RADIUS.xl, padding: SPACING.xxl, alignItems: 'center', gap: SPACING.sm, borderWidth: 1, borderColor: 'rgba(45,134,83,0.2)', marginBottom: SPACING.md },
  wIcon: { fontSize: 56 },
  wTemp: { color: COLORS.white, fontSize: 52, fontWeight: '800' },
  wLabel: { color: COLORS.textSecondary, fontSize: FONTS.sizes.lg, fontWeight: '600' },
  wStats: { flexDirection: 'row', gap: SPACING.xl, marginTop: SPACING.sm },
  wStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  wStatText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },
  rainAlert: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.md, backgroundColor: 'rgba(255,152,0,0.1)', borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: 'rgba(255,152,0,0.3)', marginBottom: SPACING.md },
  rainAlertTitle: { color: '#ffb74d', fontSize: FONTS.sizes.md, fontWeight: '700', marginBottom: 2 },
  rainAlertBody: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, lineHeight: 18 },
  forecastRow: { gap: SPACING.sm, paddingBottom: SPACING.md },
  forecastCard: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.lg, padding: SPACING.md, minWidth: 70, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', gap: 4 },
  forecastCardRainy: { backgroundColor: 'rgba(100,181,246,0.1)', borderColor: 'rgba(100,181,246,0.2)' },
  forecastDay: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, fontWeight: '600' },
  forecastIcon: { fontSize: 24 },
  forecastMax: { color: COLORS.white, fontSize: FONTS.sizes.md, fontWeight: '700' },
  forecastMin: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  forecastRain: { color: '#64b5f6', fontSize: FONTS.sizes.xs },
  wNote: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.md },
  wNoteText: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
});
