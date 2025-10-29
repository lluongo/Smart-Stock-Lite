import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CargarDatos from './pages/CargarDatos';
import Distribucion from './pages/Distribucion';
import Revision from './pages/Revision';
import Configuracion from './pages/Configuracion';

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <Layout>
                <Dashboard />
              </Layout>
            }
          />
          <Route
            path="/cargar"
            element={
              <Layout>
                <CargarDatos />
              </Layout>
            }
          />
          <Route
            path="/distribucion"
            element={
              <Layout>
                <Distribucion />
              </Layout>
            }
          />
          <Route
            path="/revision"
            element={
              <Layout>
                <Revision />
              </Layout>
            }
          />
          <Route
            path="/configuracion"
            element={
              <Layout>
                <Configuracion />
              </Layout>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;
