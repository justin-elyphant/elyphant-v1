interface MessageTemplate {
  occasion: string;
  templates: string[];
  variables: string[];
}

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    occasion: "birthday",
    templates: [
      "Happy Birthday, {name}! 🎉 Hope your special day is filled with joy and wonderful surprises!",
      "Wishing you the happiest of birthdays, {name}! 🎂 May this year bring you everything you've been hoping for!",
      "Happy Birthday to an amazing person! 🎈 Hope you have a fantastic day, {name}!",
      "Another year older, another year more awesome! 🎉 Happy Birthday, {name}!"
    ],
    variables: ["{name}"]
  },
  {
    occasion: "anniversary",
    templates: [
      "Happy Anniversary, {name}! 💕 Celebrating another year of love and happiness together!",
      "Wishing you both a wonderful anniversary! 🥂 Here's to many more years of joy, {name}!",
      "Happy Anniversary! 💖 May your love continue to grow stronger with each passing year, {name}!",
      "Celebrating your special day, {name}! 🌹 Wishing you both endless happiness!"
    ],
    variables: ["{name}"]
  },
  {
    occasion: "christmas",
    templates: [
      "Merry Christmas, {name}! 🎄 May your holidays be filled with warmth, joy, and wonderful moments!",
      "Wishing you a magical Christmas, {name}! ✨ Hope Santa brings you everything on your list!",
      "Merry Christmas! 🎁 May this festive season bring you peace, love, and happiness, {name}!",
      "Ho ho ho! 🎅 Merry Christmas, {name}! Hope your holidays are merry and bright!"
    ],
    variables: ["{name}"]
  },
  {
    occasion: "valentine",
    templates: [
      "Happy Valentine's Day, {name}! 💝 Sending you love and warm wishes on this special day!",
      "Roses are red, violets are blue... 🌹 Happy Valentine's Day to someone as special as you, {name}!",
      "Happy Valentine's Day! 💕 Hope your day is filled with love and sweet surprises, {name}!",
      "Sending you lots of love this Valentine's Day, {name}! 💖 You're simply amazing!"
    ],
    variables: ["{name}"]
  },
  {
    occasion: "mothers_day",
    templates: [
      "Happy Mother's Day, {name}! 🌸 Thank you for all the love and care you give every day!",
      "To an incredible mom - Happy Mother's Day, {name}! 💐 You deserve all the appreciation in the world!",
      "Happy Mother's Day! 🌷 Your love and strength inspire everyone around you, {name}!",
      "Celebrating you today and always, {name}! 🌺 Happy Mother's Day to a truly wonderful mom!"
    ],
    variables: ["{name}"]
  },
  {
    occasion: "fathers_day",
    templates: [
      "Happy Father's Day, {name}! 👔 Thank you for being such an amazing dad and role model!",
      "To a fantastic father - Happy Father's Day, {name}! 🎯 Your guidance and love mean the world!",
      "Happy Father's Day! 🏆 You're not just a great dad, but an incredible person, {name}!",
      "Celebrating you today, {name}! 🎉 Happy Father's Day to someone who makes fatherhood look easy!"
    ],
    variables: ["{name}"]
  },
  {
    occasion: "graduation",
    templates: [
      "Congratulations on your graduation, {name}! 🎓 Your hard work and dedication have paid off!",
      "Way to go, {name}! 🎉 So proud of all you've accomplished. The future is bright!",
      "Congratulations, graduate! 🎓 {name}, you've earned every bit of this success!",
      "Hats off to you, {name}! 🎓 Your graduation is just the beginning of amazing things to come!"
    ],
    variables: ["{name}"]
  },
  {
    occasion: "promotion",
    templates: [
      "Congratulations on your promotion, {name}! 🚀 Your hard work and talent have been recognized!",
      "Way to go, {name}! 🎉 So excited to hear about your promotion. You've earned it!",
      "Congratulations! 🏆 {name}, your dedication and success are truly inspiring!",
      "Cheers to your promotion, {name}! 🥂 Here's to your continued success and growth!"
    ],
    variables: ["{name}"]
  },
  {
    occasion: "custom",
    templates: [
      "Thinking of you on this special day, {name}! 💝 Hope it's absolutely wonderful!",
      "Celebrating you today, {name}! 🎉 Wishing you all the happiness in the world!",
      "Hope your special day is amazing, {name}! ✨ You deserve all the joy and love!",
      "Sending you warm wishes, {name}! 💖 May this day bring you everything you're hoping for!"
    ],
    variables: ["{name}"]
  }
];

export const getMessageTemplate = (occasion: string): MessageTemplate => {
  const template = MESSAGE_TEMPLATES.find(t => t.occasion === occasion);
  return template || MESSAGE_TEMPLATES[MESSAGE_TEMPLATES.length - 1]; // fallback to custom
};

export const generateDefaultMessage = (occasion: string, recipientName: string, customName?: string): string => {
  const template = getMessageTemplate(occasion);
  const randomTemplate = template.templates[Math.floor(Math.random() * template.templates.length)];
  
  // Replace variables
  let message = randomTemplate.replace(/{name}/g, recipientName);
  
  // For custom occasions, we might want to incorporate the custom name
  if (occasion === "custom" && customName) {
    message = `Happy ${customName}, ${recipientName}! 🎉 Hope this special day brings you joy and wonderful memories!`;
  }
  
  return message;
};

export const replaceMessageVariables = (message: string, recipientName: string): string => {
  return message.replace(/{name}/g, recipientName);
};