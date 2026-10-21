const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/countries.ts');
const content = fs.readFileSync(filePath, 'utf8');

const updates = {
  KOS: {
    name: 'Kosovo',
    capital: 'Pristina',
    flag: '🇽🇰',
    aliases: ['Kosovo', 'Republic of Kosovo'],
    trivia: 'Kosovo has the youngest population in Europe, with over 50% of its citizens under the age of 30.'
  },
  PSX: {
    name: 'Palestine',
    capital: 'Ramallah',
    flag: '🇵🇸',
    aliases: ['Palestine', 'State of Palestine', 'West Bank', 'Gaza'],
    trivia: 'Jericho in Palestine is recognized as one of the oldest continuously inhabited walled cities on Earth, dating back over 11,000 years.'
  },
  SAH: {
    name: 'Western Sahara',
    capital: 'Laayoune',
    flag: '🇪🇭',
    aliases: ['Western Sahara', 'W. Sahara', 'Sahrawi Republic'],
    trivia: 'Western Sahara is home to the world\'s longest conveyor belt (98 km), carrying phosphate across the desert to the Atlantic coast.'
  },
  SDS: {
    name: 'South Sudan',
    capital: 'Juba',
    flag: '🇸🇸',
    aliases: ['South Sudan', 'S. Sudan', 'SSD'],
    trivia: 'South Sudan is the youngest recognized sovereign nation on Earth, gaining international independence in July 2011.'
  }
};

const start = content.indexOf('= [') + 2;
const end = content.lastIndexOf('];') + 1;
const list = JSON.parse(content.slice(start, end));

for (const c of list) {
  if (updates[c.code]) {
    const u = updates[c.code];
    c.name = u.name;
    c.capital = u.capital;
    c.flag = u.flag;
    c.aliases = u.aliases;
    c.trivia = u.trivia;
  }
}

const newContent = 'import { Country } from "../types/game";\n\nexport const COUNTRIES: Country[] = ' + JSON.stringify(list, null, 2) + ';\n';
fs.writeFileSync(filePath, newContent, 'utf8');
console.log('Successfully updated all 4 fallback countries in countries.ts');
