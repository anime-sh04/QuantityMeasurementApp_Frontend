export const UNITS: Record<string, string[]> = {
  length:      ['Feet', 'Inches', 'Yards', 'Centimeters'],
  weight:      ['Kilogram', 'Gram', 'Pound'],
  volume:      ['Litre', 'Millilitre', 'Gallon'],
  temperature: ['Celsius', 'Fahrenheit', 'Kelvin']
};

export const OP_TITLES: Record<string, string> = {
  convert:  'Convert a quantity',
  compare:  'Compare two quantities',
  add:      'Add two quantities',
  subtract: 'Subtract quantities',
  divide:   'Calculate a ratio'
};

export const MEASUREMENT_TYPES = ['length', 'weight', 'volume', 'temperature'];
export const OPERATIONS = ['convert', 'compare', 'add', 'subtract', 'divide'];
