import express from 'express';
import { db } from '../config/supabase.js';

const router = express.Router();

// GET Get all platforms
router.get('/', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT * FROM platform 
            ORDER BY platform_name
        `);
        
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error obteniendo plataformas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// GET Gewt platform for ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await db.query(`
            SELECT * FROM platform 
            WHERE id = $1
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Plataforma no encontrada'
            });
        }
        
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error obteniendo plataforma:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// GET get clients of a one platform 
router.get('/:id/clientes', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await db.query(`
            SELECT c.*, p.platform_name 
            FROM clientes c 
            LEFT JOIN platform p ON c.id_platform = p.id 
            WHERE c.id_platform = $1
            ORDER BY c.nombre
        `, [id]);
        
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error obteniendo clientes de la plataforma:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// GET get stadistis of a one platform 
router.get('/:id/stats', async (req, res) => {
    try {
        const { id } = req.params;
        
        const stats = await db.query(`
            SELECT 
                p.platform_name,
                COUNT(DISTINCT c.id) as total_clientes,
                COUNT(DISTINCT i.invoice_number) as total_facturas,
                COUNT(DISTINCT t.id_transaction) as total_transacciones,
                SUM(i.invoiced_amount) as total_facturado,
                SUM(i.amount_paid) as total_pagado,
                SUM(t.amount_transaction) as total_transaccionado,
                AVG(i.invoiced_amount) as promedio_factura,
                AVG(t.amount_transaction) as promedio_transaccion
            FROM platform p
            LEFT JOIN clientes c ON p.id = c.id_platform
            LEFT JOIN invoices i ON c.id = i.id_client
            LEFT JOIN transactions t ON c.id = t.id_client
            WHERE p.id = $1
            GROUP BY p.id, p.platform_name
        `, [id]);
        
        if (stats.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Plataforma no encontrada'
            });
        }
        
        res.json({
            success: true,
            data: stats.rows[0]
        });
    } catch (error) {
        console.error('Error obteniendo estadísticas de la plataforma:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// POST create a new platform 
router.post('/', async (req, res) => {
    try {
        const { platform_name } = req.body;
        
        // Validaciones básicas
        if (!platform_name) {
            return res.status(400).json({
                success: false,
                message: 'Nombre de plataforma es obligatorio'
            });
        }
        
        // Generate a unique ID
        const id = Date.now().toString();
        
        const result = await db.query(`
            INSERT INTO platform (id, platform_name)
            VALUES ($1, $2)
            RETURNING *
        `, [id, platform_name]);
        
        res.status(201).json({
            success: true,
            message: 'Plataforma creada exitosamente',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creando plataforma:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// PUT update platform 
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { platform_name } = req.body;
        
        const result = await db.query(`
            UPDATE platform 
            SET platform_name = $1
            WHERE id = $2
            RETURNING *
        `, [platform_name, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Plataforma no encontrada'
            });
        }
        
        res.json({
            success: true,
            message: 'Plataforma actualizada exitosamente',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error actualizando plataforma:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// DELETE delete platform 
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
     
        // verify if  the platform has asociety clients 
        const clientesCheck = await db.query('SELECT COUNT(*) FROM clientes WHERE id_platform = $1', [id]);
        
        if (parseInt(clientesCheck.rows[0].count) > 0) {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar la plataforma porque tiene clientes asociados'
            });
        }
        
        const result = await db.query('DELETE FROM platform WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Plataforma no encontrada'
            });
        }
        
        res.json({
            success: true,
            message: 'Plataforma eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error eliminando plataforma:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

export default router;
