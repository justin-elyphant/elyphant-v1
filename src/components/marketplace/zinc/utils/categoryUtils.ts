
/**
 * Helper to guess a product category from search term
 */
export function guessCategory(term: string): string {
  if (!term) return "General";
  term = term.toLowerCase();
  
  // Enhanced occasion-based category guessing
  if (term.includes('birthday') || term.includes('celebration')) {
    return 'birthday';
  } else if (term.includes('wedding') || term.includes('bride') || term.includes('groom') || term.includes('marriage')) {
    return 'wedding';
  } else if (term.includes('anniversary') || term.includes('years together')) {
    return 'anniversary';
  } else if (term.includes('graduation') || term.includes('graduate') || term.includes('academic')) {
    return 'graduation';
  } else if (term.includes('baby') || term.includes('shower') || term.includes('newborn') || term.includes('infant')) {
    return 'baby_shower';
  } else if (term.includes('pet') || term.includes('dog') || term.includes('cat') || term.includes('animal')) {
    return 'pets';
  } else if (term.includes('summer') || term.includes('beach') || term.includes('vacation') || term.includes('hot weather')) {
    return 'summer';
  } else if (term.includes('office') || term.includes('work') || term.includes('desk') || term.includes('professional')) {
    return 'office';
  } else if (term.includes('home') || term.includes('decor') || term.includes('decoration') || term.includes('interior')) {
    return 'home decor';
  } else if (term.includes('shoe') || term.includes('sneaker') || term.includes('boots')) {
    return 'Footwear';
  } else if (term.includes('shirt') || term.includes('jacket') || term.includes('pant') || term.includes('dress')) {
    return 'Clothing';
  } else if (term.includes('phone') || term.includes('laptop') || term.includes('computer') || term.includes('tablet')) {
    return 'Electronics';
  } else if (term.includes('game') || term.includes('xbox') || term.includes('playstation') || term.includes('nintendo')) {
    return 'Gaming';
  } else if (term.includes('book') || term.includes('novel')) {
    return 'Books';
  } else if (term.includes('tool') || term.includes('drill') || term.includes('saw')) {
    return 'Tools';
  } else if (term.includes('kitchen') || term.includes('cookware') || term.includes('appliance')) {
    return 'Kitchen';
  } else if (term.includes('toy') || term.includes('doll') || term.includes('lego')) {
    return 'Toys';
  } else if (term.includes('cowboys') || term.includes('sports') || term.includes('team') || term.includes('jersey')) {
    return 'Sports';
  }
  
  return 'General';
}
