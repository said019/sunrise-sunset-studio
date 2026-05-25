import { Router, Request, Response } from 'express';
import { query, queryOne } from '../config/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import crypto from 'crypto';

const router = Router();

// ============================================
// GET /api/referrals/code - Get user's referral code
// ============================================
router.get('/code', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        
        // Check if user has a referral code
        let referral = await queryOne(
            `SELECT * FROM referral_codes WHERE user_id = $1`,
            [userId]
        );
        
        // Create code if doesn't exist
        if (!referral) {
            const code = crypto.randomBytes(4).toString('hex').toUpperCase();
            referral = await queryOne(
                `INSERT INTO referral_codes (user_id, code)
                 VALUES ($1, $2)
                 RETURNING *`,
                [userId, code]
            );
        }
        
        // Get referral stats
        const stats = await queryOne(
            `SELECT 
                COUNT(*) as total_referrals,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_referrals
             FROM referrals
             WHERE referrer_id = $1`,
            [userId]
        );
        
        res.json({
            code: referral.code,
            totalReferrals: parseInt(stats?.total_referrals || '0'),
            completedReferrals: parseInt(stats?.completed_referrals || '0')
        });
    } catch (error) {
        console.error('Get referral code error:', error);
        res.status(500).json({ error: 'Error al obtener código de referido' });
    }
});

// ============================================
// POST /api/referrals/apply - Apply referral code
// ============================================
router.post('/apply', authenticate, async (req: Request, res: Response) => {
    try {
        const { code } = req.body;
        const userId = req.user?.userId;
        
        // Check if user already used a referral
        const existingReferral = await queryOne(
            `SELECT * FROM referrals WHERE referred_id = $1`,
            [userId]
        );
        
        if (existingReferral) {
            return res.status(400).json({ error: 'Ya usaste un código de referido' });
        }
        
        // Find referral code
        const referralCode = await queryOne(
            `SELECT * FROM referral_codes WHERE code = $1`,
            [code.toUpperCase()]
        );
        
        if (!referralCode) {
            return res.status(404).json({ error: 'Código inválido' });
        }
        
        // Can't refer yourself
        if (referralCode.user_id === userId) {
            return res.status(400).json({ error: 'No puedes usar tu propio código' });
        }
        
        // Create referral record
        const referral = await queryOne(
            `INSERT INTO referrals (referrer_id, referred_id, status)
             VALUES ($1, $2, 'pending')
             RETURNING *`,
            [referralCode.user_id, userId]
        );
        
        res.json({ message: 'Código aplicado exitosamente', referral });
    } catch (error) {
        console.error('Apply referral error:', error);
        res.status(500).json({ error: 'Error al aplicar código' });
    }
});

// ============================================
// GET /api/referrals/my-referrals - Get user's referrals
// ============================================
router.get('/my-referrals', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;
        
        const referrals = await query(
            `SELECT r.*, u.display_name as referred_name, u.created_at as referred_joined
             FROM referrals r
             JOIN users u ON r.referred_id = u.id
             WHERE r.referrer_id = $1
             ORDER BY r.created_at DESC`,
            [userId]
        );
        
        res.json(referrals);
    } catch (error) {
        console.error('Get referrals error:', error);
        res.status(500).json({ error: 'Error al obtener referidos' });
    }
});

// ============================================
// GET /api/referrals/all - Get all referrals (admin)
// ============================================
router.get('/all', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
    try {
        const referrals = await query(
            `SELECT r.*,
                    ru.display_name as referrer_name, ru.email as referrer_email,
                    rd.display_name as referred_name, rd.email as referred_email
             FROM referrals r
             JOIN users ru ON r.referrer_id = ru.id
             JOIN users rd ON r.referred_id = rd.id
             ORDER BY r.created_at DESC
             LIMIT 100`
        );
        
        res.json(referrals);
    } catch (error) {
        console.error('Get all referrals error:', error);
        res.status(500).json({ error: 'Error al obtener referidos' });
    }
});

