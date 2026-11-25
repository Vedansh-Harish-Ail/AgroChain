/**
 * testSessionManager.js
 * 
 * Manages test-account credentials, in-session entry tracking, entry limits,
 * alerting thresholds, and production database protection.
 */

export const MAX_TEST_ENTRIES = 5;
export const WARNING_THRESHOLD = 4;
export const TEST_ENTRIES_STORAGE_KEY = 'agrochain_test_session_entries';
export const TEST_USER_KEY = 'agrochain_is_test_user';

// Pre-configured test accounts covering all roles & modules
export const TEST_ROLES = [
  {
    id: 'farmer',
    role: 'FARMER',
    title: 'Farmer',
    module: 'Crop Registration & Cultivation Lifecycle',
    badge: 'Producer',
    username: 'farmer',
    email: 'farmer@gmail.com',
    passwords: ['farmer@1', 'farmer@2', 'farmer@3'],
    name: 'Rajesh Patel (Test Farmer)',
    details: 'Manages crop listings, cultivation records, delay reports, and harvest logs.',
    icon: 'Sprout',
    sampleEntries: ['Wheat Cultivation Batch #A1', 'Organic Tomato Lot #902']
  },
  {
    id: 'investor',
    role: 'INVESTOR',
    title: 'Investor',
    module: 'Agro Financing & Investment Proposals (LOI)',
    badge: 'Finance',
    username: 'investor',
    email: 'investor@gmail.com',
    passwords: ['investor@1', 'investor@2', 'investor@3'],
    name: 'Suresh Mehta (Test Investor)',
    details: 'Reviews funding proposals, submits Letters of Intent (LOIs), and manages stakes.',
    icon: 'Coins',
    sampleEntries: ['Paddy Farm LOI - $10,000', 'Greenhouse Expansion Funding']
  },
  {
    id: 'inspector',
    role: 'INSPECTOR',
    title: 'Agriculture Inspector',
    module: 'Farm Land Survey, GPS Verification & Field Approvals',
    badge: 'Govt / Agri',
    username: 'inspector',
    email: 'inspector@gmail.com',
    passwords: ['inspector@1', 'inspector@2', 'inspector@3'],
    name: 'Rajiv Kumar (Test Agri Inspector)',
    details: 'Conducts physical & hybrid land audits, reviews land ownership proofs and approves farms.',
    icon: 'FileCheck',
    sampleEntries: ['Ernakulam Land Survey #442', 'Organic Soil Compliance Audit']
  },
  {
    id: 'cop',
    role: 'INSPECTOR',
    title: 'Cop / Field Officer',
    module: 'Regulatory Enforcement & Field Compliance Checks',
    badge: 'Enforcement',
    username: 'cop',
    email: 'cop@gmail.com',
    passwords: ['cop@1', 'cop@2', 'cop@3'],
    name: 'Officer Vikram Singh (Test Field Cop)',
    details: 'Enforces agricultural standards, conducts surprise boundary checks and compliance verification.',
    icon: 'ShieldCheck',
    sampleEntries: ['Pesticide Regulation Check #12', 'Boundary Audit Report']
  },
  {
    id: 'tester',
    role: 'TESTER',
    title: 'Quality Tester',
    module: 'Lab Quality Testing, Chemical Analysis & Product QR',
    badge: 'Lab Analyst',
    username: 'tester',
    email: 'tester@gmail.com',
    passwords: ['tester@1', 'tester@2', 'tester@3'],
    name: 'Dr. Anita Sharma (Test Quality Analyst)',
    details: 'Assesses moisture, grade, and pesticide levels; approves batches and creates traceability QR codes.',
    icon: 'Cpu',
    sampleEntries: ['Grade-A Basmati Quality Cert', 'Moisture Content Lab Test #88']
  },
  {
    id: 'consumer',
    role: 'CONSUMER',
    title: 'Consumer / Buyer',
    module: 'Product Traceability, Verification & Consumer Feedback',
    badge: 'Retail',
    username: 'consumer',
    email: 'consumer@gmail.com',
    passwords: ['consumer@1', 'consumer@2', 'consumer@3'],
    name: 'Amit Kumar (Test Consumer)',
    details: 'Scans QR codes, reviews immutable on-chain journeys, and posts authentic farm-to-fork ratings.',
    icon: 'Eye',
    sampleEntries: ['Fair-Trade Honey Rating (5 Stars)', 'Organic Rice Verification']
  },
  {
    id: 'admin',
    role: 'ADMIN',
    title: 'System Administrator',
    module: 'Platform Oversight, User Approvals & System Audit Logs',
    badge: 'System Admin',
    username: 'admin',
    email: 'admin@gmail.com',
    passwords: ['admin@1', 'admin@2', 'admin@3'],
    name: 'Administrator (Test Admin)',
    details: 'Onboards and assigns inspectors/testers, tracks platform transactions, and reviews audit logs.',
    icon: 'Settings',
    sampleEntries: ['Inspector Assignment: Kochi Zone', 'Role Activation: Lab #4']
  }
];

/**
 * Normalizes input identifier to lowercase string
 */
export const normalizeIdentifier = (val) => (val || '').trim().toLowerCase();

/**
 * Finds test role by username or email
 */
