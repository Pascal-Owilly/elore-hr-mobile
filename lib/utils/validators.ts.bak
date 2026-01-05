// lib/utils/validators.ts
// Email validation regex
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation
export const validatePassword = (password: string): boolean => {
  // At least 8 characters
  return password.length >= 8;
};

// Strong password validation (optional)
export const validateStrongPassword = (password: string): boolean => {
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return strongPasswordRegex.test(password);
};

// Phone number validation for Kenya
export const validateKenyaPhone = (phone: string): boolean => {
  const kenyaPhoneRegex = /^(?:\+254|0)[17]\d{8}$/;
  return kenyaPhoneRegex.test(phone);
};

// National ID validation for Kenya (8-10 digits)
export const validateKenyaNationalId = (id: string): boolean => {
  const idRegex = /^\d{8,10}$/;
  return idRegex.test(id);
};

// KRA PIN validation for Kenya
export const validateKraPin = (pin: string): boolean => {
  const kraPinRegex = /^[A-Z]\d{9}[A-Z]$/;
  return kraPinRegex.test(pin);
};

// Required field validation
export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

// Min length validation
export const validateMinLength = (value: string, min: number): boolean => {
  return value.length >= min;
};

// Max length validation
export const validateMaxLength = (value: string, max: number): boolean => {
  return value.length <= max;
};

// Number validation
export const validateNumber = (value: string): boolean => {
  return !isNaN(parseFloat(value)) && isFinite(Number(value));
};

// URL validation
export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Date validation
export const validateDate = (date: string): boolean => {
  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj.getTime());
};

// Form validation helper
export const validateForm = (
  values: Record<string, string>,
  rules: Record<string, (value: string) => boolean | string>
): Record<string, string> => {
  const errors: Record<string, string> = {};

  Object.keys(rules).forEach((key) => {
    const rule = rules[key];
    const value = values[key] || '';
    const result = rule(value);

    if (result !== true) {
      errors[key] = typeof result === 'string' ? result : `Invalid ${key}`;
    }
  });

  return errors;
};