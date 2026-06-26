import React, { useState, useContext } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { PRODUCTS, CATEGORIES } from '../../constants/data';
import { AppContext } from '../../context/AppContext';
import ProductCard from '../../components/home/ProductCard';

export default function SearchScreen({ navigation }) {
  const { addToCart } = useContext(AppContext);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filtered = PRODUCTS.filter((p) => {
    const q = query.trim().toLowerCase();
    const matchesSearch =
      q === '' ||
      p.name.toLowerCase().includes(q) ||
      (p.nameTelugi && p.nameTelugi.includes(q));
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category chips */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
        style={styles.categoryList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, selectedCategory === item.id && styles.chipActive]}
            onPress={() => setSelectedCategory(item.id)}
          >
            <Ionicons
              name={item.icon}
              size={13}
              color={selectedCategory === item.id ? COLORS.white : COLORS.textMuted}
            />
            <Text style={[styles.chipText, selectedCategory === item.id && styles.chipTextActive]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Results */}
      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyText}>No products found</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.results}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              variant="grid"
              onPress={() => navigation.navigate('ProductDetail', { product: item })}
              onAddToCart={() => addToCart(item)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    paddingTop: 54, paddingHorizontal: SPACING.xl, paddingBottom: SPACING.lg,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: { padding: 4 },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: RADIUS.full, paddingHorizontal: SPACING.lg, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  searchInput: { flex: 1, color: COLORS.white, fontSize: FONTS.sizes.md, padding: 0 },
  categoryList: { maxHeight: 52 },
  categories: { paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, gap: SPACING.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SPACING.md, paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primaryLight },
  chipText: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  chipTextActive: { color: COLORS.white },
  results: { padding: SPACING.xl, paddingTop: SPACING.md },
  row: { gap: SPACING.md, marginBottom: SPACING.md },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md },
  emptyIcon: { fontSize: 60 },
  emptyText: { color: COLORS.textMuted, fontSize: FONTS.sizes.lg },
});
