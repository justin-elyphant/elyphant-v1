
/**
 * Helper to guess a product category from search term
 */
export function guessCategory(term: string): string {
  term = term.toLowerCase();
  
  // Add occasion-based category guessing
  if (term.includes('birthday') || term.includes('celebration')) {
    return 'Birthday';
  } else if (term.includes('wedding') || term.includes('bride') || term.includes('groom')) {
    return 'Wedding';
  } else if (term.includes('anniversary')) {
    return 'Anniversary';
  } else if (term.includes('graduation') || term.includes('graduate')) {
    return 'Graduation';
  } else if (term.includes('baby') || term.includes('shower')) {
    return 'Baby Shower';
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
