import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme, message } from 'antd';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import DocumentDetails from './pages/DocumentDetails';
import AIQuestionAnswer from './pages/AIQuestionAnswer';
import ExecutiveSummary from './pages/ExecutiveSummary';
import RiskAnalysis from './pages/RiskAnalysis';
import InvestmentAnalysis from './pages/InvestmentAnalysis';
import Login from './pages/Login';
import Register from './pages/Register';
import { User } from './types';

interface AuthContextType {
  token: string | null;
  user: User | null;
  setAuth: (token: string | null, user: User | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUserState] = useState<User | null>(
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null
  );

  const setAuth = (tok: string | null, usr: User | null) => {
    if (tok && usr) {
      localStorage.setItem('token', tok);
      localStorage.setItem('user', JSON.stringify(usr));
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    setTokenState(tok);
    setUserState(usr);
  };

  const logout = () => {
    setAuth(null, null);
    message.success('Signed out successfully.');
  };

  return (
    <AuthContext.Provider value={{ token, user, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
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
          colorBgContainer: '#1E293B',
          colorBorder: '#334155',
          fontFamily: "'Inter', system-ui, sans-serif",
          borderRadius: 8,
        },
      }}
    >
      <AuthProvider>
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
                      <Route path="/documents/:id" element={<DocumentDetails />} />
                      <Route path="/qa" element={<AIQuestionAnswer />} />
                      <Route path="/summary" element={<ExecutiveSummary />} />
                      <Route path="/risk" element={<RiskAnalysis />} />
                      <Route path="/investment" element={<InvestmentAnalysis />} />
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
};

export default App;
