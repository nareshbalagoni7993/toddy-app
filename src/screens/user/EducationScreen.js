import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { EDUCATIONAL_CONTENT, GALLERY_ITEMS } from '../../constants/data';

export default function EducationScreen({ navigation }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <LinearGradient colors={['#0d1f14', '#1a4a2e']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>📚 Learn About Toddy</Text>
          <Text style={styles.headerSubtitle}>Traditional knowledge, culture & benefits</Text>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Articles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Articles</Text>
          {EDUCATIONAL_CONTENT.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.articleCard}
              onPress={() => setExpanded(expanded === item.id ? null : item.id)}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['rgba(45,134,83,0.15)', 'rgba(26,74,46,0.08)']}
                style={styles.articleGradient}
              >
                <View style={styles.articleHeader}>
                  <View style={styles.articleIconWrap}>
                    <Ionicons name={item.icon} size={24} color={COLORS.primaryLight} />
                  </View>
                  <View style={styles.articleTitles}>
                    <Text style={styles.articleTitle}>{item.title}</Text>
                    <Text style={styles.articleTitleTelugu}>{item.titleTelugi}</Text>
                  </View>
                  <Ionicons
                    name={expanded === item.id ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={COLORS.textMuted}
                  />
                </View>
                {expanded === item.id && (
                  <Text style={styles.articleContent}>{item.content}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Gallery */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gallery</Text>
          <View style={styles.gallery}>
            {GALLERY_ITEMS.map((item) => (
              <View key={item.id} style={styles.galleryItem}>
                <View style={styles.galleryImageWrap}>
                  <Text style={styles.galleryEmoji}>🌴</Text>
                </View>
                <Text style={styles.galleryTitle} numberOfLines={1}>{item.title}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingTop: 54, paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xl,
  },
  backBtn: { padding: 4 },
  headerTitle: { color: COLORS.white, fontSize: FONTS.sizes.xl, fontWeight: '800' },
  headerSubtitle: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, marginTop: 2 },
  section: { padding: SPACING.xl },
  sectionTitle: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: '700', marginBottom: SPACING.md },
  articleCard: {
    marginBottom: SPACING.md, borderRadius: RADIUS.xl, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(45,134,83,0.2)',
  },
  articleGradient: { padding: SPACING.lg },
  articleHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  articleIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(45,134,83,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  articleTitles: { flex: 1 },
  articleTitle: { color: COLORS.white, fontSize: FONTS.sizes.md, fontWeight: '700' },
  articleTitleTelugu: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 2 },
  articleContent: {
    color: COLORS.textSecondary, fontSize: FONTS.sizes.md,
    lineHeight: 22, marginTop: SPACING.md,
  },
  gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  galleryItem: { width: '47%' },
  galleryImageWrap: {
    height: 120, borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(45,134,83,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(45,134,83,0.2)', marginBottom: SPACING.xs,
  },
  galleryEmoji: { fontSize: 50 },
  galleryTitle: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, fontWeight: '600' },
});
