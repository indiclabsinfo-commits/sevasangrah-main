import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Components to keep (critical)
keep_components = ['HRMManagementSimple']

# Replace component references for non-critical routes
# Find route definitions and replace component
lines = content.split('\n')
in_route = False
route_depth = 0
output = []

for line in lines:
    # Check if we're in a route object
    if 'component:' in line and not any(comp in line for comp in keep_components):
        # Check if it's one of the new problematic components
        if any(comp in line for comp in ['TeleconsultAppointment', 'WaitingHallDisplay', 
                                         'PrintScheduleSimple', 'SelfRegistrationKiosk',
                                         'ExternalAppointmentCapture', 'ReferralManagementSimple']):
            # Replace with ComingSoon
            line = '      component: ComingSoon,'
    
    output.append(line)

with open('src/App.tsx', 'w') as f:
    f.write('\n'.join(output))

print("Routes updated successfully")
