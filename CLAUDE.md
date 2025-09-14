# Hospital CRM Pro - Development Instructions

## Project Overview
- **Name**: Hospital CRM Pro
- **Version**: 3.1.0-production-final
- **Type**: Full-stack hospital management system
- **Tech Stack**: React 19, TypeScript, Vite, Supabase (PostgreSQL)

## Color Scheme & Design
- **Primary Color**: #0056B3 (use for dashboard sections and UI elements)

## Development Commands
```bash
npm run dev                 # Start development server
npm run build              # Build for production
npm run build:typecheck    # Build with TypeScript checking
npm run lint               # Run ESLint
npm run preview            # Preview production build
npm run backup             # Database backup
npm run backup:restore     # Restore database backup
```

## Key Technologies
- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite
- **State Management**: Zustand, TanStack React Query
- **Database**: Supabase (PostgreSQL) with Prisma ORM
- **Forms**: React Hook Form with Zod validation
- **UI Components**: Custom components with Lucide React icons
- **Charts**: Recharts
- **Date Handling**: date-fns
- **Styling**: Tailwind CSS with custom components
- **Animation**: Framer Motion

## Project Structure
```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Base UI components (Button, Card, etc.)
│   ├── forms/           # Form components
│   ├── billing/         # Billing-related components
│   ├── calendar/        # Calendar components
│   ├── charts/          # Chart components
│   └── layout/          # Layout components (Header, Sidebar, etc.)
├── pages/               # Page components
├── hooks/               # Custom React hooks
├── services/            # API and service layers
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
├── contexts/            # React contexts
├── config/              # Configuration files
├── assets/              # Static assets
└── data/                # Static data files
```

## Key Features
- **Patient Management**: OPD/IPD patient registration and management
- **Bed Management**: Room and bed allocation system
- **Billing System**: Comprehensive billing for OPD/IPD patients
- **Appointment System**: Future appointments scheduling
- **Consent Forms**: Multiple medical consent forms
- **Reports & Analytics**: Real-time dashboard with charts
- **Medical Records**: Clinical records, medication charts, vital signs
- **Backup System**: Database backup and restore functionality

## Development Guidelines

### CRITICAL RULE - File Investigation First
- **ALWAYS identify and read the specific file being used before making ANY changes**
- **When asked to modify functionality, first locate the exact file implementing that feature**
- Use search tools (Grep, Glob) to find relevant files
- Read the current implementation before suggesting changes

### Core Principles
- Do what has been asked; nothing more, nothing less
- NEVER create files unless they're absolutely necessary for achieving your goal
- ALWAYS prefer editing an existing file to creating a new one
- NEVER proactively create documentation files (*.md) or README files unless explicitly requested
- Follow existing code patterns and conventions in the specific file you're editing
- Use TypeScript strictly - maintain all existing type definitions
- Maintain consistent code style within each file

### Code Quality Standards
- Run `npm run lint` and `npm run build:typecheck` before completing tasks
- Verify changes don't break existing functionality
- Test in development environment
- Follow existing import patterns and component structure
- Maintain proper error handling and loading states
- Use existing UI components from `src/components/ui/`

### Environment Configuration
- Uses Supabase for backend services
- Environment variables defined in `.env` (see `.env.example`)
- Vite as build tool and development server
- ESLint and TypeScript for code quality

## File Location Strategy
When asked to modify features, use these common locations:
- **Dashboard**: `src/components/RealTimeDashboard.tsx`
- **Patient Entry**: `src/pages/PatientEntry.tsx` or `src/components/forms/`
- **Patient List**: `src/pages/Patients/` directory
- **Billing**: `src/components/billing/` directory
- **UI Components**: `src/components/ui/` directory
- **Layout**: `src/components/layout/` directory
- **Services**: `src/services/` directory
- **Types**: `src/types/` directory

## Testing Approach
- Check README.md or package.json for specific test commands
- Verify functionality in development mode before building
- Test responsive design on different screen sizes
- Validate form submissions and data persistence

## Complete Patient Record System

### Overview
The Complete Patient Record system provides comprehensive medical record management with 6 main sections:
- **High Risk**: Patient risk factors, allergies, and medical history
- **Chief Complaints**: Primary patient complaints with duration and severity
- **Examination**: Physical examination findings and assessments  
- **Investigation**: Laboratory tests, imaging, and diagnostic results
- **Diagnosis**: Primary and secondary diagnoses with treatment plans
- **Enhanced Prescription**: Detailed medication management with dosing

### Database Integration
**Status**: ✅ FIXED - Database tables created and integrated
**Implementation**: Uses standalone table structure for optimal performance

**Database Tables Created**:
- `patient_high_risk` - Risk factors and medical history
- `patient_chief_complaints` - Patient complaint records
- `patient_examination` - Physical examination data
- `patient_investigation` - Diagnostic test results
- `patient_diagnosis` - Medical diagnoses and treatments
- `patient_enhanced_prescription` - Medication prescriptions
- `patient_record_summary` - Record summaries
- `custom_complaints` - User-defined complaint options
- `custom_doctors` - User-defined doctor options

**Service Layer**: `src/services/completePatientRecordService.ts`
- Comprehensive error handling and logging
- Automatic data validation and transformation
- Support for custom complaints and doctors
- Integration with existing prescription templates

**Setup Instructions**:
1. Run `CREATE_STANDALONE_PATIENT_RECORD_TABLES.sql` in your Supabase database
2. Verify tables are created successfully
3. Test Complete Patient Record functionality through patient management

**Affected Components**:
- `SimpleEnhancedPatientRecord.tsx` - Main record management interface
- `ValantPrescription.tsx` - Valant prescription template integration
- `VHPrescription.tsx` - VH prescription template integration  
- `Valant2Prescription.tsx` - Valant2 prescription template integration

Remember: Always investigate which file contains the functionality you need to modify BEFORE making any changes!