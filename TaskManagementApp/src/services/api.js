import axios from 'axios';

// Replace with your local machine's IP address when running on a physical device, 
// or 10.0.2.2 for Android Emulator, or localhost for iOS Simulator
const API_URL = 'https://task-managememt-app.onrender.com/api'; 

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const loginUser = async (username, password) => {
  try {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.error || 'Login failed');
    }
    throw new Error('Network error. Is the server running?');
  }
};

export const getTasks = async () => {
    try {
        const response = await api.get('/tasks');
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch tasks');
    }
}

export const createTask = async (taskData) => {
    try {
        const response = await api.post('/tasks', taskData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const updateTaskStatus = async (taskId, status) => {
    try {
        // Will implement PUT /tasks/:id endpoint in backend
        const response = await api.put(`/tasks/${taskId}`, { status });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const updateTask = async (id, taskData) => {
    try {
        const response = await api.put(`/tasks/${id}`, taskData);
        return response.data;
    } catch (error) {
         throw new Error('Failed to update task');
    }
}

export const deleteTask = async (id) => {
    try {
        const response = await api.delete(`/tasks/${id}`);
        return response.data;
    } catch (error) {
         throw new Error('Failed to delete task');
    }
}


export default api;
