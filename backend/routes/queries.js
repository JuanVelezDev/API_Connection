import express from 'express';
import { db } from '../config/supabase.js';

const router = express.Router();

// 1. Total paid for client 
// "
router.get('/total-paid-by-client', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                c.id,
                c.nombre as client_name,
                c.correo as client_email,
                p.platform_name,
                COALESCE(SUM(i.amount_paid), 0) as total_paid,
                COALESCE(SUM(i.invoiced_amount), 0) as total_invoiced,
                COALESCE(SUM(i.invoiced_amount) - SUM(i.amount_paid), 0) as pending_balance
            FROM clientes c
            LEFT JOIN platform p ON c.id_platform = p.id
            LEFT JOIN invoices i ON c.id = i.id_client
            GROUP BY c.id, c.nombre, c.correo, p.platform_name
            ORDER BY total_paid DESC
        `);

        res.json({
            success: true,
            data: result.rows,
            message: 'Total paid by each client retrieved successfully'
        });
    } catch (error) {
        console.error('Error getting total paid by client:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving total paid by client',
            error: error.message
        });
    }
});

// 2. Outstanding invoices with customer and associated transaction information
// "As a finance manager, I need to identify invoices that have not yet been fully paid."
router.get('/pending-invoices', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                i.invoice_number,
                i.billing_period,
                i.invoiced_amount,
                i.amount_paid,
                (i.invoiced_amount - i.amount_paid) as pending_amount,
                c.nombre as client_name,
                c.correo as client_email,
                c.telefono as client_phone,
                p.platform_name,
                t.id_transaction,
                t.amount_transaction,
                t.status_transaction,
                t.date_time_transaction
            FROM invoices i
            LEFT JOIN clientes c ON i.id_client = c.id
            LEFT JOIN platform p ON c.id_platform = p.id
            LEFT JOIN transactions t ON i.id_client = t.id_client 
                AND t.type_transaction = 'Pago de Factura'
            WHERE i.amount_paid < i.invoiced_amount
            ORDER BY (i.invoiced_amount - i.amount_paid) DESC
        `);

        res.json({
            success: true,
            data: result.rows,
            message: 'Pending invoices with client and transaction information retrieved successfully'
        });
    } catch (error) {
        console.error('Error getting pending invoices:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving pending invoices',
            error: error.message
        });
    }
});

// 3. List of trasactions for plataform 
// "As an analyst, I need to be able to see all transactions made from a specific platform
router.get('/transactions-by-platform/:platformId', async (req, res) => {
    try {
        const { platformId } = req.params;
        
        const result = await db.query(`
            SELECT 
                t.id_transaction,
                t.amount_transaction,
                t.status_transaction,
                t.type_transaction,
                t.date_time_transaction,
                c.nombre as client_name,
                c.correo as client_email,
                i.invoice_number,
                i.invoiced_amount,
                i.amount_paid,
                p.platform_name
            FROM transactions t
            LEFT JOIN clientes c ON t.id_client = c.id
            LEFT JOIN platform p ON c.id_platform = p.id
            LEFT JOIN invoices i ON t.id_client = i.id_client
            WHERE p.id = $1
            ORDER BY t.date_time_transaction DESC
        `, [platformId]);

        res.json({
            success: true,
            data: result.rows,
            message: `Transactions for platform ${platformId} retrieved successfully`
        });
    } catch (error) {
        console.error('Error getting transactions by platform:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving transactions by platform',
            error: error.message
        });
    }
});

// Get all platforms for the dropdown
router.get('/platforms', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT id, platform_name
            FROM platform
            ORDER BY platform_name
        `);

        res.json({
            success: true,
            data: result.rows,
            message: 'Platforms retrieved successfully'
        });
    } catch (error) {
        console.error('Error getting platforms:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving platforms',
            error: error.message
        });
    }
});

export default router;
