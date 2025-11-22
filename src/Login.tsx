import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/login/', { username, password });
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch (error) {
      alert('Login Failed: Check credentials');
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-blue-50">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-800">Agent Login</h2>
        <input className="w-full p-3 border rounded mb-4" placeholder="Username" onChange={e=>setUsername(e.target.value)} />
        <input className="w-full p-3 border rounded mb-6" type="password" placeholder="Password" onChange={e=>setPassword(e.target.value)} />
        <button className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700">Sign In</button>
      </form>
    </div>
  );
};
export default Login;