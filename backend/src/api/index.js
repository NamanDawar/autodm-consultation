import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:4000/api',
});

// Auto-attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth
export const signup = (data) => API.post('/auth/signup', data);
export const login = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');
export const updateProfile = (data) => API.put('/auth/profile', data);

// Services
export const getServices = () => API.get('/services');
export const createService = (data) => API.post('/services', data);
export const updateService = (id, data) => API.put(`/services/${id}`, data);
export const deleteService = (id) => API.delete(`/services/${id}`);
export const toggleService = (id) => API.patch(`/services/${id}/toggle`);

// Bookings
export const getBookings = () => API.get('/bookings');
export const getUpcomingBookings = () => API.get('/bookings/upcoming');
export const getBookingStats = () => API.get('/bookings/stats/summary');
export const cancelBooking = (id) => API.patch(`/bookings/${id}/cancel`);

// Calendar
export const setAvailability = (data) => API.post('/calendar/availability', data);
export const getAvailability = (creatorId) => API.get(`/calendar/availability/${creatorId}`);
export const getSlots = (creatorId, serviceId, date) => API.get(`/calendar/slots/${creatorId}/${serviceId}/${date}`);

// Payments
export const createOrder = (data) => API.post('/payments/create-order', data);
export const verifyPayment = (data) => API.post('/payments/verify', data);

// Public
export const getPublicPage = (slug) => API.get(`/public/${slug}`);

// ─── Instagram DM Automation ─────────────────────────────────
// Account
export const connectInstagram   = ()     => API.get('/instagram/connect');
export const getIGAccount       = ()     => API.get('/instagram/account');
export const disconnectInstagram = ()    => API.delete('/instagram/disconnect');

// Stats
export const getIGStats         = ()     => API.get('/instagram/stats');

// Automations
export const getIGAutomations   = ()     => API.get('/instagram/automations');
export const createAutomation   = (data) => API.post('/instagram/automations', data);
export const updateAutomation   = (id, data) => API.put(`/instagram/automations/${id}`, data);
export const toggleAutomation   = (id)   => API.patch(`/instagram/automations/${id}/toggle`);
export const deleteAutomation   = (id)   => API.delete(`/instagram/automations/${id}`);

// Subscribers
export const getIGSubscribers   = ()     => API.get('/instagram/subscribers');

export default API;