// ============================================
// PUT /api/referrals/:id/complete - Complete referral (admin)
// ============================================
router.put('/:id/complete', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        // Update referral status
        const referral = await queryOne<any>(
            `UPDATE referrals SET status = 'completed', completed_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND status = 'pending'
             RETURNING *`,
            [id]
        );
        
        if (!referral) {
            return res.status(404).json({ error: 'Referido no encontrado o ya completado' });
        }
        
        // Get loyalty settings
        const settings = await queryOne<any>(
            `SELECT value FROM system_settings WHERE key = 'loyalty_settings'`
        );
        
        const referralBonus = settings?.value?.referral_bonus || 100;
        
        // Award points to referrer
        await query(
            `INSERT INTO loyalty_points (user_id, points, type, description)
             VALUES ($1, $2, 'referral', 'Bono por referido completado')`,
            [referral.referrer_id, referralBonus]
        );
        
        res.json({ message: 'Referido completado', referral });
    } catch (error) {
        console.error('Complete referral error:', error);
        res.status(500).json({ error: 'Error al completar referido' });
    }
});

// ============================================
// GET /api/referrals/codes - List all referral codes (admin)
// ============================================
router.get('/codes', authenticate, requireRole('admin'), async (_req: Request, res: Response) => {
    try {
        const codes = await query(
            `SELECT
                rc.id,
                rc.code,
                rc.user_id,
                u.display_name as user_name,
                u.email as user_email,
                (SELECT COUNT(*)::int FROM referrals WHERE referrer_id = rc.user_id) as uses_count,
                NULL::int as max_uses,
                0 as reward_points,
                true as is_active,
                rc.created_at
             FROM referral_codes rc
             JOIN users u ON rc.user_id = u.id
             ORDER BY rc.created_at DESC`
        );
        res.json({ codes });
    } catch (error) {
        console.error('Get referral codes error:', error);
        res.status(500).json({ error: 'Error al obtener códigos de referido' });
    }
});

// ============================================
// GET /api/referrals - List all referrals with stats (admin)
// ============================================
router.get('/', authenticate, requireRole('admin'), async (_req: Request, res: Response) => {
    try {
        const referrals = await query(
            `SELECT
                r.id,
                ru.display_name as referrer_name,
                ru.email as referrer_email,
                rd.display_name as referred_name,
                rd.email as referred_email,
                r.status,
                0 as points_awarded,
                r.created_at,
                r.completed_at
             FROM referrals r
             JOIN users ru ON r.referrer_id = ru.id
             JOIN users rd ON r.referred_id = rd.id
             ORDER BY r.created_at DESC`
        );

        const totalCodes = await queryOne<{ count: string }>(
            `SELECT COUNT(*) as count FROM referral_codes`
        );

        const stats = {
            total_codes: parseInt(totalCodes?.count || '0'),
            total_referrals: referrals.length,
            completed_referrals: referrals.filter((r: any) => r.status === 'completed').length,
            total_points_awarded: 0,
        };

        res.json({ referrals, stats });
    } catch (error) {
        console.error('Get referrals error:', error);
        res.status(500).json({ error: 'Error al obtener referidos' });
    }
});

// ============================================
// PUT /api/referrals/codes/:id - Toggle referral code status (admin)
// ============================================
router.put('/codes/:id', authenticate, requireRole('admin'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        if (typeof is_active !== 'boolean') {
            return res.status(400).json({ error: 'is_active debe ser un booleano' });
        }

        const code = await queryOne(
            `UPDATE referral_codes SET is_active = $1 WHERE id = $2 RETURNING *`,
            [is_active, id]
        );

        if (!code) {
            return res.status(404).json({ error: 'Código no encontrado' });
        }

        res.json({ message: is_active ? 'Código activado' : 'Código desactivado', code });
    } catch (error) {
        console.error('Toggle referral code error:', error);
        res.status(500).json({ error: 'Error al actualizar código' });
    }
});

export default router;
