import { useEffect, useState } from 'react';

const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fallback API URL wenn VITE_API_BASE_URL nicht gesetzt ist
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://217.110.253.198:3001';
        const apiUrl = `${baseUrl}/api/categories`;
        
        console.log('Fetching categories from:', apiUrl);
        
        const res = await fetch(apiUrl);
        
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
  }, []);

  // Immer ein Array zurückgeben, auch bei Fehlern
  return {
    categories: Array.isArray(categories) ? categories : [],
    loading,
    error
  };
};

export default useCategories;

