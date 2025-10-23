import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { apiRequest } = useAuth();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        
  // Verwende den zentralen API-Helper aus dem AuthContext für korrekte Base-URL und Token-Header
  const res = await apiRequest('/api/categories', { method: 'GET' });
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        
        // Robuste Datenvalidierung
        if (data && data.success && Array.isArray(data.data)) {
          setCategories(data.data);
          console.log('Categories loaded successfully:', data.data);
        } else {
          console.warn('Invalid categories data structure:', data);
          setCategories([]);
        }
        
      } catch (err) {
        console.error('Failed to load categories:', err);
        setError(err.message);
        // Sicherstellen, dass categories immer ein Array ist
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [apiRequest]);

  // Immer ein Array zurückgeben, auch bei Fehlern
  return {
    categories: Array.isArray(categories) ? categories : [],
    loading,
    error
  };
};

export default useCategories;

