
/**
 * Helper to guess a product category from search term
 */
export function guessCategory(term: string): string {
  if (!term) return "General";
  term = term.toLowerCase();
  
  // Enhanced occasion-based category guessing with more synonyms
  if (term.includes('birthday') || term.includes('celebration') || term.includes('party') || term.includes('festivity')) {
    return 'birthday';
  } else if (term.includes('wedding') || term.includes('bride') || term.includes('groom') || term.includes('marriage') || term.includes('matrimony')) {
    return 'wedding';
  } else if (term.includes('anniversary') || term.includes('years together') || term.includes('yearly') || term.includes('commemorate')) {
    return 'anniversary';
  } else if (term.includes('graduation') || term.includes('graduate') || term.includes('academic') || term.includes('scholar') || term.includes('degree')) {
    return 'graduation';
  } else if (term.includes('baby') || term.includes('shower') || term.includes('newborn') || term.includes('infant') || term.includes('nursery')) {
    return 'baby_shower';
  } else if (term.includes('pet') || term.includes('dog') || term.includes('cat') || term.includes('animal') || term.includes('furry')) {
    return 'pets';
  } else if (term.includes('office') || term.includes('work') || term.includes('desk') || term.includes('professional') || 
             term.includes('stationery') || term.includes('supplies') || term.includes('gear') || term.includes('business')) {
    return 'office';
  } else if (term.includes('summer') || term.includes('beach') || term.includes('vacation') || term.includes('hot weather') || term.includes('seasonal')) {
    return 'summer';
  } else if (term.includes('home') || term.includes('decor') || term.includes('decoration') || term.includes('interior') || term.includes('furnish')) {
    return 'home decor';
  } else if (term.includes('shoe') || term.includes('sneaker') || term.includes('boots') || term.includes('footwear')) {
    return 'Footwear';
  } else if (term.includes('shirt') || term.includes('jacket') || term.includes('pant') || term.includes('dress') || term.includes('apparel')) {
    return 'Clothing';
  } else if (term.includes('phone') || term.includes('laptop') || term.includes('computer') || term.includes('tablet') || 
             term.includes('tech') || term.includes('gadget') || term.includes('electronics') || term.includes('digital')) {
    return 'Electronics';
  } else if (term.includes('game') || term.includes('xbox') || term.includes('playstation') || term.includes('nintendo') || term.includes('console')) {
    return 'Gaming';
  } else if (term.includes('book') || term.includes('novel') || term.includes('reading') || term.includes('literature')) {
    return 'Books';
  } else if (term.includes('tool') || term.includes('drill') || term.includes('saw') || term.includes('hardware')) {
    return 'Tools';
  } else if (term.includes('kitchen') || term.includes('cookware') || term.includes('appliance') || term.includes('culinary')) {
    return 'Kitchen';
  } else if (term.includes('toy') || term.includes('doll') || term.includes('lego') || term.includes('plaything')) {
    return 'Toys';
  } else if (term.includes('cowboys') || term.includes('sports') || term.includes('team') || term.includes('jersey') || term.includes('athletic')) {
    return 'Sports';
  }
  
  return 'General';
}
