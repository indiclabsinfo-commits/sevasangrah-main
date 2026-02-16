import React, { useState } from 'react';
import toast from 'react-hot-toast';

interface ABHALinkingModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId?: string;
  currentAadhaar?: string;
  currentABHA?: string;
  onLinkSuccess?: (abhaData: { abhaNumber: string; abhaAddress: string }) => void;
}

const ABHALinkingModal: React.FC<ABHALinkingModalProps> = ({
  isOpen,
  onClose,
  patientId,
  currentAadhaar = '',
  currentABHA = '',
  onLinkSuccess
}) => {
  const [step, setStep] = useState<'aadhaar' | 'otp' | 'consent' | 'success'>('aadhaar');
  const [aadhaarNumber, setAadhaarNumber] = useState(currentAadhaar);
  const [otp, setOtp] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  const [generatedABHA, setGeneratedABHA] = useState('');
  const [generatedABHAAddress, setGeneratedABHAAddress] = useState('');
  const [loading, setLoading] = useState(false);

  // Mock ABHA generation (in real system, this would come from ABDM API)
  const generateMockABHA = (aadhaar: string) => {
    // Extract last 10 digits of Aadhaar for ABHA number
    const base = aadhaar.slice(-10);
    const abhaNumber = `14${base}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;
    
    // Create ABHA address (username@abdm)
    const randomId = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const abhaAddress = `user${randomId}@abdm`;
    
    return { abhaNumber, abhaAddress };
  };

  const handleAadhaarSubmit = () => {
    if (!aadhaarNumber || aadhaarNumber.length !== 12 || !/^\d{12}$/.test(aadhaarNumber)) {
      toast.error('Please enter a valid 12-digit Aadhaar number');
      return;
    }

    // In real system: Send OTP to registered mobile linked with Aadhaar
    // For mock: Generate a 6-digit OTP
    const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[MOCK] OTP for Aadhaar ${aadhaarNumber}: ${mockOtp}`);
    
    toast.success(`OTP sent to mobile linked with Aadhaar (Mock OTP: ${mockOtp})`);
    setStep('otp');
  };

  const handleOtpSubmit = () => {
    if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setStep('consent');
  };

  const handleConsentSubmit = () => {
    if (!consentGiven) {
      toast.error('You must give consent to create ABHA');
      return;
    }

    setLoading(true);
    
    // Mock API call to create ABHA
    setTimeout(() => {
      const { abhaNumber, abhaAddress } = generateMockABHA(aadhaarNumber);
      setGeneratedABHA(abhaNumber);
      setGeneratedABHAAddress(abhaAddress);
      setStep('success');
      setLoading(false);
      
      toast.success('ABHA created successfully!');
    }, 1500);
  };

  const handleComplete = () => {
    if (onLinkSuccess && generatedABHA && generatedABHAAddress) {
      onLinkSuccess({
        abhaNumber: generatedABHA,
        abhaAddress: generatedABHAAddress
      });
    }
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setStep('aadhaar');
    setAadhaarNumber(currentAadhaar);
    setOtp('');
    setConsentGiven(false);
    setGeneratedABHA('');
    setGeneratedABHAAddress('');
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '30px',
        width: '90%',
        maxWidth: '500px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#0056B3',
            margin: 0
          }}>
            {step === 'aadhaar' && 'Link Aadhaar to ABHA'}
            {step === 'otp' && 'Verify OTP'}
            {step === 'consent' && 'Consent for ABHA'}
            {step === 'success' && 'ABHA Created Successfully!'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        {/* Step indicator */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '30px',
          position: 'relative'
        }}>
          {['aadhaar', 'otp', 'consent', 'success'].map((s, index) => (
            <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: step === s ? '#0056B3' : (index < ['aadhaar', 'otp', 'consent', 'success'].indexOf(step) ? '#0056B3' : '#E5E7EB'),
                color: step === s ? 'white' : (index < ['aadhaar', 'otp', 'consent', 'success'].indexOf(step) ? 'white' : '#9CA3AF'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '14px'
              }}>
                {index + 1}
              </div>
              <div style={{
                fontSize: '12px',
                color: step === s ? '#0056B3' : '#9CA3AF',
                marginTop: '8px',
                textAlign: 'center',
                fontWeight: step === s ? '600' : '400'
              }}>
                {s === 'aadhaar' && 'Aadhaar'}
                {s === 'otp' && 'OTP'}
                {s === 'consent' && 'Consent'}
                {s === 'success' && 'Success'}
              </div>
            </div>
          ))}
          {/* Connecting line */}
          <div style={{
            position: 'absolute',
            top: '18px',
            left: '18px',
            right: '18px',
            height: '2px',
            backgroundColor: '#E5E7EB',
            zIndex: 1
          }} />
        </div>

        {/* Step 1: Aadhaar Input */}
        {step === 'aadhaar' && (
          <div>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Enter patient's Aadhaar number to create or link ABHA (Ayushman Bharat Health Account).
            </p>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#333',
                marginBottom: '8px'
              }}>
                Aadhaar Number
              </label>
              <input
                type="text"
                value={aadhaarNumber}
                onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                placeholder="Enter 12-digit Aadhaar number"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: `1px solid ${aadhaarNumber.length === 12 ? '#22C55E' : '#CCCCCC'}`,
                  fontSize: '16px',
                  color: '#333333',
                  outline: 'none',
                  fontFamily: 'monospace'
                }}
              />
              {aadhaarNumber.length === 12 && (
                <div style={{
                  fontSize: '14px',
                  color: '#22C55E',
                  marginTop: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>✓</span>
                  <span>Valid format (Verhoeff check would run on submit)</span>
                </div>
              )}
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              marginTop: '30px'
            }}>
              <button
                onClick={onClose}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: '1px solid #CCCCCC',
                  backgroundColor: 'white',
                  color: '#666',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAadhaarSubmit}
                disabled={aadhaarNumber.length !== 12}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: aadhaarNumber.length === 12 ? '#0056B3' : '#CCCCCC',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: aadhaarNumber.length === 12 ? 'pointer' : 'not-allowed'
                }}
              >
                Send OTP
              </button>
            </div>
          </div>
        )}

        {/* Step 2: OTP Verification */}
        {step === 'otp' && (
          <div>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Enter the 6-digit OTP sent to the mobile number linked with Aadhaar ending with 
              <strong> {aadhaarNumber.slice(-4)}</strong>.
              <br />
              <small style={{ color: '#888', fontSize: '13px' }}>
                (Mock system: Check console for OTP)
              </small>
            </p>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#333',
                marginBottom: '8px'
              }}>
                6-digit OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit OTP"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: `1px solid ${otp.length === 6 ? '#22C55E' : '#CCCCCC'}`,
                  fontSize: '24px',
                  color: '#333333',
                  outline: 'none',
                  fontFamily: 'monospace',
                  textAlign: 'center',
                  letterSpacing: '8px'
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'space-between',
              marginTop: '30px'
            }}>
              <button
                onClick={() => setStep('aadhaar')}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: '1px solid #CCCCCC',
                  backgroundColor: 'white',
                  color: '#666',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Back
              </button>
              <button
                onClick={handleOtpSubmit}
                disabled={otp.length !== 6}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: otp.length === 6 ? '#0056B3' : '#CCCCCC',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: otp.length === 6 ? 'pointer' : 'not-allowed'
                }}
              >
                Verify OTP
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Consent */}
        {step === 'consent' && (
          <div>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Please review and provide consent for ABHA creation:
            </p>
            
            <div style={{
              backgroundColor: '#F9FAFB',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              <h4 style={{ color: '#333', marginBottom: '12px' }}>Consent for ABHA Creation</h4>
              <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.6' }}>
                1. I consent to create an Ayushman Bharat Health Account (ABHA) using my Aadhaar number.<br />
                2. I understand that ABHA will be used to link my health records across healthcare providers.<br />
                3. I consent to share my demographic details from Aadhaar for ABHA creation.<br />
                4. I understand that I can manage consent for health data sharing through the ABHA app.<br />
                5. I acknowledge that this is for demonstration purposes only.
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  style={{
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ color: '#333', fontSize: '16px' }}>
                  I give my consent for ABHA creation as described above
                </span>
              </label>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'space-between',
              marginTop: '30px'
            }}>
              <button
                onClick={() => setStep('otp')}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: '1px solid #CCCCCC',
                  backgroundColor: 'white',
                  color: '#666',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Back
              </button>
              <button
                onClick={handleConsentSubmit}
                disabled={!consentGiven || loading}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: consentGiven ? '#0056B3' : '#CCCCCC',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: consentGiven ? 'pointer' : 'not-allowed',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Creating ABHA...' : 'Create ABHA'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <div>
            <div style={{
              textAlign: 'center',
              padding: '20px 0'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: '#DCFCE7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px'
              }}>
                <span style={{
                  fontSize: '40px',
                  color: '#22C55E'
                }}>
                  ✓
                </span>
              </div>
              
              <h3 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#333',
                marginBottom: '12px'
              }}>
                ABHA Created Successfully!
              </h3>
              
              <p style={{ color: '#666', marginBottom: '24px' }}>
                Your Ayushman Bharat Health Account has been created.
              </p>
              
              <div style={{
                backgroundColor: '#F0F9FF',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '24px',
                textAlign: 'left'
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>ABHA Number</div>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#0056B3',
                    fontFamily: 'monospace'
                  }}>
                    {generatedABHA}
                  </div>
                </div>
                
                <div>
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>ABHA Address</div>
                  <div style={{
                    fontSize: '16px',
                    color: '#0056B3',
                    fontFamily: 'monospace'
                  }}>
                    {generatedABHAAddress}
                  </div>
                </div>
              </div>
              
              <div style={{
                backgroundColor: '#FEF3C7',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '24px',
                fontSize: '14px',
                color: '#92400E'
              }}>
                <strong>Note:</strong> This is a demonstration system. In production, ABHA would be created 
                through the official ABDM (Ayushman Bharat Digital Mission) portal.
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={handleComplete}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#0056B3',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ABHALinkingModal;