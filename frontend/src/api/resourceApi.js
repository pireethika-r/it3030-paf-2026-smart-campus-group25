import axios from 'axios'
import { resolveApiBase } from '../utils/apiUrl.js'

const API_BASE_URL = `${resolveApiBase()}/api/resources`

const resourceApi = {
    // Get all resources for the main list
    getAllResources: () => axios.get(`${API_BASE_URL}/all`),

    // NEW: Get a single resource by ID (Required for the Manage/Edit page)
    // Matches your Backend @GetMapping("/{id}")
    getResourceById: (id) => axios.get(`${API_BASE_URL}/${id}`),

    // Search and Filter (Matches your Backend @RequestParam)
    searchResources: (params) => axios.get(`${API_BASE_URL}/search`, { params }),

    // Add a new Lab or Equipment
    // Renamed to 'createResource' to match our AddResourcePage.jsx logic
    createResource: (data) => axios.post(`${API_BASE_URL}/add`, data),

    // Update existing resource
    // Matches your Backend @PutMapping("/{id}")
    updateResource: (id, data) => axios.put(`${API_BASE_URL}/${id}`, data),

    // Delete resource
    // Matches your Backend @DeleteMapping("/{id}")
    deleteResource: (id) => axios.delete(`${API_BASE_URL}/${id}`)
};

export default resourceApi;