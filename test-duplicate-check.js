// Test duplicate patient check
const { checkForDuplicates } = require('./src/utils/duplicatePatientCheck.ts');

async function testDuplicateCheck() {
  console.log('🧪 Testing duplicate patient check...\n');
  
  // Test case 1: New patient with unique details
  const testPatient1 = {
    patientId: 'test-123',
    firstName: 'John',
    lastName: 'Doe',
    phone: '9876543210',
    aadhaar: '123456789012',
    dateOfBirth: '1990-01-01',
    gender: 'MALE'
  };
  
  console.log('Test 1: Unique patient');
  console.log('Patient:', testPatient1);
  
  const result1 = await checkForDuplicates(testPatient1);
  console.log('Result:', {
    hasDuplicates: result1.hasDuplicates,
    totalMatches: result1.totalMatches,
    suggestedAction: result1.suggestedAction,
    confidence: result1.confidence
  });
  
  console.log('\n---\n');
  
  // Test case 2: Patient with same phone (potential duplicate)
  const testPatient2 = {
    patientId: 'test-456',
    firstName: 'Jane',
    lastName: 'Smith',
    phone: '9876543210', // Same phone as testPatient1
    dateOfBirth: '1992-05-15',
    gender: 'FEMALE'
  };
  
  console.log('Test 2: Patient with same phone');
  console.log('Patient:', testPatient2);
  
  const result2 = await checkForDuplicates(testPatient2);
  console.log('Result:', {
    hasDuplicates: result2.hasDuplicates,
    totalMatches: result2.totalMatches,
    suggestedAction: result2.suggestedAction,
    confidence: result2.confidence
  });
  
  if (result2.exactMatches.length > 0) {
    console.log('\nExact matches:');
    result2.exactMatches.forEach(match => {
      console.log(`- Patient ${match.patient.id}: ${match.matchScore}% (${match.matchReasons.join(', ')})`);
    });
  }
  
  if (result2.potentialMatches.length > 0) {
    console.log('\nPotential matches:');
    result2.potentialMatches.forEach(match => {
      console.log(`- Patient ${match.patient.id}: ${match.matchScore}% (${match.matchReasons.join(', ')})`);
    });
  }
  
  console.log('\n✅ Test completed');
}

// Run test
testDuplicateCheck().catch(console.error);