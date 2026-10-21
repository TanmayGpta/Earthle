const fs = require('fs');
const path = require('path');

const geoPath = path.join(__dirname, '../../public/data/ne_110m.geojson');
const outPath = path.join(__dirname, '../data/countries.ts');

const geo = JSON.parse(fs.readFileSync(geoPath, 'utf8'));

function getGeoStats(geometry) {
  let minLng = 180, maxLng = -180, minLat = 90, maxLat = -90;
  function process(c) {
    if (typeof c[0] === 'number') {
      const [lng, lat] = c;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    } else {
      for (const sub of c) process(sub);
    }
  }
  process(geometry.coordinates);
  const lat = (minLat + maxLat) / 2;
  const lng = (minLng + maxLng) / 2;
  const span = Math.max(maxLng - minLng, maxLat - minLat);
  let altitude = 1.4;
  if (span < 5) altitude = 0.8;
  else if (span < 12) altitude = 1.1;
  else if (span < 25) altitude = 1.5;
  else if (span < 50) altitude = 1.8;
  else altitude = 2.2;
  return { lat: Number(lat.toFixed(2)), lng: Number(lng.toFixed(2)), altitude };
}

const capitalsMap = {
  'AFG': { cap: 'Kabul', flag: '🇦🇫', t: 'Afghanistan is home to the world\'s oldest known oil paintings, created in the Bamiyan caves around 650 AD.' },
  'AGO': { cap: 'Luanda', flag: '🇦🇴', t: 'Angola\'s capital Luanda was founded in 1575 and is known as the Paris of Africa.' },
  'ALB': { cap: 'Tirana', flag: '🇦🇱', t: 'Albania has more than 173,000 concrete military bunkers scattered across its landscape.' },
  'ARE': { cap: 'Abu Dhabi', flag: '🇦🇪', t: 'The UAE is home to Burj Khalifa, the tallest building on Earth at 828 meters.' },
  'ARG': { cap: 'Buenos Aires', flag: '🇦🇷', t: 'Argentina is home to both the highest peak (Aconcagua) and lowest point in the Southern Hemisphere.' },
  'ARM': { cap: 'Yerevan', flag: '🇦🇲', t: 'Yerevan is one of the world\'s oldest continuously inhabited cities, founded in 782 BC.' },
  'ATA': { cap: 'None', flag: '🇦🇶', t: 'Antarctica is the coldest, windiest, and driest continent, holding roughly 70% of Earth\'s fresh water.' },
  'ATF': { cap: 'Port-aux-Français', flag: '🇹🇫', t: 'The French Southern and Antarctic Lands include the remote Kerguelen Islands, known as the Desolation Islands.' },
  'AUS': { cap: 'Canberra', flag: '🇦🇺', t: 'Australia is wider than the Moon—nearly 4,000 km east-to-west compared to the Moon\'s 3,474 km diameter.' },
  'AUT': { cap: 'Vienna', flag: '🇦🇹', t: 'Austria is home to the world\'s oldest zoo (Tiergarten Schönbrunn), opened in 1752.' },
  'AZE': { cap: 'Baku', flag: '🇦🇿', t: 'Azerbaijan is known as the Land of Fire due to subterranean gas fires burning continuously for centuries.' },
  'BDI': { cap: 'Gitega', flag: '🇧🇮', t: 'Burundi\'s Lake Tanganyika is the world\'s second-oldest and second-deepest freshwater lake.' },
  'BEL': { cap: 'Brussels', flag: '🇧🇪', t: 'Belgium produces over 220,000 tons of high-grade chocolate every year.' },
  'BEN': { cap: 'Porto-Novo', flag: '🇧🇯', t: 'Benin is the birthplace of the Vodun religion, officially recognized as a religion in 1996.' },
  'BFA': { cap: 'Ouagadougou', flag: '🇧🇫', t: 'Burkina Faso translates to "Land of Incorruptible People".' },
  'BGD': { cap: 'Dhaka', flag: '🇧🇩', t: 'Bangladesh has the world\'s longest natural sea beach at Cox\'s Bazar (120 km unbroken).' },
  'BGR': { cap: 'Sofia', flag: '🇧🇬', t: 'Bulgaria is the world\'s leading producer of rose oil, producing up to 85% of the global supply.' },
  'BHS': { cap: 'Nassau', flag: '🇧🇸', t: 'The Bahamas consists of over 700 islands and cays, but only about 30 are inhabited.' },
  'BIH': { cap: 'Sarajevo', flag: '🇧🇦', t: 'Sarajevo hosted the 1984 Winter Olympics, the first held in a socialist state.' },
  'BLR': { cap: 'Minsk', flag: '🇧🇾', t: 'Over 40% of Belarus is covered by dense ancient forest, including primeval Belovezha Forest.' },
  'BLZ': { cap: 'Belmopan', flag: '🇧🇿', t: 'Belize is the only country in Central America with English as its sole official language.' },
  'BOL': { cap: 'Sucre', flag: '🇧🇴', t: 'Bolivia\'s Salar de Uyuni is the world\'s largest salt flat, spanning over 10,500 square kilometers.' },
  'BRA': { cap: 'Brasília', flag: '🇧🇷', t: 'Brazil is home to the Amazon Rainforest, which produces roughly 20% of Earth\'s river flow.' },
  'BRN': { cap: 'Bandar Seri Begawan', flag: '🇧🇳', t: 'Brunei is home to Istana Nurul Iman, the world\'s largest residential palace with 1,788 rooms.' },
  'BTN': { cap: 'Thimphu', flag: '🇧🇹', t: 'Bhutan measures its development by Gross National Happiness rather than Gross Domestic Product.' },
  'BWA': { cap: 'Gaborone', flag: '🇧🇼', t: 'Botswana is home to the Okavango Delta, one of the few inland deltas that never flows into an ocean.' },
  'CAF': { cap: 'Bangui', flag: '🇨🇫', t: 'The Central African Republic is home to Dzanga-Sangha, where hundreds of forest elephants gather daily.' },
  'CAN': { cap: 'Ottawa', flag: '🇨🇦', t: 'Canada has more lakes than the rest of the world combined, holding 20% of Earth\'s surface fresh water.' },
  'CHE': { cap: 'Bern', flag: '🇨🇭', t: 'Switzerland has enough nuclear fallout shelters to shelter 100% of its population.' },
  'CHL': { cap: 'Santiago', flag: '🇨🇱', t: 'Chile is home to the Atacama Desert, the driest non-polar desert on Earth.' },
  'CHN': { cap: 'Beijing', flag: '🇨🇳', t: 'China spans five geographic time zones, but the entire country operates on a single time zone.' },
  'CIV': { cap: 'Yamoussoukro', flag: '🇨🇮', t: 'Yamoussoukro is home to the Basilica of Our Lady of Peace, the largest Christian church on Earth.' },
  'CMR': { cap: 'Yaoundé', flag: '🇨🇲', t: 'Cameroon is often called "Africa in Miniature" due to its diverse climates, terrains, and cultures.' },
  'COD': { cap: 'Kinshasa', flag: '🇨🇩', t: 'Kinshasa and Brazzaville are the two closest national capitals in the world, separated only by the Congo River.' },
  'COG': { cap: 'Brazzaville', flag: '🇨🇬', t: 'The Republic of the Congo was once part of the French colony of Equatorial Africa.' },
  'COL': { cap: 'Bogotá', flag: '🇨🇴', t: 'Colombia is the world\'s second most biodiverse nation per square kilometer, after Brazil.' },
  'CRI': { cap: 'San José', flag: '🇨🇷', t: 'Costa Rica constitutionally abolished its standing army in 1948 and runs on 98%+ renewable electricity.' },
  'CUB': { cap: 'Havana', flag: '🇨🇺', t: 'Cuba is the largest island in the Caribbean, stretching over 1,200 km from east to west.' },
  'CYN': { cap: 'North Nicosia', flag: '🇨🇾', t: 'Northern Cyprus occupies the northeastern portion of the island of Cyprus.' },
  'CYP': { cap: 'Nicosia', flag: '🇨🇾', t: 'Nicosia is the only remaining divided capital city in the world, split by a UN buffer zone.' },
  'CZE': { cap: 'Prague', flag: '🇨🇿', t: 'The Czech Republic drinks more beer per capita than any other nation in the world.' },
  'DEU': { cap: 'Berlin', flag: '🇩🇪', t: 'Germany was the first country in the world to adopt Daylight Saving Time in 1916.' },
  'DJI': { cap: 'Djibouti', flag: '🇩🇯', t: 'Djibouti\'s Lake Assal is the lowest point in Africa, sitting 155 meters below sea level.' },
  'DNK': { cap: 'Copenhagen', flag: '🇩🇰', t: 'Denmark is home to the two oldest continuously operating amusement parks in the world.' },
  'DOM': { cap: 'Santo Domingo', flag: '🇩🇴', t: 'Santo Domingo, founded in 1496, is the oldest permanently inhabited European settlement in the Americas.' },
  'DZA': { cap: 'Algiers', flag: '🇩🇿', t: 'Algeria is the largest country by land area in both Africa and the Arab world.' },
  'ECU': { cap: 'Quito', flag: '🇪🇨', t: 'Mount Chimborazo in Ecuador is the closest point on Earth\'s surface to the stars due to equatorial bulge.' },
  'EGY': { cap: 'Cairo', flag: '🇪🇬', t: 'The Great Pyramid of Giza was the tallest man-made structure on Earth for over 3,800 years.' },
  'ERI': { cap: 'Asmara', flag: '🇪🇷', t: 'Asmara is famous for its remarkably preserved Italian modernist and Art Deco architecture.' },
  'ESP': { cap: 'Madrid', flag: '🇪🇸', t: 'Spain produces more than 40% of the entire world\'s olive oil supply.' },
  'EST': { cap: 'Tallinn', flag: '🇪🇪', t: 'Estonia was the first country in the world to allow internet voting in a general election in 2005.' },
  'ETH': { cap: 'Addis Ababa', flag: '🇪🇹', t: 'Ethiopia follows its own 13-month calendar and is roughly seven to eight years behind the Gregorian calendar.' },
  'FIN': { cap: 'Helsinki', flag: '🇫🇮', t: 'Finland has roughly 3.3 million saunas for a population of 5.5 million people.' },
  'FJI': { cap: 'Suva', flag: '🇫🇯', t: 'Fiji consists of 332 volcanic islands, of which only 110 are permanently inhabited.' },
  'FLK': { cap: 'Stanley', flag: '🇫🇰', t: 'The Falkland Islands are home to over 1 million penguins—far outnumbering the human population.' },
  'FRA': { cap: 'Paris', flag: '🇫🇷', t: 'France spans 12 different time zones when including overseas territories—more than any other nation.' },
  'GAB': { cap: 'Libreville', flag: '🇬🇦', t: 'Roughly 85% of Gabon is covered in lush tropical rainforest, home to over half of Africa\'s forest elephants.' },
  'GBR': { cap: 'London', flag: '🇬🇧', t: 'Nowhere in the United Kingdom is more than 113 km (70 miles) from the coastline.' },
  'GEO': { cap: 'Tbilisi', flag: '🇬🇪', t: 'Georgia is considered the cradle of wine, with winemaking evidence dating back 8,000 years.' },
  'GHA': { cap: 'Accra', flag: '🇬🇭', t: 'Ghana is home to Lake Volta, the largest artificial reservoir in the world by surface area.' },
  'GIN': { cap: 'Conakry', flag: '🇬🇳', t: 'Guinea holds roughly one-third of the entire world\'s known reserves of bauxite.' },
  'GMB': { cap: 'Banjul', flag: '🇬🇲', t: 'The Gambia is the smallest country in mainland Africa, closely tracing the banks of the Gambia River.' },
  'GNB': { cap: 'Bissau', flag: '🇬🇼', t: 'The Bijagós Archipelago off Guinea-Bissau is a UNESCO Biosphere Reserve with saltwater hippos.' },
  'GNQ': { cap: 'Malabo', flag: '🇬🇶', t: 'Equatorial Guinea is the only sovereign country in Africa where Spanish is an official language.' },
  'GRC': { cap: 'Athens', flag: '🇬🇷', t: 'Greece has thousands of islands and over 13,000 km of coastline, the 11th longest in the world.' },
  'GRL': { cap: 'Nuuk', flag: '🇬🇱', t: 'Greenland is the largest island in the world that is not an independent continent.' },
  'GTM': { cap: 'Guatemala City', flag: '🇬🇹', t: 'Guatemala was the heartland of the ancient Maya civilization, home to the monumental ruins of Tikal.' },
  'GUY': { cap: 'Georgetown', flag: '🇬🇾', t: 'Guyana\'s Kaieteur Falls is the world\'s widest single-drop waterfall by volume of water.' },
  'HND': { cap: 'Tegucigalpa', flag: '🇭🇳', t: 'Honduras is home to the Yoro "Rain of Fish" phenomenon, a documented meteorological anomaly.' },
  'HRV': { cap: 'Zagreb', flag: '🇭🇷', t: 'Croatia is the birthplace of the necktie (cravat), popularized by 17th-century Croatian mercenaries.' },
  'HTI': { cap: 'Port-au-Prince', flag: '🇭🇹', t: 'Haiti was the first independent republic of Latin America and the Caribbean, founded in 1804.' },
  'HUN': { cap: 'Budapest', flag: '🇭🇺', t: 'Budapest has the oldest electrified underground railway system in continental Europe, built in 1896.' },
  'IDN': { cap: 'Jakarta', flag: '🇮🇩', t: 'Indonesia is the largest island country in the world, comprising more than 17,000 islands.' },
  'IND': { cap: 'New Delhi', flag: '🇮🇳', t: 'India is the world\'s most populous country and the birthplace of chess, zero, and trigonometry.' },
  'IRL': { cap: 'Dublin', flag: '🇮🇪', t: 'Ireland is one of the few places on Earth with zero native wild snake species.' },
  'IRN': { cap: 'Tehran', flag: '🇮🇷', t: 'Iran has 24 UNESCO World Heritage Sites and was home to the ancient Persian Empire.' },
  'IRQ': { cap: 'Baghdad', flag: '🇮🇶', t: 'Iraq was historically known as Mesopotamia, the "Cradle of Civilization" where writing was invented.' },
  'ISL': { cap: 'Reykjavik', flag: '🇮🇸', t: 'Iceland generates 100% of its electricity from renewable sources (hydroelectric and geothermal).' },
  'ISR': { cap: 'Jerusalem', flag: '🇮🇱', t: 'The Dead Sea on Israel\'s eastern border is Earth\'s lowest land elevation at 430 meters below sea level.' },
  'ITA': { cap: 'Rome', flag: '🇮🇹', t: 'Italy has more UNESCO World Heritage Sites (59) than any other country in the world.' },
  'JAM': { cap: 'Kingston', flag: '🇯🇲', t: 'Jamaica was the first Caribbean nation to produce world-record sprinting dominance with Usain Bolt.' },
  'JOR': { cap: 'Amman', flag: '🇯🇴', t: 'Jordan\'s ancient city of Petra was carved directly into vibrant rose-red sandstone cliffs over 2,000 years ago.' },
  'JPN': { cap: 'Tokyo', flag: '🇯🇵', t: 'Greater Tokyo is the most populous metropolitan area on Earth, home to over 37 million people.' },
  'KAZ': { cap: 'Astana', flag: '🇰🇿', t: 'Kazakhstan is the largest landlocked country in the world, larger than all of Western Europe combined.' },
  'KEN': { cap: 'Nairobi', flag: '🇰🇪', t: 'Nairobi is the only global capital in the world with a national safari park bordering the city skyline.' },
  'KGZ': { cap: 'Bishkek', flag: '🇰🇬', t: 'Kyrgyzstan\'s Epic of Manas is the longest epic poem in recorded human history, with 500,000+ lines.' },
  'KHM': { cap: 'Phnom Penh', flag: '🇰🇭', t: 'Cambodia\'s Angkor Wat is the largest religious monument in the world, spanning over 160 hectares.' },
  'KOR': { cap: 'Seoul', flag: '🇰🇷', t: 'South Korea has the fastest average internet speeds and highest smartphone ownership rate in the world.' },
  'KWT': { cap: 'Kuwait City', flag: '🇰🇼', t: 'The Kuwaiti Dinar (KWD) is the highest-valued currency unit in the world.' },
  'LAO': { cap: 'Vientiane', flag: '🇱🇦', t: 'Laos is the only landlocked country in Southeast Asia, traversed by the mighty Mekong River.' },
  'LBN': { cap: 'Beirut', flag: '🇱🇧', t: 'Byblos in Lebanon is one of the oldest continuously inhabited cities on Earth, settled by 5000 BC.' },
  'LBR': { cap: 'Monrovia', flag: '🇱🇷', t: 'Liberia was founded in 1822 by free African Americans and is Africa\'s oldest modern republic.' },
  'LBY': { cap: 'Tripoli', flag: '🇱🇾', t: 'Over 90% of Libya is covered by the Sahara Desert, with almost zero permanent rivers.' },
  'LKA': { cap: 'Sri Jayawardenepura Kotte', flag: '🇱🇰', t: 'Sri Lanka was the first country in modern history to elect a female head of government in 1960.' },
  'LSO': { cap: 'Maseru', flag: '🇱🇸', t: 'Lesotho is the only independent state on Earth that lies entirely above 1,000 meters in altitude.' },
  'LTU': { cap: 'Vilnius', flag: '🇱🇹', t: 'Lithuania in the 15th century was the Grand Duchy of Lithuania, the largest country in Europe.' },
  'LUX': { cap: 'Luxembourg', flag: '🇱🇺', t: 'Luxembourg was the first country in the world to make all public transit nationwide completely free.' },
  'LVA': { cap: 'Riga', flag: '🇱🇻', t: 'Latvia has one of the highest percentages of forest cover in Europe and pristine Baltic beaches.' },
  'MAR': { cap: 'Rabat', flag: '🇲🇦', t: 'Morocco\'s University of al-Qarawiyyin in Fez was founded in 859 AD and is the oldest university in the world.' },
  'MDA': { cap: 'Chisinau', flag: '🇲🇩', t: 'Moldova is home to Mileștii Mici, the world\'s largest underground wine cellar stretching over 200 kilometers.' },
  'MDG': { cap: 'Antananarivo', flag: '🇲🇬', t: 'Roughly 90% of Madagascar\'s wildlife is endemic and found nowhere else on the planet.' },
  'MEX': { cap: 'Mexico City', flag: '🇲🇽', t: 'Mexico City was built on the ruins of the Aztec capital Tenochtitlan and sinks several inches annually.' },
  'MKD': { cap: 'Skopje', flag: '🇲🇰', t: 'North Macedonia has the world\'s fourth-oldest astronomical observatory at Kokino (3,800 years old).' },
  'MLI': { cap: 'Bamako', flag: '🇲🇱', t: 'Mali was once the center of the Mali Empire, whose 14th-century ruler Mansa Musa is considered the wealthiest human ever.' },
  'MMR': { cap: 'Naypyidaw', flag: '🇲🇲', t: 'Naypyidaw has massive 20-lane highways that are famously almost empty.' },
  'MNE': { cap: 'Podgorica', flag: '🇲🇪', t: 'Montenegro was declared the world\'s first official "Ecological State" in 1991.' },
  'MNG': { cap: 'Ulaanbaatar', flag: '🇲🇳', t: 'Mongolia is the most sparsely populated sovereign state in the world, with only 2 people per sq km.' },
  'MOZ': { cap: 'Maputo', flag: '🇲🇿', t: 'Mozambique is the only national flag in the world that features a modern firearm (an AK-47).' },
  'MRT': { cap: 'Nouakchott', flag: '🇲🇷', t: 'Mauritania is home to the Eye of the Sahara, a prominent 40-km geologic dome visible from space.' },
  'MWI': { cap: 'Lilongwe', flag: '🇲🇼', t: 'Lake Malawi contains more distinct species of fish than any other freshwater lake on Earth.' },
  'MYS': { cap: 'Kuala Lumpur', flag: '🇲🇾', t: 'Malaysia\'s Petronas Towers were the tallest buildings in the world from 1998 to 2004.' },
  'NAM': { cap: 'Windhoek', flag: '🇳🇦', t: 'Namibia\'s Namib Desert is considered the oldest desert in the world, having existed for over 55 million years.' },
  'NCL': { cap: 'Nouméa', flag: '🇳🇨', t: 'New Caledonia possesses roughly 25% of the world\'s known nickel resources.' },
  'NER': { cap: 'Niamey', flag: '🇳🇪', t: 'Niger is known as the "Frying Pan of the World" due to its intense Saharan temperatures.' },
  'NGA': { cap: 'Abuja', flag: '🇳🇬', t: 'Nigeria is Africa\'s most populous nation, home to more than 220 million people across 250 ethnic groups.' },
  'NIC': { cap: 'Managua', flag: '🇳🇮', t: 'Lake Nicaragua is the only freshwater lake in the world that contains oceanic life including bull sharks.' },
  'NLD': { cap: 'Amsterdam', flag: '🇳🇱', t: 'Roughly 26% of the Netherlands lies below sea level, protected by legendary dyke systems.' },
  'NOR': { cap: 'Oslo', flag: '🇳🇴', t: 'Norway introduced salmon sushi to Japan in the 1980s through a commercial trade project.' },
  'NPL': { cap: 'Kathmandu', flag: '🇳🇵', t: 'Nepal has the only national flag in the world that is non-rectangular.' },
  'NZL': { cap: 'Wellington', flag: '🇳🇿', t: 'Wellington is the southernmost national capital city in the entire world.' },
  'OMN': { cap: 'Muscat', flag: '🇴🇲', t: 'Oman has been continuously producing frankincense for more than 5,000 years.' },
  'PAK': { cap: 'Islamabad', flag: '🇵🇰', t: 'Pakistan produces more than half of the world\'s hand-stitched footballs (soccer balls) in Sialkot.' },
  'PAN': { cap: 'Panama City', flag: '🇵🇦', t: 'Panama is the only place in the world where you can watch the sunrise on the Pacific and set on the Atlantic.' },
  'PER': { cap: 'Lima', flag: '🇵🇪', t: 'Peru is the birthplace of the potato, cultivating over 4,000 native varieties in the Andean highlands.' },
  'PHL': { cap: 'Manila', flag: '🇵🇭', t: 'The Philippines is an archipelago of 7,641 islands, approximately 2,000 of which are inhabited.' },
  'PNG': { cap: 'Port Moresby', flag: '🇵🇬', t: 'Papua New Guinea is the most linguistically diverse nation on Earth, with over 840 living languages.' },
  'POL': { cap: 'Warsaw', flag: '🇵🇱', t: 'Poland\'s Wieliczka Salt Mine has been mined since the 13th century and features entire underground chapels of salt.' },
  'PRI': { cap: 'San Juan', flag: '🇵🇷', t: 'Puerto Rico is home to El Yunque, the only tropical rainforest in the United States National Forest System.' },
  'PRK': { cap: 'Pyongyang', flag: '🇰🇵', t: 'North Korea follows the Juche calendar, counting years from 1912, the birth year of Kim Il-sung.' },
  'PRT': { cap: 'Lisbon', flag: '🇵🇹', t: 'Portugal is the oldest nation-state on the Iberian Peninsula, maintaining defined borders since 1297.' },
  'PRY': { cap: 'Asunción', flag: '🇵🇾', t: 'Paraguay produces virtually 100% of its domestic electricity from clean hydroelectric dams.' },
  'QAT': { cap: 'Doha', flag: '🇶🇦', t: 'Qatar has the highest GDP per capita in the Arab world and hosted the 2022 World Cup.' },
  'ROU': { cap: 'Bucharest', flag: '🇷🇴', t: 'Romania\'s Palace of the Parliament is the heaviest building in the world at 4.1 million tons.' },
  'RUS': { cap: 'Moscow', flag: '🇷🇺', t: 'Russia covers 11 time zones and accounts for roughly one-eighth of Earth\'s inhabited land area.' },
  'RWA': { cap: 'Kigali', flag: '🇷🇼', t: 'Rwanda banned single-use plastic bags in 2008 and Kigali is celebrated as one of Africa\'s cleanest cities.' },
  'SAU': { cap: 'Riyadh', flag: '🇸🇦', t: 'Saudi Arabia is the largest country in the world without a single permanent natural river.' },
  'SDN': { cap: 'Khartoum', flag: '🇸🇩', t: 'Sudan has more ancient pyramids (over 200 in the Kingdom of Kush) than Egypt.' },
  'SEN': { cap: 'Dakar', flag: '🇸🇳', t: 'Senegal\'s Lake Retba (Lac Rose) has water naturally colored bright pink due to unique algae.' },
  'SLB': { cap: 'Honiara', flag: '🇸🇧', t: 'The Solomon Islands were named by Spanish explorers who believed they held King Solomon\'s gold.' },
  'SLE': { cap: 'Freetown', flag: '🇸🇱', t: 'Sierra Leone is home to the historic Cotton Tree, a famous symbol of freedom.' },
  'SLV': { cap: 'San Salvador', flag: '🇸🇻', t: 'El Salvador is known as the "Land of Volcanoes" and was the first nation to adopt Bitcoin as legal tender.' },
  'SOL': { cap: 'Hargeisa', flag: '🇸🇴', t: 'Somaliland has its own currency, parliament, and passport despite declaring independence in 1991.' },
  'SOM': { cap: 'Mogadishu', flag: '🇸🇴', t: 'Somalia has the longest coastline in mainland Africa, stretching over 3,333 kilometers.' },
  'SRB': { cap: 'Belgrade', flag: '🇷🇸', t: 'Belgrade is one of the oldest cities in Europe, fought over in 115 wars throughout history.' },
  'SSD': { cap: 'Juba', flag: '🇸🇸', t: 'South Sudan is the youngest recognized sovereign nation on Earth, gaining independence in July 2011.' },
  'SUR': { cap: 'Paramaribo', flag: '🇸🇷', t: 'Suriname is the only independent nation in South America where Dutch is the official national language.' },
  'SVK': { cap: 'Bratislava', flag: '🇸🇰', t: 'Bratislava borders two other sovereign states (Austria and Hungary)—the only capital in the world to do so.' },
  'SVN': { cap: 'Ljubljana', flag: '🇸🇮', t: 'Slovenia is home to the world\'s oldest wooden wheel, dating back 5,200 years.' },
  'SWE': { cap: 'Stockholm', flag: '🇸🇪', t: 'Sweden has an estimated 267,000 islands, more than any other country on the planet.' },
  'SWZ': { cap: 'Mbabane', flag: '🇸🇿', t: 'Eswatini (formerly Swaziland) is one of the last remaining absolute monarchies in Africa.' },
  'SYR': { cap: 'Damascus', flag: '🇸🇾', t: 'Damascus is widely considered one of the oldest continuously inhabited cities on Earth.' },
  'TCD': { cap: 'N\'Djamena', flag: '🇹🇩', t: 'Chad\'s Tibesti Mountains feature the highest volcanic peak in the Sahara Desert, Emi Koussi at 3,445 meters.' },
  'TGO': { cap: 'Lomé', flag: '🇹🇬', t: 'Togo is home to the Akodessewa Fetish Market, the largest traditional voodoo market in the world.' },
  'THA': { cap: 'Bangkok', flag: '🇹🇭', t: 'Thailand is the only Southeast Asian nation that was never colonized by a European superpower.' },
  'TJK': { cap: 'Dushanbe', flag: '🇹🇯', t: 'More than 90% of Tajikistan is mountainous, dominated by the towering Pamir Mountain range.' },
  'TKM': { cap: 'Ashgabat', flag: '🇹🇲', t: 'Turkmenistan is home to the Darvaza gas crater ("Gates of Hell"), an underground cavern burning since 1971.' },
  'TLS': { cap: 'Dili', flag: '🇹🇱', t: 'East Timor gained independence in 2002, becoming the first newly sovereign nation of the 21st century in Asia.' },
  'TTO': { cap: 'Port of Spain', flag: '🇹🇹', t: 'Trinidad and Tobago is the birthplace of the steelpan drum, invented in the 20th century.' },
  'TUN': { cap: 'Tunis', flag: '🇹🇳', t: 'Tunisia was the site of ancient Carthage, Hannibal\'s seafaring empire that rivaled the Roman Republic.' },
  'TUR': { cap: 'Ankara', flag: '🇹🇷', t: 'Istanbul in Turkey is the only city in the world situated on two continents (Europe and Asia).' },
  'TWN': { cap: 'Taipei', flag: '🇹🇼', t: 'Taiwan produces over 60% of the world\'s semiconductors and over 90% of advanced chips.' },
  'TZA': { cap: 'Dodoma', flag: '🇹🇿', t: 'Tanzania is home to Mount Kilimanjaro, the highest free-standing mountain in the world at 5,895 meters.' },
  'UGA': { cap: 'Kampala', flag: '🇺🇬', t: 'Uganda is home to more than half of the world\'s remaining endangered mountain gorilla population.' },
  'UKR': { cap: 'Kyiv', flag: '🇺🇦', t: 'Kyiv\'s Arsenalna metro station is the second deepest subway station in the world at 105.5 meters underground.' },
  'URY': { cap: 'Montevideo', flag: '🇺🇾', t: 'Uruguay hosted and won the very first FIFA World Cup in 1930 in Montevideo.' },
  'USA': { cap: 'Washington, D.C.', flag: '🇺🇸', t: 'The United States has the world\'s largest economy and the longest interstate highway system.' },
  'UZB': { cap: 'Tashkent', flag: '🇺🇿', t: 'Uzbekistan and Liechtenstein are the only two "doubly landlocked" countries in the world.' },
  'VEN': { cap: 'Caracas', flag: '🇻🇪', t: 'Venezuela is home to Angel Falls, the world\'s uninterrupted tallest waterfall with a drop of 979 meters.' },
  'VNM': { cap: 'Hanoi', flag: '🇻🇳', t: 'Vietnam is home to Sơn Đoòng, the largest natural cave passage in the world.' },
  'VUT': { cap: 'Port Vila', flag: '🇻🇺', t: 'Vanuatu\'s Pentecost Island is the original birthplace of land diving, the predecessor of bungee jumping.' },
  'WBG': { cap: 'Ramallah', flag: '🇵🇸', t: 'The West Bank contains Jericho, recognized as the oldest continuously inhabited walled city in the world.' },
  'YEM': { cap: 'Sana\'a', flag: '🇾🇪', t: 'Yemen\'s ancient city of Shibam is dubbed the "Manhattan of the Desert" for its mudbrick skyscrapers.' },
  'ZAF': { cap: 'Pretoria', flag: '🇿🇦', t: 'South Africa is the only nation on Earth with three official capital cities: Pretoria, Cape Town, and Bloemfontein.' },
  'ZMB': { cap: 'Lusaka', flag: '🇿🇲', t: 'Zambia shares Victoria Falls, the world\'s greatest sheet of falling water.' },
  'ZWE': { cap: 'Harare', flag: '🇿🇼', t: 'Zimbabwe was named after the ancient stone city of Great Zimbabwe, built between 1100 and 1450 AD.' }
};

