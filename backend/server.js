const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const seedRoutes = require('./routes/seed');
const staffRoutes = require('./routes/staff');
const incidentRoutes = require('./routes/incidents');
const medicationRoutes = require('./routes/medications');
const complianceRoutes = require('./routes/compliance');
const checklistRoutes = require('./routes/checklist');
const trainingRoutes = require('./routes/training');
const documentRoutes = require('./routes/documents');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Shield Ops Backend',
    version: '1.0.0'
  });
});

// API Routes - MUST come before static files
app.use('/api/auth', authRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', seedRoutes);
app.use('/api', staffRoutes);
app.use('/api', incidentRoutes);
app.use('/api', medicationRoutes);
app.use('/api', complianceRoutes);
app.use('/api', checklistRoutes);
app.use('/api', trainingRoutes);
app.use('/api', documentRoutes);

// Serve static files from public folder - AFTER API routes
app.use(express.static(path.join(__dirname, 'public')));

// Catch-all for non-API routes - serve index.html for SPA
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    next();
  }
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Shield Ops Backend Server Running!`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`\n📚 Available Endpoints:`);
  console.log(`\n  🔐 Authentication:`);
  console.log(`   POST   /api/auth/signup`);
  console.log(`   POST   /api/auth/login`);
  console.log(`   GET    /api/auth/me`);
  console.log(`\n  📊 Dashboard:`);
  console.log(`   GET    /api/facilities/:id/dashboard`);
  console.log(`\n  👥 Staff Management:`);
  console.log(`   GET    /api/facilities/:id/staff`);
  console.log(`   POST   /api/facilities/:id/staff`);
  console.log(`   GET    /api/staff/:id`);
  console.log(`   PUT    /api/staff/:id`);
  console.log(`   PUT    /api/staff/:id/certifications`);
  console.log(`\n  📝 Incident Reporting:`);
  console.log(`   GET    /api/facilities/:id/incidents`);
  console.log(`   POST   /api/facilities/:id/incidents`);
  console.log(`   GET    /api/incidents/:id`);
  console.log(`   PUT    /api/incidents/:id/parent-signature`);
  console.log(`\n  💊 Medication Tracking:`);
  console.log(`   GET    /api/facilities/:id/medications`);
  console.log(`   POST   /api/facilities/:id/medications`);
  console.log(`   POST   /api/medications/:id/administer`);
  console.log(`   GET    /api/medications/:id`);
  console.log(`\n  ✅ Compliance Management:`);
  console.log(`   GET    /api/facilities/:id/compliance`);
  console.log(`   POST   /api/facilities/:id/compliance/:reqId/complete`);
  console.log(`\n  📋 Daily Checklist:`);
  console.log(`   GET    /api/facilities/:id/checklist/today`);
  console.log(`   POST   /api/facilities/:id/checklist/today/tasks/:taskId/complete`);
  console.log(`   GET    /api/facilities/:id/checklist/week`);
  console.log(`\n  🎓 Training Hub:`);
  console.log(`   GET    /api/facilities/:id/training/modules`);
  console.log(`   POST   /api/training/:moduleId/complete`);
  console.log(`   GET    /api/staff/:staffId/training`);
  console.log(`\n  📄 Document Management:`);
  console.log(`   GET    /api/facilities/:id/documents`);
  console.log(`   POST   /api/facilities/:id/documents/upload`);
  console.log(`   GET    /api/documents/:id`);
  console.log(`   GET    /api/documents/:id/download`);
  console.log(`\n  🌱 Testing:`);
  console.log(`   POST   /api/seed - Seed database with test data`);
  console.log(`\n✅ Phase 1 + Phase 2 + Phase 3 Backend Ready!\n`);
});
