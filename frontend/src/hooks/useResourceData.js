import { useState, useEffect } from 'react';
import resourceApi from '../api/resourceApi';

export const useResourceData = (id = null) => {
    const [resource, setResource] = useState({
        name: '',
        type: 'LAB',
        location: '',
        capacity: '',
        status: 'ACTIVE',
        availabilityWindows: ''
    });

    const [loading, setLoading] = useState(!!id); // Only load if an ID exists
    const [error, setError] = useState(null);

    useEffect(() => {
        // If there is no ID, we are in "Add" mode, so don't fetch
        if (!id) return;

        const fetchResource = async () => {
            try {
                setLoading(true);
                const response = await resourceApi.getResourceById(id);
                // Ensure the data structure matches our state
                setResource(response.data);
            } catch (err) {
                console.error("Error fetching resource:", err);
                setError("Failed to load resource data.");
            } finally {
                setLoading(false);
            }
        };

        fetchResource();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setResource(prev => ({ ...prev, [name]: value }));
    };

    return { resource, setResource, loading, error, handleChange };
};