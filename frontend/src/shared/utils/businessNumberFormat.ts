/** 사업자번호/법인번호는 서버에는 숫자만 저장하고, 화면 표시/입력 시에만 하이픈 마스킹을 적용한다. */

export function formatBusinessNo(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

export function formatJuridNo(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 13);
  if (digits.length <= 6) return digits;
  return `${digits.slice(0, 6)}-${digits.slice(6)}`;
}

export function toDigitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}
