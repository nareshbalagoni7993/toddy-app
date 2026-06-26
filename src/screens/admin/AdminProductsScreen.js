import React, { useContext, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar,
  Image, Switch, Alert, TextInput, ScrollView, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS } from '../../constants/theme';
import { AppContext } from '../../context/AppContext';
import { CATEGORIES } from '../../constants/data';

const EMPTY_PRODUCT = {
  name: '',
  nameTelugi: '',
  category: 'toddy',
  price: '',
  unit: 'bottle',
  unitSize: '',
  image: '',
  description: '',
  availability: true,
  stock: '',
  rating: 4.5,
  reviews: 0,
  session: 'all',
  isFeatured: false,
  benefits: [],
};

export default function AdminProductsScreen() {
  const { products, updateProducts } = useContext(AppContext);

  const [modalVisible, setModalVisible] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editData, setEditData] = useState(null);

  const openEdit = (product) => {
    setEditData({
      ...product,
      price: String(product.price),
      stock: String(product.stock),
    });
    setIsAdding(false);
    setModalVisible(true);
  };

  const openAdd = () => {
    setEditData({ ...EMPTY_PRODUCT });
    setIsAdding(true);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditData(null);
  };

  const toggleAvailability = (id) => {
    const updated = products.map((p) => p.id === id ? { ...p, availability: !p.availability } : p);
    updateProducts(updated);
  };

  const validateAndSave = () => {
    const price = parseFloat(editData.price);
    const stock = parseInt(editData.stock, 10);

    if (!editData.name.trim()) { Alert.alert('Error', 'Product name is required.'); return; }
    if (isNaN(price) || price < 0) { Alert.alert('Error', 'Enter a valid price.'); return; }
    if (isNaN(stock) || stock < 0) { Alert.alert('Error', 'Enter a valid stock number.'); return; }

    const productData = {
      ...editData,
      price,
      stock,
      images: editData.images || [editData.image],
    };

    if (isAdding) {
      const newProduct = {
        ...productData,
        id: String(Date.now()),
        images: [editData.image || `https://picsum.photos/seed/${editData.name}/600/600`],
        image: editData.image || `https://picsum.photos/seed/${editData.name}/600/600`,
      };
      updateProducts([...products, newProduct]);
      Alert.alert('✓ Added', `${newProduct.name} has been added to the catalog.`);
    } else {
      const updated = products.map((p) => p.id === editData.id ? productData : p);
      updateProducts(updated);
      Alert.alert('✓ Saved', `${editData.name} has been updated.`);
    }
    closeModal();
  };

  const deleteProduct = (product) => {
    Alert.alert(
      'Delete Product',
      `Delete "${product.name}" from the catalog? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updated = products.filter((p) => p.id !== product.id);
            updateProducts(updated);
          },
        },
      ]
    );
  };

  const updateField = (key, value) => {
    setEditData((prev) => ({ ...prev, [key]: value }));
  };

  const renderItem = ({ item }) => (
    <View style={[s.card, !item.availability && s.cardDisabled]}>
      <Image source={{ uri: item.image }} style={s.img} />
      <View style={s.info}>
        <Text style={s.name} numberOfLines={1}>{item.name}</Text>
        <Text style={s.nameTE} numberOfLines={1}>{item.nameTelugi}</Text>
        <View style={s.metaRow}>
          <View style={s.metaBadge}>
            <Text style={s.metaBadgeText}>₹{item.price}/{item.unitSize}</Text>
          </View>
          <View style={[s.metaBadge, {
            backgroundColor: item.stock < 10 ? 'rgba(239,83,80,0.15)' : 'rgba(45,134,83,0.15)',
          }]}>
            <Text style={[s.metaBadgeText, {
              color: item.stock < 10 ? '#ef5350' : COLORS.primaryLight,
            }]}>
              {item.stock < 1 ? '⚠ Out of Stock' : `${item.stock} in stock`}
            </Text>
          </View>
        </View>
      </View>
      <View style={s.controls}>
        <Switch
          value={item.availability}
          onValueChange={() => toggleAvailability(item.id)}
          trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(45,134,83,0.5)' }}
          thumbColor={item.availability ? COLORS.primaryLight : COLORS.textMuted}
        />
        <TouchableOpacity style={s.iconBtn} onPress={() => openEdit(item)} activeOpacity={0.85}>
          <Ionicons name="create-outline" size={18} color={COLORS.accent} />
        </TouchableOpacity>
        <TouchableOpacity style={s.iconBtn} onPress={() => deleteProduct(item)} activeOpacity={0.85}>
          <Ionicons name="trash-outline" size={18} color="#ef5350" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <LinearGradient colors={['#0d1f14', '#142a1c']} style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Product Management</Text>
          <Text style={s.headerSub}>
            {products.filter((p) => p.availability).length} active • {products.length} total
          </Text>
        </View>
        <TouchableOpacity style={s.addProductBtn} onPress={openAdd} activeOpacity={0.85}>
          <Ionicons name="add" size={20} color={COLORS.bgDark} />
          <Text style={s.addProductBtnText}>Add Product</Text>
        </TouchableOpacity>
      </LinearGradient>

      <View style={s.hint}>
        <Ionicons name="information-circle-outline" size={14} color={COLORS.textMuted} />
        <Text style={s.hintText}>Toggle switch to enable/disable. Tap ✏️ to edit, 🗑 to delete.</Text>
      </View>

      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
      />

      {/* ── Add / Edit Modal ──────────────────────────────────────────────────── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={s.modalOverlay}>
          <View style={s.modal}>
            <LinearGradient colors={['#1a3d28', '#0d1f14']} style={s.modalInner}>

              {/* Modal Header */}
              <View style={s.modalHeader}>
                <Text style={s.modalTitle}>{isAdding ? 'Add New Product' : 'Edit Product'}</Text>
                <TouchableOpacity onPress={closeModal}>
                  <Ionicons name="close" size={22} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.modalScroll}>

                {/* Image Preview */}
                {editData?.image ? (
                  <Image source={{ uri: editData.image }} style={s.previewImg} />
                ) : (
                  <View style={s.previewPlaceholder}>
                    <Ionicons name="image-outline" size={36} color={COLORS.textMuted} />
                    <Text style={s.previewPlaceholderText}>No image</Text>
                  </View>
                )}

                <Field label="Image URL" value={editData?.image || ''} onChangeText={(v) => updateField('image', v)} placeholder="https://..." />

                <Field label="Product Name (English)" value={editData?.name || ''} onChangeText={(v) => updateField('name', v)} placeholder="e.g. Fresh Morning Toddy" />

                <Field label="Product Name (Telugu)" value={editData?.nameTelugi || ''} onChangeText={(v) => updateField('nameTelugi', v)} placeholder="e.g. తాజా పొద్దున కల్లు" />

                <Field label="Price (₹)" value={String(editData?.price || '')} onChangeText={(v) => updateField('price', v)} placeholder="e.g. 200" keyboard="decimal-pad" />

                <Field label="Stock Quantity" value={String(editData?.stock || '')} onChangeText={(v) => updateField('stock', v)} placeholder="e.g. 50" keyboard="number-pad" />

                <Field label="Unit Size" value={editData?.unitSize || ''} onChangeText={(v) => updateField('unitSize', v)} placeholder="e.g. 2 Litres, 500g, 1 piece" />

                {/* Category Picker */}
                <Text style={s.fieldLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.catScroll}>
                  {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[s.catChip, editData?.category === cat.id && s.catChipActive]}
                      onPress={() => updateField('category', cat.id)}
                    >
                      <Ionicons name={cat.icon} size={14} color={editData?.category === cat.id ? COLORS.bgDark : COLORS.textMuted} />
                      <Text style={[s.catChipText, editData?.category === cat.id && s.catChipTextActive]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Session Picker */}
                <Text style={s.fieldLabel}>Session</Text>
                <View style={s.sessionRow}>
                  {['all', 'morning', 'evening'].map((sess) => (
                    <TouchableOpacity
                      key={sess}
                      style={[s.sessChip, editData?.session === sess && s.sessChipActive]}
                      onPress={() => updateField('session', sess)}
                    >
                      <Text style={[s.sessChipText, editData?.session === sess && s.sessChipTextActive]}>
                        {sess === 'all' ? '☀️ All Day' : sess === 'morning' ? '🌅 Morning' : '🌇 Evening'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Description */}
                <Field
                  label="Description"
                  value={editData?.description || ''}
                  onChangeText={(v) => updateField('description', v)}
                  placeholder="Brief product description..."
                  multiline
                />

                {/* Featured & Availability Row */}
                <View style={s.toggleRow}>
                  <View style={s.toggleItem}>
                    <Text style={s.fieldLabel}>Featured Product</Text>
                    <Switch
                      value={editData?.isFeatured || false}
                      onValueChange={(v) => updateField('isFeatured', v)}
                      trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(244,200,66,0.5)' }}
                      thumbColor={editData?.isFeatured ? COLORS.accent : COLORS.textMuted}
                    />
                  </View>
                  <View style={s.toggleItem}>
                    <Text style={s.fieldLabel}>Available</Text>
                    <Switch
                      value={editData?.availability !== false}
                      onValueChange={(v) => updateField('availability', v)}
                      trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(45,134,83,0.5)' }}
                      thumbColor={editData?.availability ? COLORS.primaryLight : COLORS.textMuted}
                    />
                  </View>
                </View>

              </ScrollView>

              {/* Save Button */}
              <View style={s.modalBtns}>
                <TouchableOpacity style={s.cancelBtn} onPress={closeModal} activeOpacity={0.85}>
                  <Text style={s.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.saveBtn} onPress={validateAndSave} activeOpacity={0.85}>
                  <LinearGradient colors={['#2d8653', '#1a5c38']} style={s.saveBtnGrad}>
                    <Ionicons name={isAdding ? 'add-circle-outline' : 'checkmark-circle-outline'} size={18} color="#fff" />
                    <Text style={s.saveBtnText}>{isAdding ? 'Add Product' : 'Save Changes'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboard, multiline }) {
  return (
    <View style={s.fieldWrap}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={[s.inputField, multiline && s.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.3)"
        keyboardType={keyboard || 'default'}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  header: {
    paddingTop: 54, paddingBottom: SPACING.lg, paddingHorizontal: SPACING.xl,
    flexDirection: 'row', alignItems: 'center',
  },
  headerTitle: { color: COLORS.white, fontSize: FONTS.sizes.xl, fontWeight: '800' },
  headerSub: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, marginTop: 2 },
  addProductBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.accent, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
  },
  addProductBtnText: { color: COLORS.bgDark, fontSize: FONTS.sizes.sm, fontWeight: '800' },
  hint: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  hintText: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, flex: 1 },
  list: { padding: SPACING.lg, gap: SPACING.sm, paddingBottom: 100 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.lg,
    overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  cardDisabled: { opacity: 0.5 },
  img: { width: 80, height: 80, resizeMode: 'cover', backgroundColor: '#1a3a24' },
  info: { flex: 1, paddingVertical: SPACING.md, gap: 3 },
  name: { color: COLORS.white, fontSize: FONTS.sizes.sm, fontWeight: '700' },
  nameTE: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  metaRow: { flexDirection: 'row', gap: SPACING.xs, marginTop: 4, flexWrap: 'wrap' },
  metaBadge: {
    backgroundColor: 'rgba(244,200,66,0.15)', borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm, paddingVertical: 2,
  },
  metaBadgeText: { color: COLORS.accent, fontSize: FONTS.sizes.xs, fontWeight: '700' },
  controls: {
    flexDirection: 'column', alignItems: 'center', gap: SPACING.sm,
    paddingRight: SPACING.md, paddingVertical: SPACING.sm,
  },
  iconBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modal: { maxHeight: '93%', borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl, overflow: 'hidden' },
  modalInner: { flex: 1, padding: SPACING.xl, paddingBottom: 0 },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: { color: COLORS.white, fontSize: FONTS.sizes.xl, fontWeight: '800' },
  modalScroll: { paddingBottom: SPACING.xl, gap: SPACING.xs },
  previewImg: {
    width: '100%', height: 140, borderRadius: RADIUS.lg,
    backgroundColor: '#1a3a24', marginBottom: SPACING.md,
  },
  previewPlaceholder: {
    height: 100, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: RADIUS.lg,
    alignItems: 'center', justifyContent: 'center', gap: 8,
    marginBottom: SPACING.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
  },
  previewPlaceholderText: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  fieldWrap: { marginBottom: SPACING.sm },
  fieldLabel: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, fontWeight: '600', marginBottom: 6 },
  inputField: {
    backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    color: COLORS.white, fontSize: FONTS.sizes.md,
    paddingHorizontal: SPACING.lg, height: 46,
  },
  inputMultiline: { height: 80, paddingTop: SPACING.sm },
  catScroll: { marginBottom: SPACING.md },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: SPACING.md, paddingVertical: 7, borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', marginRight: SPACING.sm,
  },
  catChipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  catChipText: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, fontWeight: '600' },
  catChipTextActive: { color: COLORS.bgDark },
  sessionRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  sessChip: {
    flex: 1, paddingVertical: SPACING.sm, borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center',
  },
  sessChipActive: { backgroundColor: 'rgba(45,134,83,0.25)', borderColor: 'rgba(45,134,83,0.5)' },
  sessChipText: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, fontWeight: '600' },
  sessChipTextActive: { color: COLORS.primaryLight },
  toggleRow: { flexDirection: 'row', gap: SPACING.xl, marginTop: SPACING.sm },
  toggleItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalBtns: {
    flexDirection: 'row', gap: SPACING.md,
    paddingVertical: SPACING.xl, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
  },
  cancelBtn: {
    flex: 1, paddingVertical: SPACING.lg, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center',
  },
  cancelBtnText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md, fontWeight: '600' },
  saveBtn: { flex: 2, borderRadius: RADIUS.md, overflow: 'hidden' },
  saveBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: SPACING.lg, gap: SPACING.sm,
  },
  saveBtnText: { color: '#fff', fontSize: FONTS.sizes.md, fontWeight: '700' },
});
