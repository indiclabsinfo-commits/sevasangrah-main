// Patch to update NewFlexiblePatientEntry.tsx with real doctors
const fs = require('fs');
const path = require('path');

console.log('🔧 Updating NewFlexiblePatientEntry.tsx with real doctors...');

const filePath = path.join(__dirname, 'src/components/NewFlexiblePatientEntry.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update imports
if (!content.includes("import DoctorsDropdown from './DoctorsDropdown'")) {
  // Find the import section
  const importEnd = content.indexOf('const NewFlexiblePatientEntry: React.FC = () => {');
  const beforeImports = content.substring(0, importEnd);
  const afterImports = content.substring(importEnd);
  
  // Add new imports
  const newImports = beforeImports + 
    "import DoctorsDropdown from './DoctorsDropdown';\n" +
    "import DepartmentsDropdown from './DepartmentsDropdown';\n" +
    afterImports;
  
  content = newImports;
  console.log('✅ Added DoctorsDropdown and DepartmentsDropdown imports');
}

// 2. Remove hardcoded DOCTORS_DATA and DEPARTMENTS
const doctorsDataStart = content.indexOf('// Doctors and Departments data');
if (doctorsDataStart !== -1) {
  const doctorsDataEnd = content.indexOf('const DEPARTMENTS', doctorsDataStart);
  if (doctorsDataEnd !== -1) {
    const depEnd = content.indexOf(';', doctorsDataEnd) + 1;
    
    const beforeDoctors = content.substring(0, doctorsDataStart);
    const afterDoctors = content.substring(depEnd);
    
    // Replace with comment
    const replacement = `// Doctors data now fetched from database via DoctorService\n`;
    
    content = beforeDoctors + replacement + afterDoctors;
    console.log('✅ Removed hardcoded DOCTORS_DATA and DEPARTMENTS');
  }
}

// 3. Find and update the department dropdown in the form
// Look for the department select field
const deptSelectStart = content.indexOf('{/* Department Selection */}');
if (deptSelectStart !== -1) {
  // Find the select element for department
  const selectStart = content.indexOf('<select', deptSelectStart);
  const selectEnd = content.indexOf('</select>', selectStart) + 9;
  
  if (selectStart !== -1 && selectEnd !== -1) {
    const beforeSelect = content.substring(0, selectStart);
    const afterSelect = content.substring(selectEnd);
    
    // Replace with DepartmentsDropdown
    const newDeptSelect = `<DepartmentsDropdown
                        value={formData.selected_department}
                        onChange={(dept) => {
                          setFormData({ 
                            ...formData, 
                            selected_department: dept,
                            selected_doctor: '', // Clear doctor when department changes
                            doctor_id: ''
                          });
                        }}
                        placeholder="Select Department"
                        required={true}
                        showCount={true}
                      />`;
    
    content = beforeSelect + newDeptSelect + afterSelect;
    console.log('✅ Updated department dropdown to use real departments');
  }
}

// 4. Find and update the doctor dropdown
const doctorSelectSearch = 'value={formData.selected_doctor}';
const doctorSelectIndex = content.indexOf(doctorSelectSearch);
if (doctorSelectIndex !== -1) {
  // Find the surrounding select element
  let selectStart = doctorSelectIndex;
  while (selectStart > 0 && content.substring(selectStart - 6, selectStart) !== '<select') {
    selectStart--;
  }
  
  let selectEnd = content.indexOf('</select>', doctorSelectIndex) + 9;
  
  if (selectStart > 0 && selectEnd > selectStart) {
    const beforeSelect = content.substring(0, selectStart);
    const afterSelect = content.substring(selectEnd);
    
    // Replace with DoctorsDropdown
    const newDoctorSelect = `<DoctorsDropdown
                          value={formData.selected_doctor}
                          onChange={(doctorName, doctorId) => {
                            setFormData({
                              ...formData,
                              selected_doctor: doctorName,
                              doctor_id: doctorId || ''
                            });
                          }}
                          department={formData.selected_department}
                          disabled={!formData.selected_department}
                          placeholder={formData.selected_department ? "Select Doctor" : "Select department first"}
                          required={true}
                          showFee={true}
                        />`;
    
    content = beforeSelect + newDoctorSelect + afterSelect;
    console.log('✅ Updated doctor dropdown to use real doctors');
  }
}

// Write back
fs.writeFileSync(filePath, content);
console.log('✅ Patient entry form updated with real doctors from database!');
console.log('\n🎯 Next steps:');
console.log('1. Run import_magnus_doctors.sql in Supabase');
console.log('2. Test the updated form');
console.log('3. Check other components that need doctors (queue, appointments, etc.)');