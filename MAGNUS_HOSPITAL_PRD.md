# Magnus Hospital - Product Requirements Document (PRD)
## Based on Indic Labs Contract (Rs. 2,50,000 | 12 Weeks)

**Date:** February 16, 2026  
**Project:** Magnus Hospital Management System  
**Contract:** Indic Labs (Rs. 2,50,000, 12 weeks)  
**Compliance:** IT Act 2000, DPDP 2023, ABDM, HIPAA  
**Source Code:** Seva Sangrah HMS (Existing Production System)

---

## 📊 Executive Summary

### Current State Analysis
- **Existing System**: "Seva Sangrah" HMS - Production-ready React + TypeScript + Vite + Supabase application
- **Live Deployment**: `https://core-hms.vercel.app` (Vercel)
- **Database**: Supabase (`plkbxjedbjpmbfrekmrr.supabase.co`) with core tables populated
- **Codebase Status**: Comprehensive HMS with 65+ components, 20+ pages, full CRUD operations
- **Development Strategy**: Test in main repo → Deploy to Magnus fork for client delivery

### Gap Analysis (Current vs Contract Requirements)
| Requirement | Current Status | Gap | Priority |
|-------------|---------------|-----|----------|
| **Core HMS** | ✅ 100% Complete | None | P0 |
| **Patient Management** | ✅ 95% Complete | Minor UI/UX polish | P1 |
| **IPD Bed Management** | ✅ 90% Complete | Real-time sync enhancements | P1 |
| **Billing System** | ✅ 95% Complete | Multi-currency support | P2 |
| **Compliance (IT Act, DPDP)** | ⚠️ 70% Complete | Audit logs, data retention policies | P0 |
| **ABDM Integration** | ❌ 0% Complete | ABHA number generation, linking | P0 |
| **HIPAA Compliance** | ⚠️ 50% Complete | Encryption, access controls | P0 |
| **WhatsApp/SMS Integration** | ⚠️ 40% Complete | API integration, templates | P1 |
| **Email Services** | ⚠️ 50% Complete | Template system, bulk sending | P1 |

---

## 🎯 Contract Requirements Mapping

### **1. Compliance Modules (P0 - Critical)**
#### IT Act 2000 & DPDP 2023
- [ ] **Audit Log System**: Complete user action tracking
- [ ] **Data Retention Policies**: Automated data archival/deletion
- [ ] **Consent Management**: Patient consent forms and tracking
- [ ] **Data Portability**: Export patient data in standard formats
- [ ] **Breach Notification**: Automated alert system

#### ABDM (Ayushman Bharat Digital Mission)
- [ ] **ABHA Number Generation**: Integration with ABDM APIs
- [ ] **Health Record Linking**: PHR address management
- [ ] **Consent Artefacts**: Digital consent for data sharing
- [ ] **Health Information Exchange**: FHIR/HL7 compatibility

#### HIPAA Compliance
- [ ] **Data Encryption**: At-rest and in-transit encryption
- [ ] **Access Controls**: Role-based with minimum privilege
- [ ] **Audit Trails**: Comprehensive access logging
- [ ] **Business Associate Agreements**: Template management

### **2. Core Feature Enhancements (P1 - High)**
#### Patient Management
- [ ] **UHID System**: Auto-generation with configurable formats
- [ ] **Aadhaar Integration**: Verification and linking
- [ ] **Biometric Support**: Optional fingerprint/face recognition
- [ ] **Advanced Search**: Multi-criteria patient lookup

#### Communication Module
- [ ] **WhatsApp Business API**: Appointment reminders, reports
- [ ] **SMS Gateway**: Transactional and promotional SMS
- [ ] **Email Templates**: Customizable templates with variables
- [ ] **Bulk Communication**: Batch sending for campaigns

#### Billing & Finance
- [ ] **Multi-currency Support**: INR + other currencies
- [ ] **Insurance Integration**: TPA and cashless processing
- [ ] **Advanced Reporting**: Custom report builder
- [ ] **Tally Integration**: Optional add-on (additional cost)

### **3. User Experience (P2 - Medium)**
- [ ] **Mobile Responsive**: Optimized for tablet/mobile use
- [ ] **Offline Mode**: Basic functionality without internet
- [ ] **Performance Optimization**: Reduced load times
- [ ] **Accessibility**: WCAG 2.1 compliance

---

## 🗓️ 12-Week Implementation Roadmap

### **Phase 1: Foundation & Compliance (Weeks 1-4)**
**Goal:** Establish compliant foundation

**Week 1-2: Compliance Framework**
- Setup audit logging system
- Implement data retention policies
- Create consent management module
- Basic ABDM API integration

**Week 3-4: Security & Data Protection**
- Implement encryption at all levels
- Enhance role-based access controls
- Setup breach notification system
- HIPAA compliance documentation

### **Phase 2: Core Enhancements (Weeks 5-8)**
**Goal:** Enhance core functionality

**Week 5-6: Patient Management**
- UHID auto-generation system
- Aadhaar verification integration
- Advanced search capabilities
- Patient portal enhancements

**Week 7-8: Communication Module**
- WhatsApp Business API integration
- SMS gateway implementation
- Email template system
- Bulk communication tools

### **Phase 3: Polish & Deployment (Weeks 9-12)**
**Goal:** Polish and prepare for handover

