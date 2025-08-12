import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Import configurations
import { testConnection } from './config/supabase.js';
import { config } from './config/config.js';

// Import Financial routes
import clientesRoutes from './routes/clientes.js';
import invoicesRoutes from './routes/invoices.js';
import transactionsRoutes from './routes/transactions.js';
import platformRoutes from './routes/platform.js';
import dashboardRoutes from './routes/dashboard.js';
import queriesRoutes from './routes/queries.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = config.server.port;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
    origin: '*',
    credentials: true
}));

// Serve static files from frontend directory
app.use('/frontend', express.static(path.join(__dirname, '../frontend')));

// Financial API Routes
app.use('/api/clientes', clientesRoutes);
app.use('/api/invoices', invoicesRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/platform', platformRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/queries', queriesRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'SQLFinance API funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

// Serve the financial HTML file for all other routes (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/financial.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Error interno del servidor',
        message: err.message
    });
});

// Start server
app.listen(PORT, async () => {
    console.log(`SQLFinance corriendo en http://localhost:${PORT}`);
    
    try {
        await testConnection();
        console.log('Base de datos conectada');
    } catch (error) {
        console.error('Error en base de datos:', error.message);
    }
});
