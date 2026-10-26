import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Angular's built-in email validator accepts "name@host" without a domain
// extension, so we also require a dot-separated domain like "example.com".
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const USERNAME_PATTERN = /^[A-Za-z0-9 _.]+$/;

export const PASSWORD_MIN_LENGTH = 8;

// Requires at least one letter and one number.
export function passwordStrength(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: string = control.value || '';
    if (!value) return null;

    const hasLetter = /[A-Za-z]/.test(value);
    const hasNumber = /\d/.test(value);

    return hasLetter && hasNumber ? null : { weakPassword: true };
  };
}

// Group validator: compares two controls and flags the second one.
export function matchFields(field: string, confirmField: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const value = group.get(field)?.value;
    const confirm = group.get(confirmField)?.value;

    if (!confirm) return null;

    return value === confirm ? null : { fieldsMismatch: true };
  };
}
