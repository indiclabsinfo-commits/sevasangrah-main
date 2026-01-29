# Implementation Plan & Roadmap: Magnus Hospital

This document details the complete feature set required for the Magnus Hospital HMS project.

## Project Scope: 14 Core Modules

## 🎯 Current Status: 65% Complete
**Good News:** The core HMS is largely operational.

### Already Delivered (Functioning) ✅
- [x] **Core HMS**: Patient Registration, Lists, Appointments.
- [x] **IPD Bed Management**: Room allocation (40 beds), Ward view.
- [x] **Billing System**: OPD/IPD Billing, Receipts,Refunds.
- [x] **Financials**: Expense Tracking, Operations Ledger.
- [x] **Dashboard**: Basic Analytics & Revenue charts.
- [x] **Security**: Role-based access control (RBAC), Audit logs.

### Pending Implementation (To-Do) 🚧


### Module 1: OPD Management
- [ ] Patient Registration (Demographics, National ID)
- [ ] Doctor Consultation Management & Scheduling
- [ ] Patient Search & Digital Medical Records
- [ ] Prescription System (Multiple Templates)
- [ ] Chief Complaints, Examination & Diagnosis
- [ ] Patient Photo Upload & Enhanced Document Upload
- [ ] WhatsApp & SMS Notifications (Reminders/Follow-ups)
- [ ] Medical Certificate & Discharge Summary Automation
- [ ] ABHA Linking/Creation & UHID Generation
- [ ] Queue Management (Token Display, Waiting Time)
- [ ] Referral Management & Share Records with Affiliates
- [ ] Offline Mode Registration Support

### Module 2: IPD Management
- [ ] Admission Process (Room Allocation, Bed Tracking)
- [ ] Initial Assessment & Nursing Notes
- [ ] e-Prescription (CPOE) & Order Sets
- [ ] Digital Handover (Shift Change)
- [ ] Emergency Codes & ML Labeling
- [ ] Vitals Tracking & I/O Charts
- [ ] Surgery Management (Scheduling, Checklist, Notes)
- [ ] Discharge Process (Summary, Bill Generation)
- [ ] Ward Management (50 Beds) & Occupancy Dashboard

### Module 3: Billing & Accounts
- [ ] OPD & IPD Billing (Combined)
- [ ] Receipt Generation & Refund Processing
- [ ] Payment Modes, Deposit Management
- [ ] Expense Tracking & Operations Ledger
- [ ] Financial Dashboard & GST Invoice Generation

### Module 4: Tally Integration
- [ ] Automatic Voucher Generation
- [ ] Real-time Sync to Tally
- [ ] Sales, Payment, & Receipt Vouchers
- [ ] Ledger Mapping & Reconciliation Reports

### Module 5: Reports & Analytics
- [ ] Real-time Dashboard (Revenue, Bed Occupancy)
- [ ] Patient Statistics & Doctor-wise Revenue
- [ ] Custom Report Builder & Export (PDF/Excel)

### Module 6: Pharmacy Management
- [ ] Medicine Master & Stock Management
- [ ] Purchase Management (GRN, Supplier, Invoices)
- [ ] Billing Integration & Sales Reports
- [ ] Expiry Tracking & Low Stock Alerts
- [ ] Narcotic/High-Risk Medication Tracking
- [ ] eMAR (Electronic Medication Administration Record)

### Module 7: Inventory (General)
- [ ] Item Master & Stock In/Out Management
- [ ] Purchase Orders & Indent Generation
- [ ] Vendor Invoice Management & Payment Scheduling
- [ ] Asset Management & Maintenance Tracking

### Module 8: HRM (Human Resources)
- [ ] Employee Master, Roles & Access Control
- [ ] Attendance Tracking & Leave Management
- [ ] Payroll Calculation (Allowances, Deductions, PF/ESI)
- [ ] Salary Slip Generation & Email Delivery
- [ ] Shift Management & Roster

### Module 9: Security & Access Control
- [ ] Role-Based Access Control (RBAC) & 2FA
- [ ] Audit Logs & Data Encryption
- [ ] Auto-logout & Session Management
- [ ] Regular Backups & Disaster Recovery

### Module 10: Floor Management & Nurse Station
- [ ] Floor Occupancy Dashboard
- [ ] Nurse Duty Management & Patient Alignment
- [ ] Housekeeping Tracking

### Module 11: Laboratory Management (Software Only)
- [ ] Test Master (Pathology, Radiology)
- [ ] Sample Registration & Tracking
- [ ] Result Entry & Report Generation
- [ ] Email/SMS Delivery of Reports

### Module 12: NABH/ABHA Compliance
- [ ] Patient Safety & Infection Control Checklists
- [ ] Incident Reporting & Complaint Management
- [ ] ABHA Compliance Checklist & FHIR Integration
- [ ] Quality Indicators & Audit Reports

### Module 13: Blood Bank System
- [ ] Donor Records & Stock Management
- [ ] Transfusion Safety & TAT Calculation

### Module 14: Communication Services
- [ ] WhatsApp Business API & SMS Gateway Setup
- [ ] Automated Notifications (Appointments, Billing, Discharge)
- [ ] Template Management

## How to Implement (Step-by-Step)

1.  **Module Initialization**: For each new module, create a dedicated folder in `packages/` if it's a shared library, or `apps/` if it's a standalone service.
2.  **Database Schema**: Define the Prisma models in `backend/prisma/schema.prisma`. Always include `orgId` for multi-tenancy.
3.  **API Development**: Create REST endpoints in `backend/src/modules/[module_name]`. Use `saasService` to validate tenant access.
4.  **Frontend Integration**: Build UI components in `apps/web/src/modules/[module_name]`. Wrap features with `isModuleEnabled` check.
5.  **Testing**: Write unit tests for critical logic (e.g., billing calculations).
6.  **Code Review**: Push to a `feat/` branch and request review.
