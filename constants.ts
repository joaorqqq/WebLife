
export const COUNTRIES = [
  { 
    name: 'Brasil', 
    states: ['São Paulo', 'Rio de Janeiro', 'Minas Gerais', 'Rio Grande do Sul', 'Bahia', 'Santa Catarina', 'Paraná', 'Pernambuco'] 
  },
  { 
    name: 'USA', 
    states: ['California', 'Texas', 'New York', 'Florida', 'Illinois', 'Washington', 'Nevada'] 
  },
  { 
    name: 'Portugal', 
    states: ['Lisboa', 'Porto', 'Setúbal', 'Braga', 'Algarve', 'Madeira'] 
  },
  { 
    name: 'Japão', 
    states: ['Tokyo', 'Osaka', 'Kyoto', 'Hokkaido', 'Fukuoka'] 
  },
  {
    name: 'Reino Unido',
    states: ['England', 'Scotland', 'Wales', 'Northern Ireland']
  },
  {
    name: 'França',
    states: ['Île-de-France', 'Provence-Alpes-Côte d\'Azur', 'Nouvelle-Aquitaine']
  },
  {
    name: 'Alemanha',
    states: ['Bavaria', 'Berlin', 'Hamburg', 'Hesse']
  },
  {
    name: 'Canadá',
    states: ['Ontario', 'Quebec', 'British Columbia', 'Alberta']
  }
];

export const CITIES_DATA: Record<string, string[]> = {
  // Brasil
  'São Paulo': ['São Paulo City', 'Campinas', 'Santos', 'Ribeirão Preto', 'Sorocaba'],
  'Rio de Janeiro': ['Rio de Janeiro City', 'Niterói', 'Búzios', 'Petrópolis', 'Angra dos Reis'],
  'Minas Gerais': ['Belo Horizonte', 'Uberlândia', 'Ouro Preto', 'Contagem'],
  'Rio Grande do Sul': ['Porto Alegre', 'Gramado', 'Caxias do Sul', 'Pelotas'],
  'Bahia': ['Salvador', 'Porto Seguro', 'Feira de Santana', 'Ilhéus'],
  'Santa Catarina': ['Florianópolis', 'Blumenau', 'Joinville', 'Balneário Camboriú'],
  'Paraná': ['Curitiba', 'Londrina', 'Maringá', 'Foz do Iguaçu'],
  'Pernambuco': ['Recife', 'Olinda', 'Caruaru', 'Porto de Galinhas'],

  // USA
  'California': ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'San Jose'],
  'Texas': ['Houston', 'Austin', 'Dallas', 'San Antonio', 'El Paso'],
  'New York': ['New York City', 'Buffalo', 'Albany', 'Rochester', 'Syracuse'],
  'Florida': ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Tallahassee'],
  'Illinois': ['Chicago', 'Springfield', 'Naperville', 'Aurora'],
  'Washington': ['Seattle', 'Spokane', 'Tacoma', 'Bellevue'],
  'Nevada': ['Las Vegas', 'Reno', 'Carson City', 'Henderson'],

  // Portugal
  'Lisboa': ['Lisboa City', 'Sintra', 'Cascais', 'Loures', 'Amadora'],
  'Porto': ['Porto City', 'Gaia', 'Matosinhos', 'Maia', 'Gondomar'],
  'Setúbal': ['Setúbal City', 'Almada', 'Barreiro', 'Palmela'],
  'Braga': ['Braga City', 'Guimarães', 'Barcelos', 'Famalicão'],
  'Algarve': ['Faro', 'Lagos', 'Albufeira', 'Portimão', 'Loulé'],
  'Madeira': ['Funchal', 'Câmara de Lobos', 'Machico', 'Santa Cruz'],

  // Japão
  'Tokyo': ['Shinjuku', 'Shibuya', 'Minato', 'Chiyoda', 'Setagaya'],
  'Osaka': ['Umeda', 'Namba', 'Tennoji', 'Yodogawa'],
  'Kyoto': ['Gion', 'Arashiyama', 'Fushimi', 'Shimogyo'],
  'Hokkaido': ['Sapporo', 'Hakodate', 'Asahikawa'],
  'Fukuoka': ['Fukuoka City', 'Kitakyushu', 'Kurume'],

  // UK
  'England': ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Bristol'],
  'Scotland': ['Edinburgh', 'Glasgow', 'Aberdeen', 'Dundee'],
  'Wales': ['Cardiff', 'Swansea', 'Newport'],
  'Northern Ireland': ['Belfast', 'Derry', 'Lisburn'],

  // França
  'Île-de-France': ['Paris', 'Boulogne-Billancourt', 'Saint-Denis'],
  'Provence-Alpes-Côte d\'Azur': ['Marseille', 'Nice', 'Toulon', 'Aix-en-Provence'],
  'Nouvelle-Aquitaine': ['Bordeaux', 'Limoges', 'Poitiers'],

  // Alemanha
  'Bavaria': ['Munich', 'Nuremberg', 'Augsburg', 'Regensburg'],
  'Berlin': ['Berlin City', 'Spandau', 'Pankow'],
  'Hamburg': ['Hamburg City', 'Altona', 'Bergedorf'],
  'Hesse': ['Frankfurt', 'Wiesbaden', 'Kassel'],

  // Canadá
  'Ontario': ['Toronto', 'Ottawa', 'Mississauga', 'Hamilton'],
  'Quebec': ['Montreal', 'Quebec City', 'Laval', 'Gatineau'],
  'British Columbia': ['Vancouver', 'Victoria', 'Surrey', 'Burnaby'],
  'Alberta': ['Calgary', 'Edmonton', 'Red Deer']
};

export const CHAOS_CHANCE = 0.03;
export const DODO_CHANCE = 0.10;
export const HUNT_DODO_BONUS = 0.15;