**Week 9-10: User Experience**
- Mobile responsiveness optimization
- Performance improvements
- Accessibility enhancements
- User training materials

**Week 11-12: Testing & Handover**
- Comprehensive testing (unit, integration, UAT)
- Documentation completion
- Client training sessions
- Production deployment to Magnus fork

---

## 🏗️ Technical Architecture

### **Current Stack (Seva Sangrah)**
- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand + React Query
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel
- **Monitoring**: Custom logging + error tracking

### **Proposed Enhancements**
1. **Backend Services**: Node.js microservices for compliance modules
2. **Message Queue**: Redis for async communication tasks
3. **File Storage**: Supabase Storage with encryption
4. **Monitoring**: Sentry for error tracking
5. **CI/CD**: GitHub Actions for automated testing/deployment

### **Database Schema Updates**
```sql
-- New tables needed
CREATE TABLE audit_logs (...);          -- Compliance
CREATE TABLE consent_records (...);     -- DPDP compliance  
CREATE TABLE abha_registrations (...);  -- ABDM integration
CREATE TABLE communication_logs (...);  -- WhatsApp/SMS/Email
CREATE TABLE data_retention_policies (...); -- IT Act compliance
```

---

## 🔐 Security & Compliance Implementation

### **Data Protection (DPDP 2023)**
1. **Data Classification**: Personal, sensitive, critical data tagging
2. **Consent Management**: Digital consent with expiry tracking
3. **Right to Erasure**: Automated data deletion workflows
4. **Data Portability**: JSON/PDF export of patient records

### **ABDM Integration**
1. **ABHA Generation**: Direct API integration with ABDM
2. **Health Locker**: PHR address management
3. **Consent Artefacts**: Digital consent for data sharing
4. **FHIR Compatibility**: HL7 FHIR R4 for health data exchange

### **HIPAA Controls**
1. **Encryption**: AES-256 for data at rest, TLS 1.3 for transit
2. **Access Logging**: Complete audit trail of all access
3. **Backup Encryption**: Encrypted backups with key rotation
4. **Incident Response**: Automated breach detection and reporting

---

## 📈 Success Metrics

### **Technical Metrics**
- [ ] Page load time < 2 seconds
- [ ] API response time < 200ms
- [ ] 99.9% uptime SLA
- [ ] Zero critical security vulnerabilities

### **Business Metrics**
- [ ] Patient registration time reduced by 50%
- [ ] Billing processing time reduced by 40%
- [ ] Communication cost reduced by 30%
- [ ] Compliance audit passing rate 100%

### **User Satisfaction**
- [ ] System Usability Scale (SUS) > 80
- [ ] Net Promoter Score (NPS) > 50
- [ ] Training time < 4 hours per user
- [ ] Support tickets reduced by 60%

---

## 🚀 Next Immediate Actions

### **Week 1 Tasks (Starting Today)**
1. **Database Analysis**: Complete schema review and gap analysis
2. **Compliance Audit**: Current state vs requirements assessment
3. **ABDM API Setup**: Register for ABDM developer access
4. **Communication APIs**: Setup WhatsApp Business, SMS gateway accounts
5. **Fork Creation**: Create Magnus-specific GitHub repository

### **Development Environment**
1. **Local Setup**: Complete development environment
2. **Testing Suite**: Unit, integration, and E2E tests
3. **CI/CD Pipeline**: Automated testing and deployment
4. **Monitoring Setup**: Error tracking and performance monitoring

---

## 💰 Budget Allocation (Rs. 2,50,000)

| Phase | Weeks | Cost (INR) | Deliverables |
|-------|-------|------------|--------------|
| **Phase 1: Compliance** | 1-4 | 80,000 | Audit system, ABDM integration, Security controls |
| **Phase 2: Core Features** | 5-8 | 90,000 | UHID system, Communication module, Billing enhancements |
| **Phase 3: Polish & Handover** | 9-12 | 60,000 | Mobile optimization, Testing, Documentation, Training |
| **Contingency** | - | 20,000 | Risk mitigation, Additional features |
| **TOTAL** | **12** | **2,50,000** | **Complete HMS with Compliance** |

---

## 🎯 Risk Mitigation

### **Technical Risks**
1. **API Integration Delays**: Have fallback manual processes
2. **Performance Issues**: Implement progressive loading, caching
3. **Security Vulnerabilities**: Regular penetration testing, bug bounty

### **Project Risks**
1. **Scope Creep**: Strict change control process
2. **Timeline Slippage**: Weekly milestones with buffer time
3. **Resource Constraints**: Prioritize must-have features first

### **Compliance Risks**
1. **Regulatory Changes**: Modular design for easy updates
2. **Audit Failures**: Pre-audit testing with compliance experts
3. **Data Breaches**: Comprehensive incident response plan

---

## 📞 Contact & Coordination

**Project Lead**: Andy (AI Assistant)  
**Development Team**: 2 Full-Stack Developers  
**QA**: 1 Part-time Tester  
**Client Point of Contact**: Magnus Hospital Administration  
**Weekly Status Meetings**: Monday 10 AM IST  
**Communication Channel**: Telegram + GitHub Projects

---

*This PRD will be updated weekly based on progress and client feedback.*
*Last Updated: February 16, 2026*