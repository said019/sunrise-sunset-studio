import { Router, Request, Response } from 'express';
import { query, queryOne } from '../config/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { invalidateCache } from '../lib/settings.js';

const router = Router();

// ============================================
// GET /api/settings/bank-info - Get bank info for transfers (public for authenticated users)
// IMPORTANT: This route must be before /:key to avoid being caught by the param route
// ============================================
router.get('/bank-info', authenticate, async (req: Request, res: Response) => {
    try {
        const setting = await queryOne(
            `SELECT value FROM system_settings WHERE key = 'bank_info'`
        );
        
        if (!setting || !setting.value) {
            // Return default bank info
            return res.json({
                bank_name: 'Balance Studio',
                account_holder: 'Balance Studio S.A. de C.V.',
                account_number: '1234567890',
                clabe: '012345678901234567',
                reference_instructions: 'Usa tu nombre completo como referencia'
            });
        }
        
        // Parse the JSON value
        const bankInfo = typeof setting.value === 'string' 
            ? JSON.parse(setting.value) 
            : setting.value;
        
        res.json(bankInfo);
    } catch (error) {
        console.error('Get bank info error:', error);
        res.status(500).json({ error: 'Error al obtener datos bancarios' });
    }
});

// ============================================
// PUT /api/settings/bank-info - Update bank info (admin only)
// ============================================
router.put('/bank-info', authenticate, requireRole('admin', 'super_admin'), async (req: Request, res: Response) => {
    try {
        const { bank_name, account_holder, account_number, clabe, reference_instructions } = req.body;
        
        const bankInfo = {
            bank_name,
            account_holder,
            account_number,
            clabe,
            reference_instructions
        };
        
        await query(
            `INSERT INTO system_settings (key, value, description, updated_by)
             VALUES ('bank_info', $1, 'Datos bancarios para transferencias', $2)
             ON CONFLICT (key) DO UPDATE
             SET value = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2`,
            [JSON.stringify(bankInfo), req.user?.userId]
        );
        
        invalidateCache('bank_info');
        res.json({ message: 'Datos bancarios actualizados', bankInfo });
    } catch (error) {
        console.error('Update bank info error:', error);
        res.status(500).json({ error: 'Error al actualizar datos bancarios' });
    }
});

// ============================================
// GET /api/settings - Get all settings
// ============================================
router.get('/', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
    try {
        const settings = await query(`SELECT key, value, description FROM system_settings`);
        
        // Transform to object
        const settingsObj: Record<string, any> = {};
        settings.forEach((s: any) => {
            settingsObj[s.key] = s.value;
        });
        
        res.json(settingsObj);
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ error: 'Error al obtener configuración' });
    }
});

// ============================================
// PUT /api/settings - Update multiple settings
// ============================================
router.put('/', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
    try {
        const settings = req.body;
        
        for (const [key, value] of Object.entries(settings)) {
            await query(
                `INSERT INTO system_settings (key, value, updated_by)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (key) DO UPDATE
                 SET value = $2, updated_at = CURRENT_TIMESTAMP, updated_by = $3`,
                [key, JSON.stringify(value), req.user?.userId]
            );
        }
        
        invalidateCache(); // Clear all cache when bulk updating
        res.json({ message: 'Configuración actualizada' });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ error: 'Error al actualizar configuración' });
    }
});

// ============================================
// GET /api/settings/:key - Get specific setting (MUST BE AFTER specific routes like /bank-info)
// ============================================
router.get('/:key', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
    try {
        const { key } = req.params;
        const setting = await queryOne(
            `SELECT key, value, description FROM system_settings WHERE key = $1`,
            [key]
        );
        
        if (!setting) {
            return res.status(404).json({ error: 'Configuración no encontrada' });
        }
        
        res.json(setting);
    } catch (error) {
        console.error('Get setting error:', error);
        res.status(500).json({ error: 'Error al obtener configuración' });
    }
});

// ============================================
// PUT /api/settings/:key - Update specific setting
// ============================================
router.put('/:key', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
    try {
        const { key } = req.params;
        const { value } = req.body;
        
        const result = await queryOne(
            `UPDATE system_settings 
             SET value = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2
             WHERE key = $3
             RETURNING key, value, description`,
            [JSON.stringify(value), req.user?.userId, key]
        );
        
        if (!result) {
            // Insert if not exists
            const inserted = await queryOne(
                `INSERT INTO system_settings (key, value, updated_by)
                 VALUES ($1, $2, $3)
                 RETURNING key, value, description`,
                [key, JSON.stringify(value), req.user?.userId]
            );
            return res.json(inserted);
        }
        
        invalidateCache(key);
        res.json(result);
    } catch (error) {
        console.error('Update setting error:', error);
        res.status(500).json({ error: 'Error al actualizar configuración' });
    }
});

export default router;
