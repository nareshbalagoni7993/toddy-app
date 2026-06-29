import React, { createContext, useState, useCallback, useEffect, useRef, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, ordersAPI, productsAPI, adminAPI, notificationsAPI, shopsAPI } from '../config/api';
import { connectSocket, disconnectSocket, getSocket } from '../config/socket';

export const AppContext = createContext({});

export function AppProvider({ children }) {
  // ── Auth state ──────────────────────────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'super_admin' | 'admin' | 'user' | null
  const [authLoading, setAuthLoading] = useState(true);

  // ── Cart (local — not stored on server) ────────────────────────────────────
  const [cart, setCart] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState(null); // selected shop object

  // ── Data state ──────────────────────────────────────────────────────────────
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [nearbyShops, setNearbyShops] = useState([]);

  // ── Admin dashboard state ───────────────────────────────────────────────────
  const [adminDashboard, setAdminDashboard] = useState(null);
  const [stock, setStock] = useState({ morningStock: 50, eveningStock: 40 });

  const socketRef = useRef(null);

  // ── Restore session on mount ──────────────────────────────────────────────
  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const [token, storedUser, storedCart, storedAdmin] = await Promise.all([
        AsyncStorage.getItem('tc_access_token'),
        AsyncStorage.getItem('tc_user'),
        AsyncStorage.getItem('tc_cart'),
        AsyncStorage.getItem('tc_selected_admin'),
      ]);

      if (token && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setRole(parsedUser.role);

        // Connect Socket.IO with user info
        socketRef.current = connectSocket(parsedUser);
        setupSocketListeners(socketRef.current, parsedUser.role);

        // Load initial data
        await loadInitialData(parsedUser.role);
      }

      if (storedCart) setCart(JSON.parse(storedCart));
      if (storedAdmin) {
        const parsedAdmin = JSON.parse(storedAdmin);
        setSelectedAdmin(parsedAdmin);
        // Pre-load products for the persisted shop
        if (parsedAdmin && (parsedAdmin._id || parsedAdmin.id)) {
          loadProducts(parsedAdmin._id || parsedAdmin.id).catch(() => {});
        }
      }
    } catch (err) {
      console.warn('[AppContext] Session restore error:', err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // ── Socket.IO event listeners ─────────────────────────────────────────────
  function setupSocketListeners(socket, userRole) {
    // Remove previous listeners to avoid duplicates
    socket.off('new_order');
    socket.off('order_updated');
    socket.off('notification');
    socket.off('admin_updated');
    socket.off('account_status_changed');

    // Admin receives new order — update orders list in real-time
    socket.on('new_order', ({ order }) => {
      if (userRole === 'admin' || userRole === 'super_admin') {
        setOrders((prev) => {
          const exists = prev.find((o) => o._id === order._id || o.orderId === order.orderId);
          if (exists) return prev;
          return [order, ...prev];
        });
        // Increment unread notification badge
        setUnreadCount((prev) => prev + 1);
      }
    });

    // User receives order status update — update order in list
    socket.on('order_updated', ({ order }) => {
      setOrders((prev) =>
        prev.map((o) => (o._id === order._id ? { ...o, ...order } : o))
      );
    });

    // Any role receives in-app notification
    socket.on('notification', ({ notification }) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    // Admin profile was updated (for users to get fresh shop data)
    socket.on('admin_updated', () => {
      if (userRole === 'user') loadNearbyShops();
    });

    // Admin receives account status change
    socket.on('account_status_changed', ({ isActive, message }) => {
      if (!isActive) {
        logoutUser();
      }
    });
  }

  // ── Load data by role ─────────────────────────────────────────────────────
  const loadInitialData = async (userRole) => {
    try {
      if (userRole === 'user') {
        await Promise.all([loadOrders(), loadNearbyShops(), loadNotifications()]);
      } else if (userRole === 'admin') {
        await Promise.all([loadOrders(), loadProducts(), loadStock(), loadNotifications()]);
      } else if (userRole === 'super_admin') {
        await loadNotifications();
      }
    } catch (err) {
      console.warn('[AppContext] loadInitialData error:', err.message);
    }
  };

  // ── Auth actions ──────────────────────────────────────────────────────────
  const loginUser = useCallback(async (userData, accessToken, refreshToken) => {
    await AsyncStorage.multiSet([
      ['tc_access_token', accessToken],
      ['tc_refresh_token', refreshToken],
      ['tc_user', JSON.stringify(userData)],
    ]);

    setUser(userData);
    setRole(userData.role);

    // Connect and listen on socket
    const socket = connectSocket(userData);
    socketRef.current = socket;
    setupSocketListeners(socket, userData.role);

    await loadInitialData(userData.role);
  }, []);

  const logoutUser = useCallback(async () => {
    // Disconnect socket
    disconnectSocket();
    socketRef.current = null;

    // Clear all local state
    setUser(null);
    setRole(null);
    setCart([]);
    setOrders([]);
    setProducts([]);
    setNotifications([]);
    setUnreadCount(0);
    setSelectedAdmin(null);
    setAdminDashboard(null);

    await AsyncStorage.multiRemove([
      'tc_access_token', 'tc_refresh_token', 'tc_user',
      'tc_cart', 'tc_selected_admin',
    ]);
  }, []);

  // ── Cart actions (local only) ─────────────────────────────────────────────
  const addToCart = useCallback((product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i._id === product._id || i.id === product.id);
      const updated = existing
        ? prev.map((i) => (i._id === product._id || i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i))
        : [...prev, { ...product, quantity: 1 }];
      AsyncStorage.setItem('tc_cart', JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const removeFromCart = useCallback((id) => {
    setCart((prev) => {
      const updated = prev.filter((i) => i._id !== id && i.id !== id);
      AsyncStorage.setItem('tc_cart', JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const updateQuantity = useCallback((id, qty) => {
    setCart((prev) => {
      const updated = qty <= 0
        ? prev.filter((i) => i._id !== id && i.id !== id)
        : prev.map((i) => (i._id === id || i.id === id ? { ...i, quantity: qty } : i));
      AsyncStorage.setItem('tc_cart', JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    AsyncStorage.removeItem('tc_cart').catch(() => {});
  }, []);

  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  // ── Shop selection ────────────────────────────────────────────────────────
  const selectShop = useCallback(async (shop) => {
    setSelectedAdmin(shop);
    await AsyncStorage.setItem('tc_selected_admin', JSON.stringify(shop));
    // Load products for the newly selected shop
    const adminId = shop._id || shop.id;
    if (adminId) loadProducts(adminId);
  }, [loadProducts]);

  const clearSelectedShop = useCallback(async () => {
    setSelectedAdmin(null);
    await AsyncStorage.removeItem('tc_selected_admin');
  }, []);

  // ── Orders ────────────────────────────────────────────────────────────────
  const loadOrders = useCallback(async (params = {}) => {
    try {
      const { data } = await ordersAPI.getAll(params);
      setOrders(data.data || []);
      return data.data;
    } catch (err) {
      console.warn('[AppContext] loadOrders:', err.message);
      return [];
    }
  }, []);

  const placeOrder = useCallback(async (orderData) => {
    const { data } = await ordersAPI.place({
      ...orderData,
      adminId: selectedAdmin?._id || selectedAdmin?.id,
    });
    const newOrder = data.data;
    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    return newOrder;
  }, [selectedAdmin, clearCart]);

  const updateOrderStatus = useCallback(async (orderId, status, rejectionReason) => {
    const { data } = await ordersAPI.updateStatus(orderId, status, rejectionReason);
    const updatedOrder = data.data;
    setOrders((prev) => prev.map((o) => (o._id === orderId ? updatedOrder : o)));
    return updatedOrder;
  }, []);

  // ── Products ──────────────────────────────────────────────────────────────
  const loadProducts = useCallback(async (adminId) => {
    try {
      const id = adminId || user?.id;
      if (!id) return [];
      const { data } = await productsAPI.getByAdmin(id);
      setProducts(data.data || []);
      return data.data;
    } catch (err) {
      console.warn('[AppContext] loadProducts:', err.message);
      return [];
    }
  }, [user]);

  const createProduct = useCallback(async (productData) => {
    const { data } = await productsAPI.create(productData);
    setProducts((prev) => [data.data, ...prev]);
    return data.data;
  }, []);

  const updateProduct = useCallback(async (id, productData) => {
    const { data } = await productsAPI.update(id, productData);
    setProducts((prev) => prev.map((p) => (p._id === id ? data.data : p)));
    return data.data;
  }, []);

  const toggleProduct = useCallback(async (id) => {
    const { data } = await productsAPI.toggle(id);
    setProducts((prev) => prev.map((p) => (p._id === id ? data.data : p)));
    return data.data;
  }, []);

  const deleteProduct = useCallback(async (id) => {
    await productsAPI.delete(id);
    setProducts((prev) => prev.filter((p) => p._id !== id));
  }, []);

  // ── Nearby Shops ──────────────────────────────────────────────────────────
  const loadNearbyShops = useCallback(async () => {
    try {
      const { data } = await shopsAPI.getNearby();
      setNearbyShops(data.data || []);
      return data.data;
    } catch (err) {
      console.warn('[AppContext] loadNearbyShops:', err.message);
      return [];
    }
  }, []);

  // ── Stock ─────────────────────────────────────────────────────────────────
  const loadStock = useCallback(async () => {
    try {
      const { data } = await adminAPI.getStock();
      setStock(data.data);
      return data.data;
    } catch (err) {
      console.warn('[AppContext] loadStock:', err.message);
    }
  }, []);

  const updateStock = useCallback(async (morning, evening) => {
    const { data } = await adminAPI.updateStock({ morningStock: morning, eveningStock: evening });
    setStock(data.data);
    return data.data;
  }, []);

  // ── Admin Dashboard ───────────────────────────────────────────────────────
  const loadAdminDashboard = useCallback(async () => {
    try {
      const { data } = await adminAPI.getDashboard();
      setAdminDashboard(data.data);
      if (data.data.morningStock !== undefined) {
        setStock({ morningStock: data.data.morningStock, eveningStock: data.data.eveningStock });
      }
      return data.data;
    } catch (err) {
      console.warn('[AppContext] loadAdminDashboard:', err.message);
    }
  }, []);

  // ── Notifications ─────────────────────────────────────────────────────────
  const loadNotifications = useCallback(async () => {
    try {
      const { data } = await notificationsAPI.getAll();
      setNotifications(data.data || []);
      setUnreadCount(data.unreadCount || 0);
      return data.data;
    } catch (err) {
      console.warn('[AppContext] loadNotifications:', err.message);
    }
  }, []);

  const markNotifRead = useCallback(async (id) => {
    await notificationsAPI.markRead(id);
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllNotifsRead = useCallback(async () => {
    await notificationsAPI.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  return (
    <AppContext.Provider value={{
      // Auth
      user, role, authLoading,
      loginUser, logoutUser,

      // Cart
      cart, cartTotal,
      addToCart, removeFromCart, updateQuantity, clearCart,

      // Selected shop
      selectedAdmin,
      selectShop, clearSelectedShop,

      // Orders
      orders,
      loadOrders, placeOrder, updateOrderStatus,

      // Products
      products,
      loadProducts, createProduct, updateProduct, toggleProduct, deleteProduct,

      // Nearby shops
      nearbyShops, loadNearbyShops,

      // Stock
      stock,
      loadStock, updateStock,

      // Admin Dashboard
      adminDashboard, loadAdminDashboard,

      // Notifications
      notifications, unreadCount,
      loadNotifications, markNotifRead, markAllNotifsRead,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
