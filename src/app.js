import Leads from './components/AllLeads';
import Campaigns from './components/Campaigns';
import Navbar from './components/Navbar';
import CampaignDetailsPage from './components/CampaignDetailsPage';
import AddCampaignPage from './components/AddCampaignPage';
import LoginSignup from './components/LoginSignup';
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
} from 'react-router-dom';
import './index.css';
import React from 'react';
import { useState } from 'react';


export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    setIsAuthenticated(false);
    navigate('/');
  };

  if (!isAuthenticated) {
    return <LoginSignup onAuth={() => { setIsAuthenticated(true); navigate('/leads'); }} />;
  }

  return (
    <div>
      <Navbar onLogout={handleLogout} />
      <Routes>
        <Route path="/leads" element={<Leads />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/campaigns/new" element={<AddCampaignPage />} />
        <Route path="/campaigns/:campaignId" element={<CampaignDetailsPage />} />
        <Route path="*" element={<Navigate to="/leads" />} />
      </Routes>
    </div>
  );
}