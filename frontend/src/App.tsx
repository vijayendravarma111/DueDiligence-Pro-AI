import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ConfigProvider, theme, message } from 'antd';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import RiskAnalysis from './pages/RiskAnalysis';
import InvestmentAnalysis from './pages/InvestmentAnalysis';
import AIAssistant from './pages/AIAssistant';
import Reports from './pages/Reports';
import Login from './pages/Login';
import Register from './pages/Register';
import Settings from './pages/Settings';
import api from './api';

// Create App Context for Auth & Tenants
interface AppContextType {
  token: string | null;
  user: any | null;
  company: any | null;
  selectedDocId: number | null;
  companies: any[];
  setToken: (token: string | null) => void;
  setUser: (user: any | null) => void;
  setCompany: (company: any | null) => void;
  setSelectedDocId: (id: number | null) => void;
  fetchCompanies: () => Promise<void>;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const UseApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUserState] = useState<any | null>(JSON.parse(localStorage.getItem('user') || 'null'));
  const [company, setCompanyState] = useState<any | null>(JSON.parse(localStorage.getItem('company') || 'null'));
  const [selectedDocId, setSelectedDocIdState] = useState<number | null>(
    localStorage.getItem('selectedDocId') ? Number(localStorage.getItem('selectedDocId')) : null
  );
  const [companies, setCompanies] = useState<any[]>([]);

  const setToken = (tok: string | null) => {
    if (tok) localStorage.setItem('token', tok);
    else localStorage.removeItem('token');
    setTokenState(tok);
  };

  const setUser = (usr: any | null) => {
    if (usr) localStorage.setItem('user', JSON.stringify(usr));
    else localStorage.removeItem('user');
    setUserState(usr);
  };

  const setCompany = (comp: any | null) => {
    if (comp) localStorage.setItem('company', JSON.stringify(comp));
    else localStorage.removeItem('company');
    setCompanyState(comp);
  };

  const setSelectedDocId = (id: number | null) => {
    if (id) localStorage.setItem('selectedDocId', String(id));
    else localStorage.removeItem('selectedDocId');
    setSelectedDocIdState(id);
  };

  const fetchCompanies = async () => {
    if (!token) return;
    try {
      const res = await api.get('/companies/');
      setCompanies(res.data);
      if (res.data.length > 0 && !company) {
        // Auto select first company
        setCompany(res.data[0]);
      }
    } catch (e) {
      console.error('Failed to load companies', e);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setCompany(null);
    setSelectedDocId(null);
    setCompanies([]);
    message.success('Successfully logged out.');
  };

  useEffect(() => {
    if (token) {
      fetchCompanies();
    }
  }, [token]);

  return (
    <AppContext.Provider
      value={{
        token,
        user,
        company,
        selectedDocId,
        companies,
        setToken,
        setUser,
        setCompany,
        setSelectedDocId,
        fetchCompanies,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// Route Guard for authenticated paths
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = UseApp();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#3B82F6',
          colorBgBase: '#0F172A',
          colorBgContainer: '#111827',
          colorBorder: '#334155',
          fontFamily: "'Inter', sans-serif",
          borderRadius: 8,
        },
      }}
    >
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/upload" element={<Upload />} />
                      <Route path="/risk" element={<RiskAnalysis />} />
                      <Route path="/investment" element={<InvestmentAnalysis />} />
                      <Route path="/chat" element={<AIAssistant />} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </ConfigProvider>
  );
};

export default App;
