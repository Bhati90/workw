import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Search, Edit, ArrowLeft,Eye } from 'lucide-react';

const ProfileUpdateSearch = () => {
  const [list, setList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('http://127.0.0.1:8000/api/mukkadam/', {
      headers: { Authorization: `Token ${token}` }
    }).then(res => setList(res.data));
  }, []);

  const filtered = list.filter(item => 
    item.mukkadam_name.toLowerCase().includes(search.toLowerCase()) ||
    item.village.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate('/dashboard')} className="flex items-center text-gray-600 mb-4">
          <ArrowLeft size={20} className="mr-2"/> Back to Dashboard
        </button>
        
        <h1 className="text-2xl font-bold mb-6">Select Profile to Update</h1>
        
        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 text-gray-400" />
          <input 
            className="w-full pl-10 p-3 rounded-lg border shadow-sm" 
            placeholder="Search Name or Village..." 
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          {filtered.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">{item.mukkadam_name}</h3>
                <p className="text-gray-500">{item.village}</p>
              </div>
              <button 
                onClick={() => navigate(`/admin-view/${item.id}`)} // <--- CHANGE THIS LINK
                className="bg-blue-100 text-blue-700 px-4 py-2 rounded flex items-center font-medium hover:bg-blue-200"
                >
                <Eye size={16} className="mr-2"/> View Profile
                </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default ProfileUpdateSearch;