export const findTestRole = (identifier) => {
  const clean = normalizeIdentifier(identifier);
  return TEST_ROLES.find(
    (acc) => acc.username === clean || acc.email === clean || acc.id === clean
  );
};

/**
 * Validates whether credentials match any test account.
 * Accepts username or email, and any of role@1, role@2, role@3, or test@123.
 */
export const validateTestCredentials = (identifier, password) => {
  const role = findTestRole(identifier);
  if (!role) return null;

  const cleanPass = (password || '').trim();
  const validPasswords = [...role.passwords, 'test@123'];

  if (validPasswords.includes(cleanPass)) {
    return role;
  }
  return null;
};

/**
 * Checks if a given user object or session flag represents a test account
 */
export const isTestAccount = (user) => {
  if (!user) {
    return sessionStorage.getItem(TEST_USER_KEY) === 'true';
  }
  if (user.isTestAccount) return true;
  const cleanEmail = normalizeIdentifier(user.email);
  return TEST_ROLES.some((r) => r.email === cleanEmail || r.username === cleanEmail);
};

/**
 * Retrieves all stored test entries for the current session
 */
export const getTestSessionEntries = () => {
  try {
    const raw = sessionStorage.getItem(TEST_ENTRIES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Failed to parse test session entries:', err);
    return [];
  }
};

/**
 * Dispatches an event and triggers alert callbacks when thresholds are hit
 */
export const triggerTestSessionAlert = (message, type = 'warning', extra = {}) => {
  // Dispatch custom browser event so any UI component (ToastContext or Banner) can display it
  try {
    window.dispatchEvent(
      new CustomEvent('agrochain-test-alert', {
        detail: { message, type, ...extra }
      })
    );
  } catch (e) {
    console.error('Error dispatching test alert:', e);
  }

  // Also trigger a styled alert / fallback if window is active
  if (typeof window !== 'undefined' && window.alert && extra.useNativeAlert) {
    setTimeout(() => {
      window.alert(`[AgroChain Test Mode]\n\n${message}`);
    }, 50);
  }
};

/**
 * Records an entry into the current session.
 * 
 * Rules:
 * - Max 5 entries per session.
 * - Alert the user when they reach 4 entries.
 * - If a 6th entry is attempted, automatically remove the first (earliest) entry and notify the user.
 * - Prevents writing dummy data to the production database.
 */
export const recordTestSessionEntry = (entryData = {}, options = {}) => {
  const entries = getTestSessionEntries();
  let removedEntry = null;
  let alertMessage = null;
  let alertType = 'warning';

  // 1. If user attempts a 6th entry (count is currently >= 5), automatically delete the first entry
  if (entries.length >= MAX_TEST_ENTRIES) {
    removedEntry = entries.shift(); // Remove the earliest entry (FIFO)
    alertMessage = `Entry limit reached (maximum ${MAX_TEST_ENTRIES} entries per session). Earliest entry "${removedEntry.title || removedEntry.module || 'Entry #1'}" has been automatically deleted to accommodate your new entry.`;
    alertType = 'warning';
  }

  const newEntry = {
    id: `test-entry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    module: entryData.module || 'General Entry',
    action: entryData.action || 'CREATE',
    title: entryData.title || `Test Entry #${entries.length + 1}`,
    data: entryData.data || entryData
  };

  entries.push(newEntry);
  sessionStorage.setItem(TEST_ENTRIES_STORAGE_KEY, JSON.stringify(entries));

  // 2. Alert the user when they reach 4 entries (and weren't just rotated)
  if (entries.length === WARNING_THRESHOLD && !removedEntry) {
    alertMessage = `Session Alert: You have reached 4 entries in this test session. Maximum limit is 5 entries per session.`;
    alertType = 'warning';
  }

  // Broadcast alert if triggered
  if (alertMessage) {
    triggerTestSessionAlert(alertMessage, alertType, {
      entriesCount: entries.length,
      removedEntry,
      newEntry,
      useNativeAlert: options.useNativeAlert ?? false
    });
  }

  return {
    success: true,
    entry: newEntry,
    count: entries.length,
    removedEntry,
    alertMessage,
    alertType
  };
};

/**
 * Manually deletes a test entry by ID
 */
export const deleteTestSessionEntry = (entryId) => {
  const entries = getTestSessionEntries();
  const updated = entries.filter((e) => e.id !== entryId);
  sessionStorage.setItem(TEST_ENTRIES_STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

/**
 * Clears all test session entries (e.g., on logout)
 */
export const clearTestSession = () => {
  sessionStorage.removeItem(TEST_ENTRIES_STORAGE_KEY);
  sessionStorage.removeItem(TEST_USER_KEY);
};

/**
 * Generates a mock user object for a test role
 */
export const createTestUserObject = (roleInfo) => {
  return {
    id: 9999 + TEST_ROLES.findIndex((r) => r.id === roleInfo.id),
    name: roleInfo.name,
    email: roleInfo.email,
    username: roleInfo.username,
    role: roleInfo.role,
    phone_number: '+919999999999',
    wallet_address: roleInfo.walletAddress || '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
    wallet_type: 'METAMASK',
    onboarding_complete: true,
    is_approved: true,
    is_verified_farmer: true,
    district: 'Ernakulam',
    sub_district: 'Kochi',
    pin_code: '682022',
    status: 'ACTIVE',
    must_change_password: false,
    isTestAccount: true
  };
};
