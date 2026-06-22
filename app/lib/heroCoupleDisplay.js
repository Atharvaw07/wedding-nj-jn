export const HERO_DISPLAY_ORDERS = ['bride-first', 'groom-first'];

export function getHeroDisplayOrder(hero) {
  const v = hero?.displayOrder;
  if (v === 'groom-first') return 'groom-first';
  return 'bride-first';
}

export function getOrderedPartnerKeys(hero) {
  return getHeroDisplayOrder(hero) === 'groom-first' ? ['groom', 'bride'] : ['bride', 'groom'];
}
