/**
 * vocabularyData.js
 * Hardcoded vocabulary deck with English, German, and Spanish translations.
 * Each item has an image (Unsplash or locally imported), singular, and plural forms.
 */

import bookImg from '../assets/book.jpg'
import bicycleImg from '../assets/bicycle.jpg'
import eraserImg from '../assets/eraser.jpg'
import keyImg from '../assets/key.jpg'
import pizzaImg from '../assets/pizza.jpg'
import penImg from '../assets/pen.jpg'
import rulerImg from '../assets/ruler.jpg'
import pencilImg from '../assets/pencil.jpg'
import scissorsImg from '../assets/scissors.jpg'

export const vocabularyData = [
  {
    id: 1,
    imageUrl: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=600&auto=format&fit=crop',
    translations: {
      en: { singular: 'Apple',  plural: 'Apples'  },
      de: { singular: 'Apfel',  plural: 'Äpfel'   },
      es: { singular: 'Manzana', plural: 'Manzanas' },
    },
  },
  {
    id: 2,
    imageUrl: bookImg,
    translations: {
      en: { singular: 'Book',   plural: 'Books'   },
      de: { singular: 'das Buch',   plural: 'die Bücher'  },
      es: { singular: 'el libro',  plural: 'los libros'  },
    },
  },
  {
    id: 3,
    imageUrl: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&auto=format&fit=crop',
    translations: {
      en: { singular: 'Car',    plural: 'Cars'    },
      de: { singular: 'Auto',   plural: 'Autos'   },
      es: { singular: 'Coche',  plural: 'Coches'  },
    },
  },
  {
    id: 4,
    imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop',
    translations: {
      en: { singular: 'Cat',    plural: 'Cats'    },
      de: { singular: 'Katze',  plural: 'Katzen'  },
      es: { singular: 'Gato',   plural: 'Gatos'   },
    },
  },
  {
    id: 5,
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop',
    translations: {
      en: { singular: 'Chair',  plural: 'Chairs'  },
      de: { singular: 'Stuhl',  plural: 'Stühle'  },
      es: { singular: 'Silla',  plural: 'Sillas'  },
    },
  },
  {
    id: 6,
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&auto=format&fit=crop',
    translations: {
      en: { singular: 'Mountain', plural: 'Mountains' },
      de: { singular: 'Berg',     plural: 'Berge'     },
      es: { singular: 'Montaña',  plural: 'Montañas'  },
    },
  },
  {
    id: 7,
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop',
    translations: {
      en: { singular: 'Salad',  plural: 'Salads'  },
      de: { singular: 'Salat',  plural: 'Salate'  },
      es: { singular: 'Ensalada', plural: 'Ensaladas' },
    },
  },
  {
    id: 8,
    imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop',
    translations: {
      en: { singular: 'Dog',   plural: 'Dogs'   },
      de: { singular: 'Hund',  plural: 'Hunde'  },
      es: { singular: 'Perro', plural: 'Perros' },
    },
  },
  {
    id: 9,
    imageUrl: pizzaImg,
    translations: {
      en: { singular: 'Pizza',   plural: 'Pizzas'   },
      de: { singular: 'die Pizza',  plural: 'die Pizzas (or Pizzen)' },
      es: { singular: 'la pizza',  plural: 'las pizzas' },
    },
  },
  {
    id: 10,
    imageUrl: bicycleImg,
    translations: {
      en: { singular: 'Bicycle',  plural: 'Bicycles' },
      de: { singular: 'das Fahrrad', plural: 'die Fahrräder' },
      es: { singular: 'la bicicleta', plural: 'las bicicletas' },
    },
  },
  {
    id: 11,
    imageUrl: penImg,
    translations: {
      en: { singular: 'Ballpoint pen', plural: 'Ballpoint pens' },
      de: { singular: 'der Kugelschreiber', plural: 'die Kugelschreiber' },
      es: { singular: 'el bolígrafo', plural: 'los bolígrafos' },
    },
  },
  {
    id: 12,
    imageUrl: rulerImg,
    translations: {
      en: { singular: 'Ruler',   plural: 'Rulers'   },
      de: { singular: 'das Lineal', plural: 'die Lineale'  },
      es: { singular: 'la regla',  plural: 'las reglas'  },
    },
  },
  {
    id: 13,
    imageUrl: eraserImg,
    translations: {
      en: { singular: 'Eraser',  plural: 'Erasers'  },
      de: { singular: 'der Radiergummi', plural: 'die Radiergummis' },
      es: { singular: 'la goma de borrar', plural: 'las gomas de borrar' },
    },
  },
  {
    id: 14,
    imageUrl: pencilImg,
    translations: {
      en: { singular: 'Pencil',  plural: 'Pencils'  },
      de: { singular: 'der Bleistift', plural: 'die Bleistifte' },
      es: { singular: 'el lápiz',  plural: 'los lápices'  },
    },
  },
  {
    id: 15,
    imageUrl: keyImg,
    translations: {
      en: { singular: 'Key',     plural: 'Keys'     },
      de: { singular: 'der Schlüssel', plural: 'die Schlüssel' },
      es: { singular: 'la llave',  plural: 'las llaves'  },
    },
  },
  {
    id: 16,
    imageUrl: scissorsImg,
    translations: {
      en: { singular: 'Scissors', plural: 'Scissors' },
      de: { singular: 'die Schere', plural: 'die Scheren'  },
      es: { singular: 'la tijera', plural: 'las tijeras'  },
    },
  },
]
