# Hospital CRM - Azure PostgreSQL Migration Guide

## Overview
This document outlines the complete migration from Supabase to Azure PostgreSQL and the setup of a full-fledged hospital management application.

## Architecture

### Before (Supabase)
- Frontend: React + Vite
- Backend: Supabase client-side integration
- Database: Supabase PostgreSQL
- Authentication: Supabase Auth

### After (Azure PostgreSQL)
- Frontend: React + Vite
- Backend: Node.js + Express API
- Database: Azure PostgreSQL
- Authentication: JWT-based custom auth

## Database Setup

### Azure PostgreSQL Configuration
- **Host**: valantdb.postgres.database.azure.com
- **Port**: 5432
- **Database**: postgres
- **User**: divyansh04
- **SSL**: Required

### Schema Migration
The database schema includes:
- `users` - User management with roles
- `patients` - Patient information
- `doctors` - Doctor profiles
- `departments` - Hospital departments
- `patient_transactions` - Financial transactions
- `patient_admissions` - IPD management
- `beds` - Bed management
- `appointments` - Appointment scheduling
- `medicines` - Medicine inventory
- `daily_expenses` - Expense tracking

## Backend API

### Technology Stack
- Node.js + Express
- PostgreSQL client (`pg`)
- JWT authentication
- bcrypt for password hashing

### API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Create new user (Admin only)

#### Patients
- `GET /api/patients` - List all patients
- `GET /api/patients/:id` - Get single patient
- `POST /api/patients` - Create new patient
- `PUT /api/patients/:id` - Update patient

#### Transactions
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction

#### Admissions
- `GET /api/admissions` - List admissions
- `POST /api/admissions` - Create admission
- `POST /api/admissions/:id/discharge` - Discharge patient

#### Others
- `GET /api/doctors` - List doctors
- `GET /api/beds` - List beds
- `GET /api/dashboard/stats` - Dashboard statistics

## Security Features

### Authentication
- JWT token-based authentication
- Role-based access control (ADMIN, DOCTOR, NURSE, STAFF, FRONTDESK)
- Password hashing with bcrypt

### Database Security
- SSL connection required
- Parameterized queries to prevent SQL injection
- Transaction support for data integrity

## Running the Application

### Prerequisites
- Node.js (v16 or higher)
- Access to Azure PostgreSQL database

### Quick Start
```bash
# Clone and navigate to project
cd hospital-crm-pro

# Run the application
./start-app.sh
```

### Manual Start
```bash
# Install backend dependencies
cd backend && npm install

# Start backend server
npm start

# In new terminal, install frontend dependencies
cd .. && npm install

# Start frontend
npm run dev
```

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Admin Login**: 
  - Email: admin@hospital.com
  - Password: admin123

## Migration Benefits

### Scalability
- Direct PostgreSQL connection for better performance
- Custom backend for specific business logic
- Ability to scale backend and database independently

### Control
- Full control over database schema and migrations
- Custom authentication and authorization
- Ability to implement complex business logic

### Cost
- Potentially lower costs compared to Supabase
- Pay-as-you-use Azure pricing model

### Integration
- Easy integration with other Azure services
- Better suited for enterprise requirements

## Backup and Monitoring

### Backup Strategy
- Azure PostgreSQL automatic backups
- Point-in-time recovery available
- Custom backup scripts for additional safety

### Monitoring
- Azure Monitor for database performance
- Application logs for API monitoring
- Health check endpoints for uptime monitoring

## Troubleshooting

### Common Issues

1. **Connection Issues**
   - Ensure firewall rules allow your IP
   - Check SSL configuration
   - Verify credentials

2. **Authentication Errors**
   - Check JWT secret configuration
   - Verify user exists in database
   - Check password hashing

3. **Database Errors**
   - Check Azure PostgreSQL service status
   - Verify connection string format
   - Check SSL requirements

### Logs
- Backend logs: Check terminal output
- Database logs: Available in Azure Portal
- Frontend logs: Check browser console

## Production Deployment

### Environment Variables
Update the following for production:
- `JWT_SECRET` - Use a strong, unique secret
- `AZURE_DB_PASSWORD` - Use environment variables
- `CORS_ORIGIN` - Set to your domain

### Security Checklist
- [ ] Strong JWT secret
- [ ] HTTPS enabled
- [ ] Database firewall configured
- [ ] Regular backups scheduled
- [ ] Monitoring set up
- [ ] Log management implemented

## Next Steps

1. **Data Migration**: Import existing data from Supabase
2. **User Management**: Set up additional users and roles
3. **Customization**: Adapt the application to specific hospital needs
4. **Testing**: Comprehensive testing in staging environment
5. **Deployment**: Production deployment with proper security measures

## Support

For technical support:
1. Check logs for error messages
2. Verify database connectivity
3. Review API documentation
4. Contact system administrator

---

**Note**: This migration provides a solid foundation for a hospital management system with Azure PostgreSQL. The application is ready for production use with proper configuration and security measures.