// The 14 allergens UK law requires us to declare (Food Information Regulations 2014).
export const ALLERGENS = [
  { key: 'celery', label: 'Celery' },
  { key: 'gluten', label: 'Cereals containing gluten' },
  { key: 'crustaceans', label: 'Crustaceans' },
  { key: 'eggs', label: 'Eggs' },
  { key: 'fish', label: 'Fish' },
  { key: 'lupin', label: 'Lupin' },
  { key: 'milk', label: 'Milk' },
  { key: 'molluscs', label: 'Molluscs' },
  { key: 'mustard', label: 'Mustard' },
  { key: 'nuts', label: 'Tree nuts' },
  { key: 'peanuts', label: 'Peanuts' },
  { key: 'sesame', label: 'Sesame' },
  { key: 'soya', label: 'Soya' },
  { key: 'sulphites', label: 'Sulphur dioxide / sulphites' },
] as const;

export const SHORT: Record<string, string> = {
  gluten: 'Gluten',
  nuts: 'Tree nuts',
  sulphites: 'Sulphites',
};

export const allergenLabel = (key: string, short = false) =>
  (short && SHORT[key]) || ALLERGENS.find((a) => a.key === key)?.label || key;

export const TAGS: Record<string, { label: string; colour: string }> = {
  veggie: { label: 'Veggie', colour: 'green' },
  vegan: { label: 'Vegan', colour: 'green' },
  spicy: { label: 'Spicy', colour: 'orange' },
};

export const price = (n: number) => `£${Number.isInteger(n) ? n : n.toFixed(2)}`;
