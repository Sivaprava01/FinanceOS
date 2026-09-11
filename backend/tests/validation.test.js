import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('Password & Input Validation Rules', () => {
  const isStrongPassword = (pass) => {
    if (!pass || pass.length < 8) return false;
    if (!/[A-Z]/.test(pass)) return false;
    if (!/[0-9]/.test(pass)) return false;
    return true;
  };

  it('should reject passwords shorter than 8 characters', () => {
    assert.equal(isStrongPassword('Pass1!'), false);
    assert.equal(isStrongPassword('1234567'), false);
    assert.equal(isStrongPassword(''), false);
  });

  it('should reject passwords without uppercase letters', () => {
    assert.equal(isStrongPassword('password123'), false);
  });

  it('should reject passwords without numbers', () => {
    assert.equal(isStrongPassword('PasswordOnly'), false);
  });

  it('should accept valid passwords meeting all criteria', () => {
    assert.equal(isStrongPassword('Password123!'), true);
    assert.equal(isStrongPassword('SecureP@ss99'), true);
  });

  it('should verify old and new passwords are distinct', () => {
    const isDifferent = (oldPass, newPass) => oldPass !== newPass;
    assert.equal(isDifferent('Password123!', 'Password123!'), false);
    assert.equal(isDifferent('Password123!', 'NewPassword456!'), true);
  });
});
