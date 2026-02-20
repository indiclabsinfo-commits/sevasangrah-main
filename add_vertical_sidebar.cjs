// Add vertical sidebar to App.tsx
const fs = require('fs');
const path = require('path');

console.log('🔄 Adding vertical sidebar to App.tsx...');

const appPath = path.join(__dirname, 'src/App.tsx');
let appContent = fs.readFileSync(appPath, 'utf8');

// Find the navigation tabs section
const navComment = '{/* Navigation Tabs - Auto-hide Section */}';
const navStart = appContent.indexOf(navComment);

if (navStart === -1) {
  console.log('❌ Could not find navigation tabs section');
  process.exit(1);
}

// Find the end of navigation (look for main content)
const mainContentComment = '{/* Main Content */}';
const mainContentStart = appContent.indexOf(mainContentComment, navStart);

if (mainContentStart === -1) {
  console.log('❌ Could not find main content section');
  process.exit(1);
}

// Create vertical sidebar HTML
const verticalSidebar = `
      {/* Vertical Sidebar - Fixed Left Navigation */}
      <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 shadow-sm z-40 pt-20">
        <div className="p-4 space-y-1">
          {filteredTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
              }}
              className={\`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center space-x-3 \${activeTab === tab.id
                ? 'bg-blue-50 text-blue-700 border border-blue-100'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              }\`}
            >
              <div className="w-5 h-5 flex items-center justify-center">
                {tab.id === 'dashboard' && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                )}
                {tab.id === 'patient-entry' && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                )}
                {tab.id === 'patients' && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 1.197a6 6 0 00-9-5.197" />
                  </svg>
                )}
                {tab.id === 'billing' && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {!['dashboard', 'patient-entry', 'patients', 'billing'].includes(tab.id) && (
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                )}
              </div>
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
        
        {/* Sidebar footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              System Online
            </div>
            <div className="mt-1">v3.0 • HMS</div>
          </div>
        </div>
      </div>
`;

// Replace navigation section with vertical sidebar
const beforeNav = appContent.substring(0, navStart);
const afterNav = appContent.substring(mainContentStart);

// Add margin to main content for sidebar
const updatedAfterNav = afterNav.replace(
  '<main className="pb-6">',
  '<main className="pb-6 ml-64">'
);

const newAppContent = beforeNav + verticalSidebar + updatedAfterNav;

// Write back
fs.writeFileSync(appPath, newAppContent);
console.log('✅ Vertical sidebar added!');
console.log('📝 Changes:');
console.log('  1. Replaced horizontal tabs with vertical sidebar');
console.log('  2. Added ml-64 margin to main content');
console.log('  3. Sidebar includes icons for common tabs');