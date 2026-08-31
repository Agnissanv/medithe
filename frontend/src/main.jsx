import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { AdminProvider } from './context/AdminContext.jsx';
import { CloserProvider } from './context/CloserContext.jsx';
import 'react-quill/dist/quill.snow.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AdminProvider>
        <CloserProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </CloserProvider>
      </AdminProvider>
    </BrowserRouter>
  </React.StrictMode>
);
