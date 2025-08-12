import express from 'express';
import { db } from '../config/supabase.js';

const router = express.Router();

// GET Get the all general statisdistics
router.get('/stats', async (req, res) => {
    try {
        // General stadistics
        const generalStats = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM clientes) as total_clientes,
                (SELECT COUNT(*) FROM invoices) as total_facturas,
                (SELECT COUNT(*) FROM transactions) as total_transacciones,
                (SELECT COUNT(*) FROM platform) as total_plataformas
        `);

        // sstadístic for invoices 
        const invoiceStats = await db.query(`
            SELECT 
                SUM(invoiced_amount) as total_facturado,
                SUM(amount_paid) as total_pagado,
                AVG(invoiced_amount) as promedio_factura,
                COUNT(CASE WHEN amount_paid = 0 THEN 1 END) as facturas_pendientes,
                COUNT(CASE WHEN amount_paid >= invoiced_amount THEN 1 END) as facturas_pagadas,
                (SUM(invoiced_amount) - SUM(amount_paid)) as total_pendiente
            FROM invoices
        `);

        // sstadístics for trasactions 
        const transactionStats = await db.query(`
            SELECT 
                SUM(amount_transaction) as total_transaccionado,
                AVG(amount_transaction) as promedio_transaccion,
                COUNT(CASE WHEN status_transaction = 'Completada' THEN 1 END) as transacciones_completadas,
                COUNT(CASE WHEN status_transaction = 'Pendiente' THEN 1 END) as transacciones_pendientes,
                COUNT(CASE WHEN status_transaction = 'Fallida' THEN 1 END) as transacciones_fallidas,
                SUM(CASE WHEN status_transaction = 'Completada' THEN amount_transaction ELSE 0 END) as monto_completado,
                SUM(CASE WHEN status_transaction = 'Pendiente' THEN amount_transaction ELSE 0 END) as monto_pendiente
            FROM transactions
        `);

        // stadístics for platform 
        const platformStats = await db.query(`
            SELECT 
                p.platform_name,
                COUNT(DISTINCT c.id) as clientes,
                COUNT(DISTINCT i.invoice_number) as facturas,
                COUNT(DISTINCT t.id_transaction) as transacciones,
                SUM(i.invoiced_amount) as total_facturado,
                SUM(i.amount_paid) as total_pagado,
                SUM(t.amount_transaction) as total_transaccionado
            FROM platform p
            LEFT JOIN clientes c ON p.id = c.id_platform
            LEFT JOIN invoices i ON c.id = i.id_client
            LEFT JOIN transactions t ON c.id = t.id_client
            GROUP BY p.id, p.platform_name
            ORDER BY p.platform_name
        `);

        // Top 5 client for amount invoiced 
        const topClients = await db.query(`
            SELECT 
                c.nombre,
                c.correo,
                p.platform_name,
                SUM(i.invoiced_amount) as total_facturado,
                SUM(i.amount_paid) as total_pagado,
                COUNT(i.invoice_number) as total_facturas
            FROM clientes c
            LEFT JOIN platform p ON c.id_platform = p.id
            LEFT JOIN invoices i ON c.id = i.id_client
            GROUP BY c.id, c.nombre, c.correo, p.platform_name
            ORDER BY total_facturado DESC
            LIMIT 5
        `);

        // Recents invoices THe 10 last one 
        const recentInvoices = await db.query(`
            SELECT 
                i.invoice_number,
                i.billing_period,
                i.invoiced_amount,
                i.amount_paid,
                c.nombre as cliente_nombre,
                p.platform_name
            FROM invoices i
            LEFT JOIN clientes c ON i.id_client = c.id
            LEFT JOIN platform p ON c.id_platform = p.id
            ORDER BY i.created_at DESC
            LIMIT 10
        `);

        // Recent transactions last 10
        const recentTransactions = await db.query(`
            SELECT 
                t.id_transaction,
                t.date_time_transaction,
                t.amount_transaction,
                t.status_transaction,
                t.type_transaction,
                c.nombre as cliente_nombre,
                p.platform_name
            FROM transactions t
            LEFT JOIN clientes c ON t.id_client = c.id
            LEFT JOIN platform p ON c.id_platform = p.id
            ORDER BY t.date_time_transaction DESC
            LIMIT 10
        `);

        res.json({
            success: true,
            data: {
                general: generalStats.rows[0],
                invoices: invoiceStats.rows[0],
                transactions: transactionStats.rows[0],
                platforms: platformStats.rows,
                topClients: topClients.rows,
                recentInvoices: recentInvoices.rows,
                recentTransactions: recentTransactions.rows
            }
        });
    } catch (error) {
        console.error('Error obteniendo estadísticas del dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// GET Get data for a grafics
router.get('/charts', async (req, res) => {
    try {
        // Datos para gráfico de facturas por período
        const invoicesByPeriod = await db.query(`
            SELECT 
                billing_period,
                COUNT(*) as cantidad,
                SUM(invoiced_amount) as total_facturado,
                SUM(amount_paid) as total_pagado
            FROM invoices
            GROUP BY billing_period
            ORDER BY billing_period DESC
            LIMIT 12
        `);

        
        //Data for grafic of trasaction for status
        const transactionsByStatus = await db.query(`
            SELECT 
                status_transaction,
                COUNT(*) as cantidad,
                SUM(amount_transaction) as total_monto
            FROM transactions
            GROUP BY status_transaction
        `);

        
        //Data for grafic of client for platform
        const clientsByPlatform = await db.query(`
            SELECT 
                p.platform_name,
                COUNT(c.id) as cantidad
            FROM platform p
            LEFT JOIN clientes c ON p.id = c.id_platform
            GROUP BY p.id, p.platform_name
        `);

        // Data for transaction charts by month
        const transactionsByMonth = await db.query(`
            SELECT 
                DATE_TRUNC('month', date_time_transaction) as mes,
                COUNT(*) as cantidad,
                SUM(amount_transaction) as total_monto
            FROM transactions
            WHERE date_time_transaction >= NOW() - INTERVAL '12 months'
            GROUP BY DATE_TRUNC('month', date_time_transaction)
            ORDER BY mes DESC
        `);

        res.json({
            success: true,
            data: {
                invoicesByPeriod: invoicesByPeriod.rows,
                transactionsByStatus: transactionsByStatus.rows,
                clientsByPlatform: clientsByPlatform.rows,
                transactionsByMonth: transactionsByMonth.rows
            }
        });
    } catch (error) {
        console.error('Error obteniendo datos para gráficos:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// GET Search general
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'El término de búsqueda debe tener al menos 2 caracteres'
            });
        }

        const searchTerm = `%${q}%`;

        // search in cllient 
        const clientes = await db.query(`
            SELECT 
                c.id,
                c.nombre,
                c.correo,
                c.telefono,
                p.platform_name,
                'cliente' as tipo
            FROM clientes c
            LEFT JOIN platform p ON c.id_platform = p.id
            WHERE c.nombre ILIKE $1 OR c.correo ILIKE $1 OR c.numero_identificacion ILIKE $1
            LIMIT 10
        `, [searchTerm]);

        // Buscar en facturas
        const facturas = await db.query(`
            SELECT 
                i.invoice_number as id,
                i.invoice_number,
                i.billing_period,
                i.invoiced_amount,
                c.nombre as cliente_nombre,
                'factura' as tipo
            FROM invoices i
            LEFT JOIN clientes c ON i.id_client = c.id
            WHERE i.invoice_number ILIKE $1 OR c.nombre ILIKE $1
            LIMIT 10
        `, [searchTerm]);

        // Buscar en transacciones
        const transacciones = await db.query(`
            SELECT 
                t.id_transaction as id,
                t.id_transaction,
                t.amount_transaction,
                t.status_transaction,
                c.nombre as cliente_nombre,
                'transaccion' as tipo
            FROM transactions t
            LEFT JOIN clientes c ON t.id_client = c.id
            WHERE t.id_transaction ILIKE $1 OR c.nombre ILIKE $1
            LIMIT 10
        `, [searchTerm]);

        res.json({
            success: true,
            data: {
                clientes: clientes.rows,
                facturas: facturas.rows,
                transacciones: transacciones.rows
            }
        });
    } catch (error) {
        console.error('Error en búsqueda:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

export default router;
