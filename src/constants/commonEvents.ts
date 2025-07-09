// Common important dates for smart suggestions
export const COMMON_EVENTS = [
  // Personal & Family
  "My Birthday",
  "Mom's Birthday", 
  "Dad's Birthday",
  "Sister's Birthday",
  "Brother's Birthday",
  "Grandmother's Birthday",
  "Grandfather's Birthday",
  "Spouse's Birthday",
  "Partner's Birthday",
  "Child's Birthday",
  "Best Friend's Birthday",
  
  // Relationships
  "Anniversary",
  "Wedding Anniversary",
  "Dating Anniversary", 
  "First Date Anniversary",
  "Engagement Anniversary",
  
  // Holidays
  "Christmas",
  "New Year's Eve",
  "New Year's Day",
  "Valentine's Day",
  "Mother's Day",
  "Father's Day",
  "Easter",
  "Thanksgiving",
  "Halloween",
  "Fourth of July",
  "Memorial Day",
  "Labor Day",
  
  // Life Events
  "Graduation Day",
  "Wedding Day",
  "First Day of School",
  "Retirement Day",
  "Promotion Day",
  "Moving Day",
  
  // Cultural & Religious
  "Hanukkah",
  "Kwanzaa",
  "Chinese New Year",
  "Diwali",
  "Eid al-Fitr",
  "Passover",
  "Ramadan",
  
  // Work & Academic
  "Work Anniversary",
  "First Day at Job",
  "School Anniversary",
  "Graduation"
];

export const EVENT_CATEGORIES = {
  "birthday": [
    "My Birthday", "Mom's Birthday", "Dad's Birthday", "Sister's Birthday", 
    "Brother's Birthday", "Grandmother's Birthday", "Grandfather's Birthday",
    "Spouse's Birthday", "Partner's Birthday", "Child's Birthday", "Best Friend's Birthday"
  ],
  "anniversary": [
    "Anniversary", "Wedding Anniversary", "Dating Anniversary", 
    "First Date Anniversary", "Engagement Anniversary", "Work Anniversary"
  ],
  "holiday": [
    "Christmas", "New Year's Eve", "New Year's Day", "Valentine's Day",
    "Mother's Day", "Father's Day", "Easter", "Thanksgiving", "Halloween",
    "Fourth of July", "Memorial Day", "Labor Day", "Hanukkah", "Kwanzaa",
    "Chinese New Year", "Diwali", "Eid al-Fitr", "Passover"
  ],
  "milestone": [
    "Graduation Day", "Wedding Day", "First Day of School", "Retirement Day",
    "Promotion Day", "Moving Day", "First Day at Job", "School Anniversary"
  ]
};

// Common misspellings and their corrections
export const SPELLING_CORRECTIONS = {
  // Holidays
  "chrismas": "Christmas",
  "cristmas": "Christmas", 
  "xmas": "Christmas",
  "newyear": "New Year's Day",
  "newyears": "New Year's Eve",
  "valentines": "Valentine's Day",
  "valentinesday": "Valentine's Day",
  "mothersday": "Mother's Day",
  "fathersday": "Father's Day",
  "thanksgivng": "Thanksgiving",
  "thankgiving": "Thanksgiving",
  "independance": "Fourth of July",
  "independance day": "Fourth of July",
  "july4th": "Fourth of July",
  "july 4th": "Fourth of July",
  
  // Relationships
  "aniversary": "Anniversary",
  "annaversary": "Anniversary",
  "anniversery": "Anniversary",
  "aniversery": "Anniversary",
  "weding": "Wedding",
  "weeding": "Wedding",
  "engagment": "Engagement",
  
  // Family
  "bday": "Birthday",
  "b-day": "Birthday",
  "birhtday": "Birthday",
  "brithday": "Birthday",
  "birthay": "Birthday",
  "moms": "Mom's",
  "dads": "Dad's",
  "grandma": "Grandmother's",
  "grandpa": "Grandfather's",
  "granny": "Grandmother's",
  "grampa": "Grandfather's",
  
  // Life Events
  "graduaton": "Graduation",
  "gradiation": "Graduation",
  "retirment": "Retirement",
  "promtion": "Promotion",
  "promoton": "Promotion"
};