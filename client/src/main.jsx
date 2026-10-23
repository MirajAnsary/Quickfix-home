import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './styles/theme.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { AreaProvider } from './context/AreaContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AreaProvider>
          <App />
        </AreaProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