const result = [];
for (const f of geo.features) {
  const code = f.properties.ADM0_A3 || f.properties.ISO_A3;
  const name = f.properties.NAME || f.properties.ADMIN;
  const continent = f.properties.CONTINENT || 'Other';
  const stats = getGeoStats(f.geometry);
  const meta = capitalsMap[code] || { cap: 'Capital', flag: '🌐', t: name + ' is located in ' + continent + '.' };
  
  const aliases = [name];
  if (f.properties.NAME_LONG && f.properties.NAME_LONG !== name) aliases.push(f.properties.NAME_LONG);
  if (f.properties.FORMAL_EN && f.properties.FORMAL_EN !== name) aliases.push(f.properties.FORMAL_EN);
  if (code === 'USA') aliases.push('US', 'America', 'United States', 'United States of America');
  if (code === 'GBR') aliases.push('UK', 'Britain', 'Great Britain', 'United Kingdom');
  if (code === 'RUS') aliases.push('Russian Federation');
  if (code === 'KOR') aliases.push('South Korea', 'Korea');
  if (code === 'PRK') aliases.push('North Korea');
  if (code === 'COD') aliases.push('DR Congo', 'DRC', 'Congo DRC', 'Democratic Republic of the Congo');
  if (code === 'COG') aliases.push('Republic of the Congo', 'Congo Brazzaville');
  if (code === 'ARE') aliases.push('UAE', 'Emirates');
  
  result.push({
    code,
    name,
    aliases,
    capital: meta.cap,
    flag: meta.flag,
    continent,
    lat: stats.lat,
    lng: stats.lng,
    altitude: stats.altitude,
    trivia: meta.t
  });
}

const dataDir = path.dirname(outPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const fileContent = 'import { Country } from "../types/game";\n\nexport const COUNTRIES: Country[] = ' + JSON.stringify(result, null, 2) + ';\n';
fs.writeFileSync(outPath, fileContent, 'utf8');
console.log('Successfully generated', result.length, 'countries at', outPath);
