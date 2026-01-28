/**
 * Helper functions to access employee data from User object
 * Provides backwards compatibility during migration from User fields to EmployeeProfile
 */

import { User, EmployeeProfile } from '../types';

/**
 * Gets an employee field value, checking both the new employeeProfile and legacy user fields
 */
export function getEmployeeField<K extends keyof EmployeeProfile>(
  user: User | undefined | null,
  field: K
): EmployeeProfile[K] | undefined {
  if (!user) return undefined;
  
  // Try employeeProfile first (new structure)
  if (user.employeeProfile && user.employeeProfile[field] !== undefined) {
    return user.employeeProfile[field];
  }
  
  // Fallback to legacy user field
  return (user as any)[field];
}

/**
 * Gets all employee data as a flat object
 */
export function getEmployeeData(user: User | undefined | null): Partial<EmployeeProfile> {
  if (!user) return {};
  
  const fields: (keyof EmployeeProfile)[] = [
    'dateOfBirth', 'placeOfBirth', 'nationality', 'phone', 'mobile',
    'street', 'streetNumber', 'zipCode', 'postalCode', 'city', 'country',
    'employeeNumber', 'startDate', 'entryDate', 'exitDate',
    'iban', 'bankName', 'bic', 'civilStatus', 'religion',
    'ahvNumber', 'healthInsurance', 'isCrossBorderCommuter',
    'taxId', 'taxClass', 'socialSecurityNumber',
    'emergencyContactName', 'emergencyContactPhone', 'emergencyContactRelation',
    'department', 'position', 'supervisorId', 'salaryEncrypted',
    'weeklyHours', 'contractHours', 'hourlyRate', 'canton',
    'exemptFromTracking', 'vacationDays', 'probationEndDate'
  ];
  
  const result: Partial<EmployeeProfile> = {};
  
  fields.forEach(field => {
    const value = getEmployeeField(user, field);
    if (value !== undefined) {
      (result as any)[field] = value;
    }
  });
  
  return result;
}

/**
 * Formats a date string for display
 */
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('de-DE');
  } catch {
    return '-';
  }
}

/**
 * Gets the employee number with fallback
 */
export function getEmployeeNumber(user: User | undefined | null): string {
  return getEmployeeField(user, 'employeeNumber') || '-';
}

/**
 * Gets the full address as a string
 */
export function getFullAddress(user: User | undefined | null): string {
  if (!user) return '';
  
  const street = getEmployeeField(user, 'street');
  const streetNumber = getEmployeeField(user, 'streetNumber');
  const zipCode = getEmployeeField(user, 'zipCode');
  const city = getEmployeeField(user, 'city');
  const country = getEmployeeField(user, 'country');
  
  const parts = [];
  if (street && streetNumber) parts.push(`${street} ${streetNumber}`);
  else if (street) parts.push(street);
  
  if (zipCode && city) parts.push(`${zipCode} ${city}`);
  else if (city) parts.push(city);
  
  if (country) parts.push(country);
  
  return parts.join(', ');
}

/**
 * Gets contact phone number (prefers mobile over phone)
 */
export function getContactPhone(user: User | undefined | null): string {
  return getEmployeeField(user, 'mobile') || getEmployeeField(user, 'phone') || '-';
}
