import express from 'express';
import { db } from '../config/supabase.js';

const router = express.Router();

// GET get all trasactions 
router.get('/', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT t.*, c.nombre as cliente_nombre, c.correo as cliente_email
            FROM transactions t 
            LEFT JOIN clientes c ON t.id_client = c.id 
            ORDER BY t.date_time_transaction DESC
        `);
        
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error obteniendo transacciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// GET get trasaction for ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await db.query(`
            SELECT t.*, c.nombre as cliente_nombre, c.correo as cliente_email, c.telefono as cliente_telefono
            FROM transactions t 
            LEFT JOIN clientes c ON t.id_client = c.id 
            WHERE t.id_transaction = $1
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Transacción no encontrada'
            });
        }
        
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error obteniendo transacción:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// POST create a new trasaction 
router.post('/', async (req, res) => {
    try {
        const { id_client, date_time_transaction, amount_transaction, status_transaction, type_transaction } = req.body;
        
        // Validaciones básicas
        if (!id_client || !amount_transaction || !status_transaction || !type_transaction) {
            return res.status(400).json({
                success: false,
                message: 'Cliente, monto, estado y tipo de transacción son campos obligatorios'
            });
        }
        
        // Generate unique idTrasaction
        const idTransaction = `TXN${Date.now()}`;
        
        const result = await db.query(`
            INSERT INTO transactions (id_transaction, id_client, date_time_transaction, amount_transaction, status_transaction, type_transaction)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [idTransaction, id_client, date_time_transaction || new Date(), amount_transaction, status_transaction, type_transaction]);
        
        res.status(201).json({
            success: true,
            message: 'Transacción creada exitosamente',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creando transacción:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// PUT update trasaction 
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { id_client, date_time_transaction, amount_transaction, status_transaction, type_transaction } = req.body;
        
        const result = await db.query(`
            UPDATE transactions 
            SET id_client = $1, date_time_transaction = $2, amount_transaction = $3, status_transaction = $4, type_transaction = $5
            WHERE id_transaction = $6
            RETURNING *
        `, [id_client, date_time_transaction, amount_transaction, status_transaction, type_transaction, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Transacción no encontrada'
            });
        }
        
        res.json({
            success: true,
            message: 'Transacción actualizada exitosamente',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error actualizando transacción:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// DELETE delete trasaction 
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await db.query('DELETE FROM transactions WHERE id_transaction = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Transacción no encontrada'
            });
        }
        
        res.json({
            success: true,
            message: 'Transacción eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error eliminando transacción:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// GET get statidstics of trasactions 
router.get('/stats/summary', async (req, res) => {
    try {
        const stats = await db.query(`
            SELECT 
                COUNT(*) as total_transacciones,
                SUM(amount_transaction) as total_monto,
                AVG(amount_transaction) as promedio_monto,
                COUNT(CASE WHEN status_transaction = 'Completada' THEN 1 END) as transacciones_completadas,
                COUNT(CASE WHEN status_transaction = 'Pendiente' THEN 1 END) as transacciones_pendientes,
                COUNT(CASE WHEN status_transaction = 'Fallida' THEN 1 END) as transacciones_fallidas,
                SUM(CASE WHEN status_transaction = 'Completada' THEN amount_transaction ELSE 0 END) as monto_completado,
                SUM(CASE WHEN status_transaction = 'Pendiente' THEN amount_transaction ELSE 0 END) as monto_pendiente
            FROM transactions
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

// GET get trasactions for status 
router.get('/by-status/:status', async (req, res) => {
    try {
        const { status } = req.params;
        
        const result = await db.query(`
            SELECT t.*, c.nombre as cliente_nombre
            FROM transactions t 
            LEFT JOIN clientes c ON t.id_client = c.id 
            WHERE t.status_transaction = $1
            ORDER BY t.date_time_transaction DESC
        `, [status]);
        
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error obteniendo transacciones por estado:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// GET get transactions for type
router.get('/by-type/:type', async (req, res) => {
    try {
        const { type } = req.params;
        
        const result = await db.query(`
            SELECT t.*, c.nombre as cliente_nombre
            FROM transactions t 
            LEFT JOIN clientes c ON t.id_client = c.id 
            WHERE t.type_transaction = $1
            ORDER BY t.date_time_transaction DESC
        `, [type]);
        
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error obteniendo transacciones por tipo:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

export default router;
