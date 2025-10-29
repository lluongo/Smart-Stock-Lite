import { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe usarse dentro de AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [stockData, setStockData] = useState([]);
  const [participacionData, setParticipacionData] = useState([]);
  const [prioridadData, setPrioridadData] = useState([]);
  const [distributionData, setDistributionData] = useState([]);
  const [distributionFileData, setDistributionFileData] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = (email, password) => {
    // Simulación de login - en producción esto sería una llamada a API
    if (email && password) {
      setUser({ name: email.split('@')[0], email });
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setStockData([]);
    setParticipacionData([]);
    setPrioridadData([]);
    setDistributionData([]);
    setDistributionFileData([]);
  };

  const value = {
    user,
    isAuthenticated,
    stockData,
    participacionData,
    prioridadData,
    distributionData,
    distributionFileData,
    setStockData,
    setParticipacionData,
    setPrioridadData,
    setDistributionData,
    setDistributionFileData,
    login,
    logout,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
