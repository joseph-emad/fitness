import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/';

const api = axios.create({
    baseURL:API_URL
});

api.interceptors.request.use((config) => {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');
    
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (userId) {
        config.headers['X-User-ID'] = userId;
    }
    return config;
}
);


export const getActivities = (traineeId) => api.get('/activities', { params: traineeId ? { traineeId } : undefined });
export const addActivity = (activity) => api.post('/activities', activity);
export const getActivityDetail = (id, traineeId) => api.get(`/activities/${id}`, { params: traineeId ? { traineeId } : undefined });
export const getActivityRecommendation = (id, traineeId) => api.get(`/recommendations/activity/${id}`, { params: traineeId ? { traineeId } : undefined });

export const getProfile = (userId) => api.get(`/users/${userId}`);
export const chooseRole = (role) => api.put('/users/me/role', { role });
export const getCoaches = () => api.get('/users/coaches');
export const sendTrainingRequest = (coachId, message) => api.post('/training-requests', { coachId, message });
export const getSentRequests = () => api.get('/training-requests/sent');
export const getReceivedRequests = () => api.get('/training-requests/received');
export const acceptRequest = (id) => api.put(`/training-requests/${id}/accept`);
export const declineRequest = (id) => api.put(`/training-requests/${id}/decline`);
export const cancelRequest = (id) => api.put(`/training-requests/${id}/cancel`);