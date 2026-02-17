import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { User, Phone, Mail, CreditCard, Fingerprint, Camera, CheckCircle, AlertCircle, Home, Calendar } from 'lucide-react';

const SelfRegistrationKiosk: React.FC = () => {
  const [step, setStep] = useState(1);
  const [registrationType, setRegistrationType] = useState<'new' | 'existing'>('new');
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    gender: '',
    dateOfBirth: '',
    mobileNumber: '',
    email: '',
    
    // Address
    address: '',
    city: '',
    pincode: '',
    
    // Identification
    aadhaarNumber: '',
    panNumber: '',
    
    // Emergency Contact
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: '',
    
    // Medical
    bloodGroup: '',
    knownAllergies: '',
    existingConditions: '',
    
    // Payment
    paymentMethod: 'cash',
    amount: '200',
    transactionId: ''
  });

  const totalSteps = 5;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = () => {
    alert('Registration submitted successfully! UHID will be generated.');
    // In real implementation: Submit to API, generate UHID, print token
  };

  const handleScanAadhaar = () => {
    alert('Aadhaar scanning would be implemented with QR code scanner');
  };

  const handleTakePhoto = () => {
    alert('Camera would open to take patient photo');
  };

  const handleFingerprint = () => {
    alert('Fingerprint scanner would capture biometric data');
  };

  const handlePayment = () => {
    alert('Payment gateway would open for online payment');
  };

  // Mock payment methods
  const paymentMethods = [
    { id: 'cash', name: 'Cash', icon: '💵' },
    { id: 'card', name: 'Card', icon: '💳' },
    { id: 'upi', name: 'UPI', icon: '📱' },
    { id: 'netbanking', name: 'Net Banking', icon: '🏦' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
              <span className="text-4xl">🏥</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-blue-900">SELF-REGISTRATION KIOSK</h1>
              <p className="text-xl text-blue-700">Magnus Hospital - Quick Patient Registration</p>
            </div>
          </div>
          <p className="text-gray-600">Complete your registration in 5 simple steps</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Progress and Instructions */}
          <div className="lg:col-span-1">
            <Card className="p-6 h-full">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Registration Progress</h2>
              
              {/* Progress Steps */}
              <div className="space-y-4 mb-8">
                {[
                  { number: 1, title: 'Registration Type', description: 'New or Existing Patient' },
                  { number: 2, title: 'Personal Details', description: 'Basic Information' },
                  { number: 3, title: 'Identification', description: 'Aadhaar & Documents' },
                  { number: 4, title: 'Medical Info', description: 'Health Details' },
                  { number: 5, title: 'Payment', description: 'Registration Fee' }
                ].map((stepItem) => (
                  <div 
                    key={stepItem.number}
                    className={`flex items-center gap-4 p-3 rounded-lg ${
                      step === stepItem.number 
                        ? 'bg-blue-100 border border-blue-300' 
                        : step > stepItem.number
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step === stepItem.number 
                        ? 'bg-blue-600 text-white' 
                        : step > stepItem.number
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {step > stepItem.number ? <CheckCircle className="h-5 w-5" /> : stepItem.number}
                    </div>
                    <div>
                      <div className="font-medium">{stepItem.title}</div>
                      <div className="text-sm text-gray-500">{stepItem.description}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Instructions */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Important Instructions
                </h3>
                <ul className="text-yellow-700 text-sm space-y-1">
                  <li>• Have your Aadhaar card ready</li>
                  <li>• Keep mobile number accessible for OTP</li>
                  <li>• Payment required for registration</li>
                  <li>• Photo will be taken for records</li>
                  <li>• Collect token after completion</li>
                </ul>
              </div>

              {/* Help Section */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Need Help?</h3>
                <p className="text-blue-700 text-sm">
                  Press the red HELP button or visit reception desk
                </p>
                <Button className="w-full mt-3 bg-red-600 hover:bg-red-700">
                  🆘 EMERGENCY HELP
                </Button>
              </div>
            </Card>
          </div>

          {/* Right: Registration Form */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              {/* Step 1: Registration Type */}
              {step === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-800">Step 1: Registration Type</h2>
                  <p className="text-gray-600">Are you a new patient or existing patient?</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button
                      onClick={() => setRegistrationType('new')}
                      className={`p-8 border-2 rounded-xl text-center transition-all ${
                        registrationType === 'new' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      <div className="text-5xl mb-4">🆕</div>
                      <h3 className="text-xl font-bold mb-2">New Patient</h3>
                      <p className="text-gray-600">First time registration at our hospital</p>
                      <div className="mt-4 text-sm text-blue-600">
                        • Complete registration required<br/>
                        • Aadhaar verification needed<br/>
                        • Registration fee: ₹200
                      </div>
                    </button>

                    <button
                      onClick={() => setRegistrationType('existing')}
                      className={`p-8 border-2 rounded-xl text-center transition-all ${
                        registrationType === 'existing' 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-300 hover:border-green-300'
                      }`}
                    >
                      <div className="text-5xl mb-4">📋</div>
                      <h3 className="text-xl font-bold mb-2">Existing Patient</h3>
                      <p className="text-gray-600">Already registered with us</p>
                      <div className="mt-4 text-sm text-green-600">
                        • Quick verification<br/>
                        • Enter UHID or mobile number<br/>
                        • No registration fee
                      </div>
                    </button>
                  </div>

                  {registrationType === 'existing' && (
                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h3 className="font-semibold text-green-800 mb-3">Existing Patient Verification</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">UHID Number</label>
                          <Input placeholder="Enter your UHID (MH-2026-XXXXXX)" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">OR Mobile Number</label>
                          <Input placeholder="Enter registered mobile number" />
                        </div>
                      </div>
                      <Button className="mt-4 bg-green-600 hover:bg-green-700">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Verify Patient
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Personal Details */}
              {step === 2 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-800">Step 2: Personal Details</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="inline h-4 w-4 mr-1" />
                        First Name *
                      </label>
                      <Input 
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        placeholder="Enter first name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                      <Input 
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
                      <select 
                        className="w-full p-2 border rounded"
                        value={formData.gender}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                      >
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="inline h-4 w-4 mr-1" />
                        Date of Birth *
                      </label>
                      <Input 
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group</label>
                      <select 
                        className="w-full p-2 border rounded"
                        value={formData.bloodGroup}
                        onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
                      >
                        <option value="">Select</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Phone className="inline h-4 w-4 mr-1" />
                        Mobile Number *
                      </label>
                      <Input 
                        value={formData.mobileNumber}
                        onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                        placeholder="10-digit mobile number"
                        maxLength={10}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="inline h-4 w-4 mr-1" />
                        Email Address
                      </label>
                      <Input 
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Home className="inline h-4 w-4 mr-1" />
                      Address
                    </label>
                    <textarea 
                      className="w-full p-2 border rounded h-24"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Full address"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Identification */}
              {step === 3 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-800">Step 3: Identification</h2>
                  <p className="text-gray-600">Verify your identity using one of these methods</p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={handleScanAadhaar}
                      className="p-6 border-2 border-blue-300 rounded-xl text-center hover:bg-blue-50 transition-colors"
                    >
                      <div className="text-4xl mb-3">🪪</div>
                      <h3 className="font-bold mb-2">Scan Aadhaar</h3>
                      <p className="text-sm text-gray-600">QR code scanning</p>
                    </button>

                    <button
                      onClick={handleTakePhoto}
                      className="p-6 border-2 border-green-300 rounded-xl text-center hover:bg-green-50 transition-colors"
                    >
                      <div className="text-4xl mb-3">📸</div>
                      <h3 className="font-bold mb-2">Take Photo</h3>
                      <p className="text-sm text-gray-600">Patient photograph</p>
                    </button>

                    <button
                      onClick={handleFingerprint}
                      className="p-6 border-2 border-purple-300 rounded-xl text-center hover:bg-purple-50 transition-colors"
                    >
                      <div className="text-4xl mb-3">🖐️</div>
                      <h3 className="font-bold mb-2">Fingerprint</h3>
                      <p className="text-sm text-gray-600">Biometric verification</p>
                    </button>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold mb-3">Or Enter Manually</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Aadhaar Number</label>
                        <Input 
                          value={formData.aadhaarNumber}
                          onChange={(e) => handleInputChange('aadhaarNumber', e.target.value)}
                          placeholder="12-digit Aadhaar"
                          maxLength={12}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">PAN Number</label>
                        <Input 
                          value={formData.panNumber}
                          onChange={(e) => handleInputChange('panNumber', e.target.value)}
                          placeholder="10-character PAN"
                          maxLength={10}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Medical Information */}
              {step === 4 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-800">Step 4: Medical Information</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Known Allergies</label>
                      <textarea 
                        className="w-full p-2 border rounded h-24"
                        value={formData.knownAllergies}
                        onChange={(e) => handleInputChange('knownAllergies', e.target.value)}
                        placeholder="List any allergies (medicines, food, etc.)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Existing Medical Conditions</label>
                      <textarea 
                        className="w-full p-2 border rounded h-24"
                        value={formData.existingConditions}
                        onChange={(e) => handleInputChange('existingConditions', e.target.value)}
                        placeholder="Diabetes, Hypertension, Asthma, etc."
                      />
                    </div>

                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h3 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Emergency Contact
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                          <Input 
                            value={formData.emergencyName}
                            onChange={(e) => handleInputChange('emergencyName', e.target.value)}
                            placeholder="Emergency contact name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                          <Input 
                            value={formData.emergencyPhone}
                            onChange={(e) => handleInputChange('emergencyPhone', e.target.value)}
                            placeholder="10-digit number"
                            maxLength={10}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Relation</label>
                          <Input 
                            value={formData.emergencyRelation}
                            onChange={(e) => handleInputChange('emergencyRelation', e.target.value)}
                            placeholder="Father/Mother/Spouse/etc."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Payment */}
              {step === 5 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-800">Step 5: Payment</h2>
                  <p className="text-gray-600">Registration Fee: ₹{formData.amount}</p>

                  <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-blue-900">Registration Summary</h3>
                        <p className="text-blue-700">Review your information</p>
                      </div>
                      <div className="text-3xl font-bold text-blue-900">₹{formData.amount}</div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Patient Name:</span>
                        <span className="font-medium">{formData.firstName} {formData.lastName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Mobile:</span>
                        <span className="font-medium">{formData.mobileNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Registration Type:</span>
                        <span className="font-medium">{registrationType === 'new' ? 'New Patient' : 'Existing Patient'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>UHID:</span>
                        <span className="font-medium text-green-600">Will be generated after payment</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-800 mb-4">Select Payment Method</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {paymentMethods.map((method) => (
                        <button
                          key={method.id}
                          onClick={() => handleInputChange('paymentMethod', method.id)}
                          className={`p-4 border-2 rounded-lg text-center transition-all ${
                            formData.paymentMethod === method.id 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-300 hover:border-blue-300'
                          }`}
                        >
                          <div className="text-2xl mb-2">{method.icon}</div>
                          <div className="font-medium">{method.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {formData.paymentMethod !== 'cash' && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Online Payment
                      </h3>
                      <p className="text-green-700 mb-3">
                        You will be redirected to secure payment gateway
                      </p>
                      <Button 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={handlePayment}
                      >
                        Proceed to Payment
                      </Button>
                    </div>
                  )}

                  {formData.paymentMethod === 'cash' && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h3 className="font-semibold text-yellow-800 mb-3">Cash Payment</h3>
                      <p className="text-yellow-700">
                        Please pay ₹{formData.amount} at the billing counter after registration.
                        Collect your receipt and token.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                <Button 
                  onClick={handlePrev}
                  disabled={step === 1}
                  variant="outline"
                >
                  ← Previous
                </Button>
                
                <div className="text-center">
                  <div className="text-sm text-gray-600">Step {step} of {totalSteps}</div>
                  <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
                    <div 
                      className="h-full bg-blue-600 rounded-full transition-all"
                      style={{ width: `${(step / totalSteps) * 100}%` }}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleNext}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {step === totalSteps ? 'Complete Registration' : 'Next →'}
                </Button>
              </div>
            </Card>

            {/* Quick Actions */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button variant="outline" className="flex items-center justify-center gap-2">
                <Fingerprint className="h-4 w-4" />
                Biometric
              </Button>
              <Button variant="outline" className="flex items-center justify-center gap-2">
                <Camera className="h-4 w-4" />
                Photo
              </Button>
              <Button variant="outline" className="flex items-center justify-center gap-2">
                <CreditCard className="h-4 w-4" />
                Payment
              </Button>
              <Button variant="outline" className="flex items-center justify-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>For assistance, please visit the reception desk or press HELP button</p>
          <p className="mt-1">Kiosk ID: KIOSK-001 • Session: {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
};

export default SelfRegistrationKiosk;