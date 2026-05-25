import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './config/database.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import planRoutes from './routes/plans.js';
import membershipRoutes from './routes/memberships.js';
import adminRoutes from './routes/admin.js';
import instructorRoutes from './routes/instructors.js';
import classTypeRoutes from './routes/class-types.js';
import scheduleRoutes from './routes/schedules.js';
import classRoutes from './routes/classes.js';
import bookingRoutes from './routes/bookings.js';
import walletRoutes from './routes/wallet.js';
import checkinRoutes from './routes/checkin.js';
import paymentRoutes from './routes/payments.js';
import settingsRoutes from './routes/settings.js';
import loyaltyRoutes from './routes/loyalty.js';
import reportsRoutes from './routes/reports.js';
import referralsRoutes from './routes/referrals.js';
import facilitiesRoutes from './routes/facilities.js';
import ordersRoutes from './routes/orders.js';
import reviewsRoutes from './routes/reviews.js';
import cronRoutes from './routes/cron.js';
import workoutTemplatesRoutes from './routes/workout-templates.js';
import videoRoutes from './routes/videos.js';
import eventRoutes from './routes/events.js';
import discountCodeRoutes from './routes/discount-codes.js';
import evolutionRoutes from './routes/evolution.js';
import webhookEvolutionRoutes from './routes/webhook-evolution.js';
import migrationRoutes from './routes/migrations.js';
import productRoutes from './routes/products.js';
import salesRoutes from './routes/sales.js';
import egresosRoutes from './routes/egresos.js';
import closedDaysRoutes from './routes/closed-days.js';
import statsRoutes from './routes/stats.js';
import clipPaymentsRoutes from './routes/clip-payments.js';
import webhookClipRoutes from './routes/webhook-clip.js';
import { query } from './config/database.js';
import initializeCronJobs from './services/cron-jobs.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging in development
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
        next();
    });
}

// Health Check (liveness): keep this endpoint 200 so Railway does not restart
// the container when PostgreSQL has a transient outage.
app.get('/api/health', async (req, res) => {
    try {
        const result = await query('SELECT NOW()');
        res.json({ status: 'ok', time: result[0].now, database: 'connected' });
    } catch (error) {
        res.json({ status: 'degraded', time: new Date().toISOString(), database: 'disconnected' });
    }
});

// Init DB adjustments
(async () => {
    try {
        // We deduct credits on booking creation, so we must DISABLE the trigger that deducts on check-in
        // to avoid double charging. Also drop the dormant function so it can't be re-wired by accident.
        await query(`DROP TRIGGER IF EXISTS trigger_decrement_classes ON bookings`);
        await query(`DROP FUNCTION IF EXISTS decrement_membership_classes() CASCADE`);
        console.log('Database triggers adjusted for booking logic.');
    } catch (e) {
        console.error('Error adjusting DB triggers:', e);
    }

    // Migración 010: columnas Clip + payment_events + unmatched_webhooks
    // Idempotente (todas las DDLs usan IF NOT EXISTS).
    try {
        await query(`ALTER TABLE payments
            ADD COLUMN IF NOT EXISTS provider VARCHAR(40),
            ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
            ADD COLUMN IF NOT EXISTS clip_payment_request_id VARCHAR(120),
            ADD COLUMN IF NOT EXISTS clip_checkout_url TEXT,
            ADD COLUMN IF NOT EXISTS clip_receipt_no VARCHAR(120),
            ADD COLUMN IF NOT EXISTS clip_auth_code VARCHAR(60),
            ADD COLUMN IF NOT EXISTS clip_card_brand VARCHAR(20),
            ADD COLUMN IF NOT EXISTS clip_card_last4 VARCHAR(4),
            ADD COLUMN IF NOT EXISTS reference_id VARCHAR(120),
            ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
            ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
            ADD COLUMN IF NOT EXISTS raw_webhook JSONB`);

        await query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_reference_id ON payments(reference_id) WHERE reference_id IS NOT NULL`);
        await query(`CREATE INDEX IF NOT EXISTS idx_payments_clip_payment_request_id ON payments(clip_payment_request_id) WHERE clip_payment_request_id IS NOT NULL`);
        await query(`CREATE INDEX IF NOT EXISTS idx_payments_clip_receipt_no ON payments(clip_receipt_no) WHERE clip_receipt_no IS NOT NULL`);

        await query(`CREATE TABLE IF NOT EXISTS payment_events (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
            event_type VARCHAR(60) NOT NULL,
            from_status VARCHAR(50),
            to_status VARCHAR(50),
            payload JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )`);
        await query(`CREATE INDEX IF NOT EXISTS idx_payment_events_payment ON payment_events(payment_id, created_at DESC)`);

        await query(`CREATE TABLE IF NOT EXISTS unmatched_webhooks (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            provider VARCHAR(40) NOT NULL,
            payload JSONB NOT NULL,
            received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            resolved_at TIMESTAMP WITH TIME ZONE,
            resolved_payment_id UUID REFERENCES payments(id) ON DELETE SET NULL
        )`);
        await query(`CREATE INDEX IF NOT EXISTS idx_unmatched_webhooks_received ON unmatched_webhooks(received_at DESC) WHERE resolved_at IS NULL`);

        console.log('Clip payments migration applied (010).');
    } catch (e) {
        console.error('Error applying Clip payments migration:', e);
    }
})();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/instructors', instructorRoutes);
app.use('/api/class-types', classTypeRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/referrals', referralsRoutes);
app.use('/api/facilities', facilitiesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/cron', cronRoutes);
app.use('/api/workout-templates', workoutTemplatesRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/discount-codes', discountCodeRoutes);
app.use('/api/evolution', evolutionRoutes);
app.use('/api/evolution/webhook', webhookEvolutionRoutes);
app.use('/api/migrations', migrationRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/egresos', egresosRoutes);
app.use('/api/closed-days', closedDaysRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/payments/clip', clipPaymentsRoutes);
app.use('/api/webhooks/clip', webhookClipRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && { message: err.message }),
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
🚀 Catarsis Studio API Server v2.1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Server running on http://localhost:${PORT}
🔒 Auth routes: /api/auth
👤 User routes: /api/users
📦 Products: /api/products
💰 Egresos: /api/egresos
❤️  Health check: /api/health
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);

    // Initialize cron jobs
    if (process.env.ENABLE_CRON_JOBS !== 'false') {
        initializeCronJobs();
    }
});

export default app;
// deploy trigger Tue Mar 31 00:35:47 CST 2026
