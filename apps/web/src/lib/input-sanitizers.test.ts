import { describe, it, expect } from 'vitest';
import {
  removeVietnameseTones,
  sanitizeEnglishEmail,
  sanitizeEnglishPassword,
  sanitizeEnglishName,
  sanitizeEnglishAlphanumeric,
} from './input-sanitizers';

describe('Input Sanitizers for English Auth Inputs', () => {
  describe('removeVietnameseTones', () => {
    it('converts accented Vietnamese characters to ASCII', () => {
      expect(removeVietnameseTones('Nguyễn Văn Đạt')).toBe('Nguyen Van Dat');
      expect(removeVietnameseTones('Học sinh giỏi')).toBe('Hoc sinh gioi');
      expect(removeVietnameseTones('ĐỀ THI')).toBe('DE THI');
    });
  });

  describe('sanitizeEnglishEmail', () => {
    it('converts Vietnamese input in email to valid ASCII characters', () => {
      expect(sanitizeEnglishEmail('nguyễn.văn@gmail.com')).toBe('nguyen.van@gmail.com');
      expect(sanitizeEnglishEmail('đangnhap@vidu.vn')).toBe('dangnhap@vidu.vn');
    });

    it('removes spaces and special invalid characters', () => {
      expect(sanitizeEnglishEmail('user name@example.com')).toBe('username@example.com');
      expect(sanitizeEnglishEmail('test#email$@test.com')).toBe('testemail@test.com');
    });
  });

  describe('sanitizeEnglishPassword', () => {
    it('removes Vietnamese tones and non-ASCII characters from passwords', () => {
      expect(sanitizeEnglishPassword('MậtKhẩu123!')).toBe('MatKhau123!');
      expect(sanitizeEnglishPassword('P@ssw0rdđ')).toBe('P@ssw0rdd');
    });

    it('preserves standard ASCII printable characters and symbols', () => {
      expect(sanitizeEnglishPassword('Secret@123#_$-%')).toBe('Secret@123#_$-%');
    });
  });

  describe('sanitizeEnglishName', () => {
    it('normalizes Vietnamese name into English Latin characters', () => {
      expect(sanitizeEnglishName('Nguyễn Thị Hoa')).toBe('Nguyen Thi Hoa');
      expect(sanitizeEnglishName('Đỗ Nam Trung')).toBe('Do Nam Trung');
    });

    it('preserves hyphenated and apostrophe English names', () => {
      expect(sanitizeEnglishName("O'Connor-Smith")).toBe("O'Connor-Smith");
    });
  });

  describe('sanitizeEnglishAlphanumeric', () => {
    it('only keeps letters, numbers, hyphens and underscores', () => {
      expect(sanitizeEnglishAlphanumeric('MÃ-123_abc!')).toBe('MA-123_abc');
    });
  });
});
