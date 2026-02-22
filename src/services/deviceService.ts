// Device Service — Framework for external device integration
// Provides interfaces and base implementations for thermal printers and biometric scanners

export interface PrintJob {
  type: 'receipt' | 'label' | 'report' | 'token';
  content: string;
  copies?: number;
  printerName?: string;
}

export interface PrintResult {
  success: boolean;
  jobId?: string;
  error?: string;
}

export interface BiometricResult {
  success: boolean;
  templateData?: string;
  matchScore?: number;
  error?: string;
}

export interface DeviceInfo {
  name: string;
  type: 'printer' | 'biometric' | 'barcode' | 'card_reader';
  status: 'connected' | 'disconnected' | 'error';
  details?: string;
}

// Printer Service Interface
export interface IPrinterService {
  isAvailable(): Promise<boolean>;
  getDevices(): Promise<DeviceInfo[]>;
  print(job: PrintJob): Promise<PrintResult>;
  printReceipt(data: ReceiptData): Promise<PrintResult>;
  printToken(data: TokenData): Promise<PrintResult>;
}

// Biometric Service Interface
export interface IBiometricService {
  isAvailable(): Promise<boolean>;
  capture(): Promise<BiometricResult>;
  verify(templateData: string): Promise<BiometricResult>;
}

export interface ReceiptData {
  hospitalName: string;
  patientName: string;
  patientId: string;
  items: Array<{ description: string; amount: number }>;
  totalAmount: number;
  paymentMode: string;
  date: string;
  receiptNumber: string;
}

export interface TokenData {
  tokenNumber: string;
  patientName: string;
  department: string;
  doctorName: string;
  date: string;
  queuePosition?: number;
}

// Browser Print Service — uses window.print() as fallback
class BrowserPrinterService implements IPrinterService {
  async isAvailable(): Promise<boolean> {
    return typeof window !== 'undefined' && typeof window.print === 'function';
  }

  async getDevices(): Promise<DeviceInfo[]> {
    return [{
      name: 'Browser Print',
      type: 'printer',
      status: 'connected',
      details: 'Uses browser print dialog',
    }];
  }

  async print(job: PrintJob): Promise<PrintResult> {
    try {
      const printWindow = window.open('', '_blank', 'width=400,height=600');
      if (!printWindow) return { success: false, error: 'Popup blocked' };

      printWindow.document.write(`
        <html><head><title>${job.type}</title>
        <style>body { font-family: monospace; font-size: 12px; margin: 10px; }</style>
        </head><body>${job.content}</body></html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();

      return { success: true, jobId: `browser_${Date.now()}` };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async printReceipt(data: ReceiptData): Promise<PrintResult> {
    const itemsHtml = data.items
      .map(item => `<tr><td>${item.description}</td><td style="text-align:right">Rs. ${item.amount.toLocaleString()}</td></tr>`)
      .join('');

    const content = `
      <div style="width:280px; font-family:monospace; font-size:11px;">
        <h3 style="text-align:center; margin:0;">${data.hospitalName}</h3>
        <hr/>
        <p>Receipt #: ${data.receiptNumber}<br/>Date: ${data.date}</p>
        <p>Patient: ${data.patientName}<br/>ID: ${data.patientId}</p>
        <hr/>
        <table style="width:100%">${itemsHtml}</table>
        <hr/>
        <p style="text-align:right"><strong>Total: Rs. ${data.totalAmount.toLocaleString()}</strong></p>
        <p>Payment: ${data.paymentMode}</p>
        <hr/>
        <p style="text-align:center; font-size:9px;">Thank you for visiting!</p>
      </div>
    `;
    return this.print({ type: 'receipt', content });
  }

  async printToken(data: TokenData): Promise<PrintResult> {
    const content = `
      <div style="width:280px; font-family:monospace; text-align:center;">
        <h2 style="margin:5px 0;">TOKEN #${data.tokenNumber}</h2>
        <hr/>
        <p><strong>${data.patientName}</strong></p>
        <p>Department: ${data.department}</p>
        <p>Doctor: ${data.doctorName}</p>
        <p>Date: ${data.date}</p>
        ${data.queuePosition ? `<p>Queue Position: ${data.queuePosition}</p>` : ''}
        <hr/>
        <p style="font-size:9px;">Please wait for your turn</p>
      </div>
    `;
    return this.print({ type: 'token', content });
  }
}

// Stub Biometric Service — placeholder for hardware integration
class StubBiometricService implements IBiometricService {
  async isAvailable(): Promise<boolean> {
    return false;
  }

  async capture(): Promise<BiometricResult> {
    return { success: false, error: 'Biometric device not connected. Please install the device driver.' };
  }

  async verify(_templateData: string): Promise<BiometricResult> {
    return { success: false, error: 'Biometric device not connected.' };
  }
}

// Singleton instances
export const printerService: IPrinterService = new BrowserPrinterService();
export const biometricService: IBiometricService = new StubBiometricService();

// Device manager for centralized device status
class DeviceManager {
  async getAllDevices(): Promise<DeviceInfo[]> {
    const devices: DeviceInfo[] = [];

    const printerDevices = await printerService.getDevices();
    devices.push(...printerDevices);

    const bioAvailable = await biometricService.isAvailable();
    devices.push({
      name: 'Biometric Scanner',
      type: 'biometric',
      status: bioAvailable ? 'connected' : 'disconnected',
    });

    return devices;
  }
}

export const deviceManager = new DeviceManager();
export default deviceManager;
