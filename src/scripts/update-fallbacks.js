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
  },
  // Natural Earth still uses old names for these
  SWZ: {
    name: 'Eswatini',
    capital: 'Mbabane',
    flag: '🇸🇿',
    aliases: ['Eswatini', 'Kingdom of Eswatini', 'Swaziland', 'Kingdom of Swaziland'],
    trivia: 'Eswatini (formerly Swaziland) is one of the last remaining absolute monarchies in Africa.'
  },
  MKD: {
    name: 'North Macedonia',
    capital: 'Skopje',
    flag: '🇲🇰',
    aliases: ['North Macedonia', 'Republic of North Macedonia', 'Macedonia', 'Former Yugoslav Republic of Macedonia'],
    trivia: 'North Macedonia has the world\'s fourth-oldest astronomical observatory at Kokino (3,800 years old).'
  },
  TUR: {
    name: 'Türkiye',
    capital: 'Ankara',
    flag: '🇹🇷',
    aliases: ['Türkiye', 'Republic of Türkiye', 'Turkey', 'Republic of Turkey'],
    trivia: 'Istanbul in Türkiye is the only city in the world situated on two continents (Europe and Asia).'
  },
  CZE: {
    name: 'Czechia',
    capital: 'Prague',
    flag: '🇨🇿',
    aliases: ['Czechia', 'Czech Republic'],
    trivia: 'Czechia drinks more beer per capita than any other nation in the world.'
  },
  TLS: {
    name: 'Timor-Leste',
    capital: 'Dili',
    flag: '🇹🇱',
    aliases: ['Timor-Leste', 'Democratic Republic of Timor-Leste', 'East Timor'],
    trivia: 'Timor-Leste gained independence in 2002, becoming the first newly sovereign nation of the 21st century in Asia.'
  },
  MMR: {
    name: 'Myanmar',
    capital: 'Naypyidaw',
    flag: '🇲🇲',
    aliases: ['Myanmar', 'Republic of the Union of Myanmar', 'Burma'],
    trivia: 'Naypyidaw has massive 20-lane highways that are famously almost empty.'
  },
  // Capital moved from Malabo by decree in January 2026
  GNQ: {
    name: 'Eq. Guinea',
    capital: 'Ciudad de la Paz',
    flag: '🇬🇶',
    aliases: ['Eq. Guinea', 'Equatorial Guinea', 'Republic of Equatorial Guinea'],
    trivia: 'Equatorial Guinea is the only sovereign country in Africa where Spanish is an official language.'
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
console.log('Successfully updated', Object.keys(updates).length, 'countries in countries.ts');
