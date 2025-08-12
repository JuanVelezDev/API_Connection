import express from 'express';
import { db } from '../config/supabase.js';

const router = express.Router();

// GET get all invoices
router.get('/', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT i.*, c.nombre as cliente_nombre, c.correo as cliente_email
            FROM invoices i 
            LEFT JOIN clientes c ON i.id_client = c.id 
            ORDER BY i.billing_period DESC, i.invoice_number
        `);
        
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error obteniendo facturas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// GET get invoices for number 
router.get('/:invoiceNumber', async (req, res) => {
    try {
        const { invoiceNumber } = req.params;
        
        const result = await db.query(`
            SELECT i.*, c.nombre as cliente_nombre, c.correo as cliente_email, c.telefono as cliente_telefono
            FROM invoices i 
            LEFT JOIN clientes c ON i.id_client = c.id 
            WHERE i.invoice_number = $1
        `, [invoiceNumber]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Factura no encontrada'
            });
        }
        
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error obteniendo factura:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// POST create a new invoice
router.post('/', async (req, res) => {
    try {
        const { id_client, billing_period, invoiced_amount, amount_paid } = req.body;
        
        // Validate simple for invoices and factured 
        if (!id_client || !billing_period || !invoiced_amount) {
            return res.status(400).json({
                success: false,
                message: 'Cliente, período de facturación y monto facturado son campos obligatorios'
            });
        }
        
        // Generar número de factura único
        const invoiceNumber = `FAC${Date.now()}`;
        
        const result = await db.query(`
            INSERT INTO invoices (invoice_number, id_client, billing_period, invoiced_amount, amount_paid)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [invoiceNumber, id_client, billing_period, invoiced_amount, amount_paid || 0]);
        
        res.status(201).json({
            success: true,
            message: 'Factura creada exitosamente',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creando factura:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// PUT update invoice 
router.put('/:invoiceNumber', async (req, res) => {
    try {
        const { invoiceNumber } = req.params;
        const { id_client, billing_period, invoiced_amount, amount_paid } = req.body;
        
        const result = await db.query(`
            UPDATE invoices 
            SET id_client = $1, billing_period = $2, invoiced_amount = $3, amount_paid = $4
            WHERE invoice_number = $5
            RETURNING *
        `, [id_client, billing_period, invoiced_amount, amount_paid, invoiceNumber]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Factura no encontrada'
            });
        }
        
        res.json({
            success: true,
            message: 'Factura actualizada exitosamente',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error actualizando factura:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// DELETE Delete invoices 
router.delete('/:invoiceNumber', async (req, res) => {
    try {
        const { invoiceNumber } = req.params;
        
        const result = await db.query('DELETE FROM invoices WHERE invoice_number = $1 RETURNING *', [invoiceNumber]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Factura no encontrada'
            });
        }
        
        res.json({
            success: true,
            message: 'Factura eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error eliminando factura:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// GET get stadistics for invoices 
router.get('/stats/summary', async (req, res) => {
    try {
        const stats = await db.query(`
            SELECT 
                COUNT(*) as total_facturas,
                SUM(invoiced_amount) as total_facturado,
                SUM(amount_paid) as total_pagado,
                AVG(invoiced_amount) as promedio_factura,
                COUNT(CASE WHEN amount_paid = 0 THEN 1 END) as facturas_pendientes,
                COUNT(CASE WHEN amount_paid >= invoiced_amount THEN 1 END) as facturas_pagadas
            FROM invoices
        `);
        
        res.json({
            success: true,
            data: stats.rows[0]
        });
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// GET get invoices for period 
router.get('/by-period/:period', async (req, res) => {
    try {
        const { period } = req.params;
        
        const result = await db.query(`
            SELECT i.*, c.nombre as cliente_nombre
            FROM invoices i 
            LEFT JOIN clientes c ON i.id_client = c.id 
            WHERE i.billing_period = $1
            ORDER BY i.invoice_number
        `, [period]);
        
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error obteniendo facturas por período:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

export default router;
