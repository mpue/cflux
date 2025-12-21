import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import timeRoutes from './routes/time.routes';
import projectRoutes from './routes/project.routes';
import customerRoutes from './routes/customer.routes';
import supplierRoutes from './routes/supplier.routes';
import articleGroupRoutes from './routes/articleGroup.routes';
import articleRoutes from './routes/article.routes';
import invoiceRoutes from './routes/invoice.routes';
import invoiceTemplateRoutes from './routes/invoiceTemplate.routes';
import absenceRoutes from './routes/absence.routes';
import reportRoutes from './routes/report.routes';
import backupRoutes from './routes/backup.routes';
import locationRoutes from './routes/location.routes';
import complianceRoutes from './routes/compliance.routes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/time', timeRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/article-groups', articleGroupRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/invoice-templates', invoiceTemplateRoutes);
app.use('/api/absences', absenceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/compliance', complianceRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
