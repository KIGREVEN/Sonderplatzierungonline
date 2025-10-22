const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const { execSync } = require('child_process');
require('dotenv').config();

const { testConnection, query } = require('./config/database');
const bookingRoutes = require('./routes/bookings');
const availabilityRoutes = require('./routes/availability');
const categoryRoutes = require('./routes/categories');
const migrateRoutes = require('./routes/migrate');
const authRoutes = require('./routes/auth');
const platformsRoutes = require('./routes/platforms');
const productsRoutes = require('./routes/products');
const locationsRoutes = require('./routes/locations');
const campaignsRoutes = require('./routes/campaigns');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for Render.com deployment
app.set('trust proxy', 1);

// Automatische Datenbank-Initialisierung
const initializeDatabase = async () => {
  try {
    console.log('🔄 Checking database connection...');
    await testConnection();
    console.log('✅ Database connection successful');
    
    console.log('🔄 Running database migration...');
    try {
      execSync('npm run migrate:up', { cwd: __dirname, stdio: 'inherit' });
      console.log('✅ Database migration completed');
    } catch (migrationError) {
      console.log('ℹ️ Migration may have already been run:', migrationError.message);
    }
    
    // Prüfen ob Datenbank leer ist und ggf. seeden
    try {
      const result = await query('SELECT COUNT(*) as count FROM bookings');
      const recordCount = parseInt(result.rows[0].count);
      
      if (recordCount === 0) {
        console.log('🌱 Database is empty, seeding with sample data...');
        execSync('npm run seed:run', { cwd: __dirname, stdio: 'inherit' });
        console.log('✅ Database seeded successfully');
      } else {
        console.log(`📊 Database already contains ${recordCount} records, skipping seed`);
      }
    } catch (seedError) {
      console.log('ℹ️ Seeding skipped - table might not exist yet or already populated');
    }
    
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    console.log('⚠️ Server will start anyway - check database configuration');
  }
};

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration - allow all origins for Render deployment
app.use(cors({
  origin: process.env.CORS_ORIGIN || true, // Allow all origins by default
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing middleware
app.use(cookieParser());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Köln Branchen Portal API',
    version: '1.0.0'
  });
});

// Additional simple healthz used by Render
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Database status endpoint
app.get('/api/db-status', async (req, res) => {
  try {
    await testConnection();
    const result = await query('SELECT COUNT(*) as count FROM bookings');
    const recordCount = parseInt(result.rows[0].count);
    
    res.json({
      success: true,
      database: {
        connected: true,
        recordCount,
        status: recordCount > 0 ? 'populated' : 'empty',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      database: {
        connected: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Manual migration endpoint (for troubleshooting)
app.post('/api/admin/migrate', async (req, res) => {
  try {
    console.log('🔄 Manual migration requested...');
    execSync('npm run migrate:up', { cwd: __dirname, stdio: 'inherit' });
    
    res.json({
      success: true,
      message: 'Database migration completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({
      success: false,
      error: 'Migration failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Manual seeding endpoint (for troubleshooting)
app.post('/api/admin/seed', async (req, res) => {
  try {
    console.log('🌱 Manual seeding requested...');
    execSync('npm run seed:run', { cwd: __dirname, stdio: 'inherit' });
    
    res.json({
      success: true,
      message: 'Database seeded successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Seeding error:', error);
    res.status(500).json({
      success: false,
      error: 'Seeding failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API routes
app.use('/api/bookings', bookingRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/migrate', migrateRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/platforms', platformsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/locations', locationsRoutes);
app.use('/api/campaigns', campaignsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: err.message,
      details: err.details || []
    });
  }
  
  if (err.code === '23505') { // PostgreSQL unique violation
    return res.status(409).json({
      success: false,
      error: 'Conflict',
      message: 'A booking already exists for this time slot and placement.'
    });
  }
  
  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({
      success: false,
      error: 'Database Connection Error',
      message: 'Unable to connect to database'
    });
  }
  
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: 'The requested resource was not found.'
  });
});

// Cleanup function for expired reservations
const cleanupExpiredReservations = async () => {
  try {
    const timeoutMinutes = parseInt(process.env.RESERVATION_TIMEOUT_MINUTES) || 30;
    const result = await query(`
      UPDATE bookings 
      SET status = 'frei', updated_at = NOW()
      WHERE status = 'reserviert' 
      AND created_at < NOW() - INTERVAL '${timeoutMinutes} minutes'
      RETURNING id, kundenname
    `);
    
    if (result.rows.length > 0) {
      console.log(`🧹 Cleaned up ${result.rows.length} expired reservations`);
    }
  } catch (error) {
    console.error('Cleanup error:', error.message);
  }
};

// Initialize database and start server
const startServer = async () => {
  console.log('🚀 Starting Köln Branchen Portal API...');
  
  // Initialize database
  await initializeDatabase();
  
  // Start cleanup interval
  const cleanupInterval = parseInt(process.env.CLEANUP_INTERVAL_MINUTES) || 30;
  setInterval(cleanupExpiredReservations, cleanupInterval * 60 * 1000);
  console.log(`🧹 Cleanup scheduled every ${cleanupInterval} minutes`);
  
  // Start server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🗄️ Database status: http://localhost:${PORT}/api/db-status`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`⚡ CORS Origin: ${process.env.CORS_ORIGIN || 'all origins'}`);
    console.log('✅ Server initialization complete');
  });
};

// Start the server
startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

module.exports = app;
