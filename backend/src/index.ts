import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import userGroupRoutes from './routes/userGroup.routes';
import moduleRoutes from './routes/module.routes';
import timeRoutes from './routes/time.routes';
import projectRoutes from './routes/project.routes';
import customerRoutes from './routes/customer.routes';
import supplierRoutes from './routes/supplier.routes';
import articleGroupRoutes from './routes/articleGroup.routes';
import articleRoutes from './routes/article.routes';
import invoiceRoutes from './routes/invoice.routes';
import invoiceTemplateRoutes from './routes/invoiceTemplate.routes';
import reminderRoutes from './routes/reminder.routes';
import absenceRoutes from './routes/absence.routes';
import reportRoutes from './routes/report.routes';
import backupRoutes from './routes/backup.routes';
import locationRoutes from './routes/location.routes';
import complianceRoutes from './routes/compliance.routes';
import uploadRoutes from './routes/upload.routes';
import incidentRoutes from './routes/incident.routes';
import workflowRoutes from './routes/workflow.routes';
import systemSettingsRoutes from './routes/systemSettings.routes';
import payrollRoutes from './routes/payroll.routes';
import projectTimeAllocationRoutes from './routes/projectTimeAllocation.routes';
import deviceRoutes from './routes/device.routes';
import travelExpenseRoutes from './routes/travelExpense.routes';
import messageRoutes from './routes/message.routes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Parse CORS origins from environment (comma-separated list)
const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map(origin => origin.trim()) || ['http://localhost:3000'];

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/user-groups', userGroupRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/time', timeRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/article-groups', articleGroupRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/invoice-templates', invoiceTemplateRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/absences', absenceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/system-settings', systemSettingsRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/project-time-allocations', projectTimeAllocationRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/travel-expenses', travelExpenseRoutes);
app.use('/api/messages', messageRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
