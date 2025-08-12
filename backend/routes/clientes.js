import express from 'express';
import { db } from '../config/supabase.js';

const router = express.Router();

// GET Get all clients
router.get('/', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT c.*, p.platform_name 
            FROM clientes c 
            LEFT JOIN platform p ON c.id_platform = p.id 
            ORDER BY c.nombre
        `);
        
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error obteniendo clientes:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// GET  Obtener cliente for ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await db.query(`
            SELECT c.*, p.platform_name 
            FROM clientes c 
            LEFT JOIN platform p ON c.id_platform = p.id 
            WHERE c.id = $1
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error obteniendo cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// POST Create new client 
router.post('/', async (req, res) => {
    try {
        const { nombre, direccion, correo, numero_identificacion, telefono, id_platform } = req.body;
        
        // Validaciones básicas
        if (!nombre || !id_platform) {
            return res.status(400).json({
                success: false,
                message: 'Nombre y plataforma son campos obligatorios'
            });
        }
        
        // Generate UNique ID
        const id = Date.now().toString();
        
        const result = await db.query(`
            INSERT INTO clientes (id, nombre, direccion, correo, numero_identificacion, telefono, id_platform)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [id, nombre, direccion, correo, numero_identificacion, telefono, id_platform]);
        
        res.status(201).json({
            success: true,
            message: 'Cliente creado exitosamente',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creando cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// PUT update client 
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, direccion, correo, numero_identificacion, telefono, id_platform } = req.body;
        
        const result = await db.query(`
            UPDATE clientes 
            SET nombre = $1, direccion = $2, correo = $3, numero_identificacion = $4, telefono = $5, id_platform = $6
            WHERE id = $7
            RETURNING *
        `, [nombre, direccion, correo, numero_identificacion, telefono, id_platform, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }
        
        res.json({
            success: true,
            message: 'Cliente actualizado exitosamente',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error actualizando cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// DELETE client 
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
    
        //verify if client has invoices or transactions asocied 
        const invoicesCheck = await db.query('SELECT COUNT(*) FROM invoices WHERE id_client = $1', [id]);
        const transactionsCheck = await db.query('SELECT COUNT(*) FROM transactions WHERE id_client = $1', [id]);
        
        if (parseInt(invoicesCheck.rows[0].count) > 0 || parseInt(transactionsCheck.rows[0].count) > 0) {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar el cliente porque tiene facturas o transacciones asociadas'
            });
        }
        
        const result = await db.query('DELETE FROM clientes WHERE id = $1 RETURNING *', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cliente no encontrado'
            });
        }
        
        res.json({
            success: true,
            message: 'Cliente eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error eliminando cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// GET a trasanction for one client 
router.get('/:id/invoices', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await db.query(`
            SELECT * FROM invoices 
            WHERE id_client = $1 
            ORDER BY billing_period DESC
        `, [id]);
        
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error obteniendo facturas del cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

// GET all invoices one client 
router.get('/:id/transactions', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await db.query(`
            SELECT * FROM transactions 
            WHERE id_client = $1 
            ORDER BY date_time_transaction DESC
        `, [id]);
        
        res.json({
            success: true,
            data: result.rows,
            count: result.rows.length
        });
    } catch (error) {
        console.error('Error obteniendo transacciones del cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
});

export default router;
