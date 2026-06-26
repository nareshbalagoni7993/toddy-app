import React, { createContext, useState, useCallback, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PRODUCTS, SHOP_INFO, ADMIN_REGISTRY } from '../constants/data';

export const AppContext = createContext({});

// Admin phones — must match ADMIN_REGISTRY phones
export const ADMIN_PHONES = ADMIN_REGISTRY.map((a) => a.phone);

export function generateOrderId() {
  const now = new Date();
  const d = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const r = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TC-${d}-${r}`;
}

async function scheduleNotif(title, body, data = {}) {
  try {
    const Notif = require('expo-notifications');
    await Notif.scheduleNotificationAsync({
      content: { title, body, data },
      trigger: { seconds: 1 },
    });
  } catch {}
}

function statusLabel(s) {
  const map = {
    placed: 'Order Placed',
    accepted: 'Accepted',
    preparing: 'Preparing',
    ready: 'Ready for Pickup/Delivery',
    out_for_delivery: 'Out For Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  return map[s] || s;
}

export function AppProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('user');
  const [products, setProducts] = useState(PRODUCTS);
  const [morningStock, setMorningStock] = useState(50);
  const [eveningStock, setEveningStock] = useState(40);
  const [selectedAdmin, setSelectedAdminState] = useState(null);
  const [shopLocation, setShopLocationState] = useState({
    latitude: SHOP_INFO.latitude,
    longitude: SHOP_INFO.longitude,
    address: SHOP_INFO.address,
    name: SHOP_INFO.name,
  });
  const [notifications, setNotifications] = useState([]);
  const [favorites, setFavorites] = useState([]);

  // ── Setup & Restore ─────────────────────────────────────────────────────────
  useEffect(() => {
    restore();
    setupNotifHandler();
  }, []);

  const setupNotifHandler = async () => {
    try {
      const Notif = require('expo-notifications');
      const { status } = await Notif.requestPermissionsAsync();
      if (status === 'granted') {
        Notif.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
          }),
        });
      }
    } catch {}
  };

  const restore = async () => {
    try {
      const keys = [
        'tc_orders', 'tc_user', 'tc_role', 'tc_stock', 'tc_products',
        'tc_shop', 'tc_notifs', 'tc_favorites', 'tc_selected_admin',
      ];
      const results = await AsyncStorage.multiGet(keys);
      const map = Object.fromEntries(results.map(([k, v]) => [k, v]));

      if (map.tc_orders) setOrders(JSON.parse(map.tc_orders));
      if (map.tc_user) setUser(JSON.parse(map.tc_user));
      if (map.tc_role) setRole(map.tc_role);
      if (map.tc_stock) {
        const s = JSON.parse(map.tc_stock);
        if (s.morning !== undefined) setMorningStock(s.morning);
        if (s.evening !== undefined) setEveningStock(s.evening);
      }
      if (map.tc_products) setProducts(JSON.parse(map.tc_products));
      if (map.tc_notifs) setNotifications(JSON.parse(map.tc_notifs));
      if (map.tc_favorites) setFavorites(JSON.parse(map.tc_favorites));

      if (map.tc_selected_admin) {
        const admin = JSON.parse(map.tc_selected_admin);
        setSelectedAdminState(admin);
        setShopLocationState({
          latitude: admin.latitude,
          longitude: admin.longitude,
          address: admin.address,
          name: admin.shopName,
        });
      } else if (map.tc_shop) {
        setShopLocationState(JSON.parse(map.tc_shop));
      }
    } catch {}
  };

  // ── Admin Selection ──────────────────────────────────────────────────────────
  const selectAdmin = useCallback(async (adminId) => {
    const admin = ADMIN_REGISTRY.find((a) => a.id === adminId || a.phone === adminId);
    if (!admin) return;
    setSelectedAdminState(admin);
    const shopLoc = {
      latitude: admin.latitude,
      longitude: admin.longitude,
      address: admin.address,
      name: admin.shopName,
    };
    setShopLocationState(shopLoc);
    await AsyncStorage.multiSet([
      ['tc_selected_admin', JSON.stringify(admin)],
      ['tc_shop', JSON.stringify(shopLoc)],
    ]);
  }, []);

  const clearSelectedAdmin = useCallback(async () => {
    setSelectedAdminState(null);
    await AsyncStorage.removeItem('tc_selected_admin');
  }, []);

  // ── Cart ────────────────────────────────────────────────────────────────────
  const addToCart = useCallback((product) => {
    setCart((prev) => {
      const ex = prev.find((i) => i.id === product.id);
      if (ex) return prev.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...product, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((id) => setCart((p) => p.filter((i) => i.id !== id)), []);

  const updateQuantity = useCallback((id, qty) => {
    if (qty <= 0) setCart((p) => p.filter((i) => i.id !== id));
    else setCart((p) => p.map((i) => i.id === id ? { ...i, quantity: qty } : i));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  // ── Orders ──────────────────────────────────────────────────────────────────
  const placeOrder = useCallback(async (details) => {
    const order = {
      id: generateOrderId(),
      items: [...cart],
      status: 'placed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusHistory: [{ status: 'placed', time: new Date().toISOString(), label: 'Order Placed' }],
      customer: { phone: user?.phone || 'Guest', name: user?.name || 'Customer' },
      adminId: selectedAdmin?.phone || null,
      adminName: selectedAdmin?.shopName || null,
      ...details,
    };

    // Update orders using functional update (avoids stale closure)
    setOrders((prev) => {
      const updated = [order, ...prev];
      AsyncStorage.setItem('tc_orders', JSON.stringify(updated)).catch(() => {});
      return updated;
    });

    // Auto-decrease toddy stock — two independent setters, no nesting
    const toddyQty = cart
      .filter((i) => i.category === 'toddy')
      .reduce((s, i) => s + i.quantity, 0);

    if (toddyQty > 0) {
      const isMorning = new Date().getHours() < 12;
      if (isMorning) {
        const newMorning = Math.max(0, morningStock - toddyQty);
        setMorningStock(newMorning);
        AsyncStorage.setItem('tc_stock', JSON.stringify({ morning: newMorning, evening: eveningStock })).catch(() => {});
      } else {
        const newEvening = Math.max(0, eveningStock - toddyQty);
        setEveningStock(newEvening);
        AsyncStorage.setItem('tc_stock', JSON.stringify({ morning: morningStock, evening: newEvening })).catch(() => {});
      }
    }

    clearCart();

    // In-app notification
    const notif = {
      id: Date.now().toString(),
      title: '🍶 Order Placed!',
      body: `${order.id} — Your order is placed. We'll confirm soon.`,
      type: 'order_placed',
      orderId: order.id,
      time: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => {
      const updated = [notif, ...prev];
      AsyncStorage.setItem('tc_notifs', JSON.stringify(updated)).catch(() => {});
      return updated;
    });

    await scheduleNotif(
      '🍶 Order Placed!',
      `Order ${order.id} confirmed. Estimated: 30–45 min`,
      { orderId: order.id }
    );

    return order;
  }, [cart, user, selectedAdmin, morningStock, eveningStock, clearCart]);

  // Fixed: uses functional updates — no stale closure issues, empty deps array
  const updateOrderStatus = useCallback(async (orderId, newStatus, rejectionReason) => {
    setOrders((prev) => {
      const updated = prev.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          rejectionReason: rejectionReason || o.rejectionReason,
          statusHistory: [
            ...(o.statusHistory || []),
            { status: newStatus, time: new Date().toISOString(), label: statusLabel(newStatus) },
          ],
        };
      });
      AsyncStorage.setItem('tc_orders', JSON.stringify(updated)).catch(() => {});
      return updated;
    });

    const msgs = {
      accepted: 'Your order has been accepted! 🎉 Preparing soon.',
      preparing: 'Your toddy is being prepared now 🍶',
      ready: 'Order is ready for pickup / out for delivery!',
      out_for_delivery: 'Your order is on the way 🛵',
      delivered: 'Order delivered! Enjoy your toddy 🍶',
      cancelled: rejectionReason
        ? `Your order was cancelled. Reason: ${rejectionReason}`
        : 'Your order has been cancelled.',
    };

    if (msgs[newStatus]) {
      const notif = {
        id: Date.now().toString(),
        title: newStatus === 'cancelled' ? '❌ Order Cancelled' : '🍶 Order Update',
        body: msgs[newStatus],
        type: `order_${newStatus}`,
        orderId,
        time: new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => {
        const updated = [notif, ...prev];
        AsyncStorage.setItem('tc_notifs', JSON.stringify(updated)).catch(() => {});
        return updated;
      });
      await scheduleNotif(notif.title, msgs[newStatus], { orderId });
    }
  }, []); // Empty deps — functional updates make this closure-safe

  // ── Auth ────────────────────────────────────────────────────────────────────
  const loginUser = useCallback(async (phone) => {
    const adminProfile = ADMIN_REGISTRY.find((a) => a.phone === phone.trim());
    const isAdmin = !!adminProfile;
    const r = isAdmin ? 'admin' : 'user';
    const u = {
      phone,
      name: isAdmin ? adminProfile.ownerName : 'Customer',
      role: r,
      adminId: isAdmin ? adminProfile.id : null,
      shopName: isAdmin ? adminProfile.shopName : null,
    };
    setUser(u);
    setRole(r);
    if (isAdmin) {
      // Sync shop location when admin logs in
      setShopLocationState({
        latitude: adminProfile.latitude,
        longitude: adminProfile.longitude,
        address: adminProfile.address,
        name: adminProfile.shopName,
      });
    }
    await AsyncStorage.setItem('tc_user', JSON.stringify(u));
    await AsyncStorage.setItem('tc_role', r);
    return r;
  }, []);

  const logoutUser = useCallback(async () => {
    setUser(null);
    setRole('user');
    setCart([]);
    setSelectedAdminState(null);
    setNotifications([]);
    await AsyncStorage.multiRemove(['tc_user', 'tc_role', 'tc_selected_admin', 'tc_notifs']);
  }, []);

  // ── Favorites ───────────────────────────────────────────────────────────────
  const toggleFavorite = useCallback(async (productId) => {
    setFavorites((prev) => {
      const updated = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
      AsyncStorage.setItem('tc_favorites', JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const isFavorite = useCallback((productId) => favorites.includes(productId), [favorites]);

  const getFavoriteProducts = useCallback(
    () => products.filter((p) => favorites.includes(p.id)),
    [products, favorites]
  );

  // ── Stock ───────────────────────────────────────────────────────────────────
  const updateStock = useCallback(async (morning, evening) => {
    setMorningStock(morning);
    setEveningStock(evening);
    await AsyncStorage.setItem('tc_stock', JSON.stringify({ morning, evening }));
  }, []);

  // ── Products ────────────────────────────────────────────────────────────────
  const updateProducts = useCallback(async (prods) => {
    setProducts(prods);
    await AsyncStorage.setItem('tc_products', JSON.stringify(prods));
  }, []);

  const setShopLocation = useCallback(async (loc) => {
    setShopLocationState(loc);
    await AsyncStorage.setItem('tc_shop', JSON.stringify(loc));
  }, []);

  // ── Notifications ───────────────────────────────────────────────────────────
  const markRead = useCallback(async (id) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => n.id === id ? { ...n, read: true } : n);
      AsyncStorage.setItem('tc_notifs', JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      AsyncStorage.setItem('tc_notifs', JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  // ── Analytics ───────────────────────────────────────────────────────────────
  // Returns orders visible to the currently logged-in admin
  const getAdminOrders = useCallback(() => {
    if (role !== 'admin' || !user) return [];
    // Show orders placed with this admin, or orders with no adminId (legacy)
    return orders.filter((o) => !o.adminId || o.adminId === user.phone);
  }, [orders, role, user]);

  const getTodayOrders = useCallback(() => {
    const today = new Date().toDateString();
    const src = role === 'admin' ? getAdminOrders() : orders;
    return src.filter((o) => new Date(o.createdAt).toDateString() === today);
  }, [orders, role, getAdminOrders]);

  const getOrdersByStatus = useCallback(
    (s) => {
      const src = role === 'admin' ? getAdminOrders() : orders;
      return src.filter((o) => o.status === s);
    },
    [orders, role, getAdminOrders]
  );

  const getTodayRevenue = useCallback(
    () => getTodayOrders()
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.total || 0), 0),
    [getTodayOrders]
  );

  const getWeeklyRevenue = useCallback(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const src = role === 'admin' ? getAdminOrders() : orders;
    return src
      .filter((o) => new Date(o.createdAt) >= weekAgo && o.status !== 'cancelled')
      .reduce((s, o) => s + (o.total || 0), 0);
  }, [orders, role, getAdminOrders]);

  const getMonthlyRevenue = useCallback(() => {
    const now = new Date();
    const src = role === 'admin' ? getAdminOrders() : orders;
    return src
      .filter((o) => {
        const d = new Date(o.createdAt);
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear() &&
          o.status !== 'cancelled'
        );
      })
      .reduce((s, o) => s + (o.total || 0), 0);
  }, [orders, role, getAdminOrders]);

  const getTotalBottlesSold = useCallback(() => {
    const src = role === 'admin' ? getAdminOrders() : orders;
    return src
      .filter((o) => o.status === 'delivered')
      .flatMap((o) => o.items)
      .filter((i) => i.category === 'toddy')
      .reduce((s, i) => s + i.quantity, 0);
  }, [orders, role, getAdminOrders]);

  const getBestSellers = useCallback(() => {
    const src = role === 'admin' ? getAdminOrders() : orders;
    const counts = {};
    src
      .filter((o) => o.status === 'delivered')
      .flatMap((o) => o.items)
      .forEach((item) => {
        counts[item.id] = (counts[item.id] || 0) + item.quantity;
      });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id, qty]) => ({
        product: products.find((p) => p.id === id),
        soldQty: qty,
      }))
      .filter((x) => x.product);
  }, [orders, products, role, getAdminOrders]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AppContext.Provider value={{
      // State
      cart, orders, user, role, products, morningStock, eveningStock,
      shopLocation, notifications, unreadCount, cartTotal,
      favorites, selectedAdmin,
      // Admin registry
      adminRegistry: ADMIN_REGISTRY,
      // Cart actions
      addToCart, removeFromCart, updateQuantity, clearCart,
      // Order actions
      placeOrder, updateOrderStatus,
      // Auth
      loginUser, logoutUser,
      // Admin selection
      selectAdmin, clearSelectedAdmin,
      // Favorites
      isFavorite, toggleFavorite, getFavoriteProducts,
      // Stock & products
      updateStock, updateProducts, setShopLocation,
      // Notifications
      markRead, markAllRead,
      // Analytics
      getAdminOrders,
      getTodayOrders, getOrdersByStatus, getTodayRevenue,
      getWeeklyRevenue, getMonthlyRevenue, getTotalBottlesSold,
      getBestSellers,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
