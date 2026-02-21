import { jsPDF } from 'jspdf';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';
import logger from '../utils/logger';

export class PDFService {
  private static ensureDir(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  static async generateMedicalCertificate(data: {
    certificateNumber: string;
    certificateType: string;
    patientName: string;
    patientAge?: number;
    patientGender?: string;
    uhid?: string;
    doctorName: string;
    diagnosis: string;
    startDate: string;
    endDate: string;
    durationDays: number;
    restrictions?: string;
    recommendations?: string;
    additionalNotes?: string;
    purpose?: string;
    disabilityPercentage?: number;
    natureOfDisability?: string;
  }): Promise<string> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('MEDICAL CERTIFICATE', pageWidth / 2, 25, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Certificate No: ${data.certificateNumber}`, pageWidth / 2, 33, { align: 'center' });

    // Horizontal line
    doc.setDrawColor(0);
    doc.line(20, 37, pageWidth - 20, 37);

    let y = 47;
    const leftMargin = 25;
    const labelWidth = 45;

    const addField = (label: string, value: string) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`${label}:`, leftMargin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(value || 'N/A', leftMargin + labelWidth, y);
      y += 8;
    };

    // Certificate type
    const typeLabel = data.certificateType === 'sick_leave' ? 'SICK LEAVE CERTIFICATE' :
      data.certificateType === 'fitness' ? 'FITNESS CERTIFICATE' :
        'DISABILITY CERTIFICATE';

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(typeLabel, pageWidth / 2, y, { align: 'center' });
    y += 15;

    // Patient details
    addField('Patient Name', data.patientName);
    if (data.patientAge) addField('Age / Gender', `${data.patientAge} years / ${data.patientGender || 'N/A'}`);
    if (data.uhid) addField('UHID', data.uhid);
    addField('Diagnosis', data.diagnosis);
    addField('Period', `${data.startDate} to ${data.endDate} (${data.durationDays} days)`);

    if (data.certificateType === 'disability') {
      if (data.disabilityPercentage) addField('Disability %', `${data.disabilityPercentage}%`);
      if (data.natureOfDisability) addField('Nature', data.natureOfDisability);
    }

    if (data.restrictions) {
      y += 5;
      addField('Restrictions', '');
      y -= 8;
      const lines = doc.splitTextToSize(data.restrictions, pageWidth - leftMargin - 30);
      doc.setFont('helvetica', 'normal');
      doc.text(lines, leftMargin + labelWidth, y);
      y += lines.length * 6 + 5;
    }

    if (data.recommendations) {
      addField('Recommendations', '');
      y -= 8;
      const lines = doc.splitTextToSize(data.recommendations, pageWidth - leftMargin - 30);
      doc.setFont('helvetica', 'normal');
      doc.text(lines, leftMargin + labelWidth, y);
      y += lines.length * 6 + 5;
    }

    if (data.additionalNotes) {
      addField('Notes', '');
      y -= 8;
      const lines = doc.splitTextToSize(data.additionalNotes, pageWidth - leftMargin - 30);
      doc.setFont('helvetica', 'normal');
      doc.text(lines, leftMargin + labelWidth, y);
      y += lines.length * 6 + 5;
    }

    // Signature area
    y = Math.max(y + 20, 220);
    doc.setFontSize(10);
    doc.line(leftMargin, y, leftMargin + 60, y);
    doc.text('Doctor Signature', leftMargin, y + 6);
    doc.text(`Dr. ${data.doctorName}`, leftMargin, y + 12);

    doc.line(pageWidth - 85, y, pageWidth - 25, y);
    doc.text('Date & Seal', pageWidth - 85, y + 6);
    doc.text(new Date().toLocaleDateString('en-IN'), pageWidth - 85, y + 12);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text('This is a computer-generated certificate. Valid with doctor\'s signature and hospital seal.', pageWidth / 2, 285, { align: 'center' });

    // Save
    const certDir = path.join(env.UPLOAD_DIR, 'certificates');
    this.ensureDir(certDir);
    const fileName = `${data.certificateNumber}.pdf`;
    const filePath = path.join(certDir, fileName);
    const buffer = Buffer.from(doc.output('arraybuffer'));
    fs.writeFileSync(filePath, buffer);

    logger.info({ certificateNumber: data.certificateNumber, filePath }, 'Medical certificate PDF generated');
    return `/uploads/certificates/${fileName}`;
  }

  static async generateDischargeSummary(data: {
    patientName: string;
    uhid?: string;
    admissionDate: string;
    dischargeDate: string;
    diagnosis: string;
    treatmentGiven?: string;
    dischargeMedications?: string;
    followUpInstructions?: string;
    doctorName: string;
  }): Promise<string> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('DISCHARGE SUMMARY', pageWidth / 2, 25, { align: 'center' });
    doc.line(20, 30, pageWidth - 20, 30);

    let y = 42;
    const leftMargin = 25;

    const addSection = (title: string, content: string) => {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(title, leftMargin, y);
      y += 6;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(content || 'N/A', pageWidth - 50);
      doc.text(lines, leftMargin, y);
      y += lines.length * 5 + 8;

      if (y > 270) {
        doc.addPage();
        y = 25;
      }
    };

    addSection('Patient', `${data.patientName}${data.uhid ? ` (UHID: ${data.uhid})` : ''}`);
    addSection('Admission Date', data.admissionDate);
    addSection('Discharge Date', data.dischargeDate);
    addSection('Diagnosis', data.diagnosis);
    if (data.treatmentGiven) addSection('Treatment Given', data.treatmentGiven);
    if (data.dischargeMedications) addSection('Discharge Medications', data.dischargeMedications);
    if (data.followUpInstructions) addSection('Follow-Up Instructions', data.followUpInstructions);
    addSection('Attending Physician', `Dr. ${data.doctorName}`);

    const certDir = path.join(env.UPLOAD_DIR, 'certificates');
    this.ensureDir(certDir);
    const fileName = `discharge-${data.uhid || Date.now()}-${Date.now()}.pdf`;
    const filePath = path.join(certDir, fileName);
    const buffer = Buffer.from(doc.output('arraybuffer'));
    fs.writeFileSync(filePath, buffer);

    return `/uploads/certificates/${fileName}`;
  }
}
