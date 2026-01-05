// Kenya-specific constants for HR System
export const KenyaConstants = {
  // Statutory Rates (2024)
  statutoryRates: {
    // NSSF Rates
    nssf: {
      employeeRate: 0.06, // 6%
      employerRate: 0.06, // 6%
      tierIILimit: 18000, // Monthly
    },
    
    // NHIF Tiers (Monthly)
    nhifTiers: [
      { min: 0, max: 5999, amount: 150 },
      { min: 6000, max: 7999, amount: 300 },
      { min: 8000, max: 11999, amount: 400 },
      { min: 12000, max: 14999, amount: 500 },
      { min: 15000, max: 19999, amount: 600 },
      { min: 20000, max: 24999, amount: 750 },
      { min: 25000, max: 29999, amount: 850 },
      { min: 30000, max: 34999, amount: 900 },
      { min: 35000, max: 39999, amount: 950 },
      { min: 40000, max: 44999, amount: 1000 },
      { min: 45000, max: 49999, amount: 1100 },
      { min: 50000, max: 59999, amount: 1200 },
      { min: 60000, max: 69999, amount: 1300 },
      { min: 70000, max: 79999, amount: 1400 },
      { min: 80000, max: 89999, amount: 1500 },
      { min: 90000, max: 99999, amount: 1600 },
      { min: 100000, max: Infinity, amount: 1700 },
    ],
    
    // PAYE Tax Brackets (Monthly)
    payeBrackets: [
      { min: 0, max: 24000, rate: 0.10 },
      { min: 24001, max: 32333, rate: 0.25 },
      { min: 32334, max: 500000, rate: 0.30 },
      { min: 500001, max: 800000, rate: 0.325 },
      { min: 800001, max: Infinity, rate: 0.35 },
    ],
    
    // Personal Relief
    personalRelief: 2400, // Monthly
    
    // Leave Entitlements
    leaveEntitlements: {
      annualLeave: 21, // Days per year
      maternityLeave: 90, // Days
      paternityLeave: 14, // Days
      sickLeave: 30, // Days per year
      compassionateLeave: 7, // Days
    },
    
    // Notice Periods
    noticePeriods: {
      probation: 7, // Days
      permanent: 30, // Days
      management: 60, // Days
    },
  },
  
  // Counties
  counties: [
    'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu',
    'Garissa', 'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega', 'Kericho',
    'Kiambu', 'Kilifi', 'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui',
    'Kwale', 'Laikipia', 'Lamu', 'Machakos', 'Makueni', 'Mandera',
    'Marsabit', 'Meru', 'Migori', 'Mombasa', 'Murang\'a', 'Nairobi',
    'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua', 'Nyeri',
    'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River', 'Tharaka-Nithi',
    'Trans Nzoia', 'Turkana', 'Uasin Gishu', 'Vihiga', 'Wajir', 'West Pokot'
  ],
  
  // Kenyan Holidays 2024
  publicHolidays2024: [
    { name: 'New Year\'s Day', date: '2024-01-01' },
    { name: 'Good Friday', date: '2024-03-29' },
    { name: 'Easter Monday', date: '2024-04-01' },
    { name: 'Labour Day', date: '2024-05-01' },
    { name: 'Madaraka Day', date: '2024-06-01' },
    { name: 'Idd-ul-Fitr', date: '2024-04-10' },
    { name: 'Idd-ul-Adha', date: '2024-06-17' },
    { name: 'Huduma Day', date: '2024-10-10' },
    { name: 'Mashujaa Day', date: '2024-10-20' },
    { name: 'Jamhuri Day', date: '2024-12-12' },
    { name: 'Christmas Day', date: '2024-12-25' },
    { name: 'Boxing Day', date: '2024-12-26' },
  ],
  
  // Currency Formatting
  currency: {
    code: 'KES',
    symbol: 'KSh',
    format: (amount: number) => {
      return `KSh ${amount.toLocaleString('en-KE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    },
    formatNoDecimals: (amount: number) => {
      return `KSh ${amount.toLocaleString('en-KE', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}`;
    },
  },
  
  // Date Format (Kenyan format)
  dateFormat: 'DD/MM/YYYY',
  dateTimeFormat: 'DD/MM/YYYY HH:mm',
  
  // Phone Number Format
  phoneFormat: {
    validate: (phone: string) => {
      const regex = /^(?:254|\+254|0)?(7\d{8})$/;
      return regex.test(phone);
    },
    normalize: (phone: string) => {
      // Convert to 254 format
      const cleaned = phone.replace(/\D/g, '');
      if (cleaned.startsWith('254')) return cleaned;
      if (cleaned.startsWith('7') && cleaned.length === 9) return `254${cleaned}`;
      if (cleaned.startsWith('0') && cleaned.length === 10) return `254${cleaned.substring(1)}`;
      return phone;
    },
    display: (phone: string) => {
      const normalized = KenyaConstants.phoneFormat.normalize(phone);
      if (normalized.length === 12) {
        return `+${normalized.substring(0, 3)} ${normalized.substring(3, 6)} ${normalized.substring(6, 9)} ${normalized.substring(9)}`;
      }
      return phone;
    },
  },
  
  // KRA PIN Validation
  kraPin: {
    validate: (pin: string) => {
      const regex = /^[A-Z]\d{9}[A-Z]$/;
      return regex.test(pin.toUpperCase());
    },
  },
  
  // National ID Validation
  nationalId: {
    validate: (id: string) => {
      const regex = /^\d{8,10}$/;
      return regex.test(id);
    },
  },
  
  // M-Pesa Configuration
  mpesa: {
    shortcodes: {
      paybill: '123456',
      till: '123456',
    },
    transactionTypes: {
      paybill: 'CustomerPayBillOnline',
      buyGoods: 'CustomerBuyGoodsOnline',
    },
  },
};

export type KenyaStatutoryRates = typeof KenyaConstants.statutoryRates;