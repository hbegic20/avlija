export type PluralForms = { one: string; few: string; many: string };

export function pluralForm(count: number, forms: PluralForms): string {
  const lastTwo = Math.abs(count) % 100;
  const last = Math.abs(count) % 10;
  if (last === 1 && lastTwo !== 11) {
    return forms.one;
  }
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) {
    return forms.few;
  }
  return forms.many;
}
