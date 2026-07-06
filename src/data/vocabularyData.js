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
import kettleImg from '../assets/kettle.jpg'
import tigerImg from '../assets/tiger.jpg'
import bottleOpenerImg from '../assets/bottle_opener.jpg'
import umbrellaImg from '../assets/umbrella.jpg'
import tableImg from '../assets/table.jpg'
import broomImg from '../assets/broom.jpg'
import hairdryerImg from '../assets/hairdryer.jpg'
import boxImg from '../assets/box.jpg'
import refrigeratorImg from '../assets/refrigerator.jpg'
import chairImg from '../assets/chair.jpg'
import bicycleHelmetImg from '../assets/bicycle_helmet.jpg'
import cabinetImg from '../assets/cabinet.jpg'
import glueImg from '../assets/glue.jpg'
import mushroomImg from '../assets/mushroom.jpg'
import treeImg from '../assets/tree.jpg'
import floorImg from '../assets/floor.jpg'
import receiptImg from '../assets/receipt.jpg'
import clothesHangerImg from '../assets/clothes_hanger.jpg'
import spongeImg from '../assets/sponge.jpg'
import cookieImg from '../assets/cookie.jpg'
import mopImg from '../assets/mop.jpg'
import carpetImg from '../assets/carpet.jpg'
import faucetImg from '../assets/faucet.jpg'
import sinkImg from '../assets/sink.jpg'
import mirrorImg from '../assets/mirror.jpg'
import lightSwitchImg from '../assets/light_switch.jpg'

export const vocabularyData = [
  {
    id: 1,
    imageUrl: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=600&auto=format&fit=crop',
    translations: {
      en: { singular: 'Apple',  plural: 'Apples'  },
      de: { singular: 'der Apfel',  plural: 'die Äpfel'   },
      es: { singular: 'la manzana', plural: 'las manzanas' },
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
      de: { singular: 'das Auto',   plural: 'die Autos'   },
      es: { singular: 'el coche',  plural: 'los coches'  },
    },
  },
  {
    id: 4,
    imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop',
    translations: {
      en: { singular: 'Cat',    plural: 'Cats'    },
      de: { singular: 'die Katze',  plural: 'die Katzen'  },
      es: { singular: 'el gato',   plural: 'los gatos'   },
    },
  },
  {
    id: 5,
    imageUrl: chairImg,
    translations: {
      en: { singular: 'Chair',  plural: 'Chairs'  },
      de: { singular: 'der Stuhl',  plural: 'die Stühle'  },
      es: { singular: 'la silla',  plural: 'las sillas'  },
    },
  },
  {
    id: 6,
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&auto=format&fit=crop',
    translations: {
      en: { singular: 'Mountain', plural: 'Mountains' },
      de: { singular: 'der Berg',     plural: 'die Berge'     },
      es: { singular: 'la montaña',  plural: 'las montañas'  },
    },
  },
  {
    id: 7,
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop',
    translations: {
      en: { singular: 'Salad',  plural: 'Salads'  },
      de: { singular: 'der Salat',  plural: 'die Salate'  },
      es: { singular: 'la ensalada', plural: 'las ensaladas' },
    },
  },
  {
    id: 8,
    imageUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&auto=format&fit=crop',
    translations: {
      en: { singular: 'Dog',   plural: 'Dogs'   },
      de: { singular: 'der Hund',  plural: 'die Hunde'  },
      es: { singular: 'el perro', plural: 'los perros' },
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
  {
    id: 17,
    imageUrl: refrigeratorImg,
    translations: {
      en: { singular: 'Refrigerator (Fridge)', plural: 'Refrigerators' },
      de: { singular: 'der Kühlschrank', plural: 'die Kühlschränke' },
      es: { singular: 'el refrigerador (or la nevera)', plural: 'los refrigeradores' },
    },
  },
  {
    id: 18,
    imageUrl: bottleOpenerImg,
    translations: {
      en: { singular: 'Bottle opener', plural: 'Bottle openers' },
      de: { singular: 'der Flaschenöffner', plural: 'die Flaschenöffner' },
      es: { singular: 'el abridor de botellas', plural: 'los abridores de botellas' },
    },
  },
  {
    id: 19,
    imageUrl: broomImg,
    translations: {
      en: { singular: 'Broom', plural: 'Brooms' },
      de: { singular: 'der Besen', plural: 'die Besen' },
      es: { singular: 'la escoba', plural: 'las escobas' },
    },
  },
  {
    id: 20,
    imageUrl: hairdryerImg,
    translations: {
      en: { singular: 'Hairdryer', plural: 'Hairdryers' },
      de: { singular: 'der Föhn', plural: 'die Föhne' },
      es: { singular: 'el secador de pelo', plural: 'los secadores de pelo' },
    },
  },
  {
    id: 21,
    imageUrl: kettleImg,
    translations: {
      en: { singular: 'Kettle', plural: 'Kettles' },
      de: { singular: 'der Wasserkocher', plural: 'die Wasserkocher' },
      es: { singular: 'el hervidor de agua', plural: 'los hervidores de agua' },
    },
  },
  {
    id: 22,
    imageUrl: tigerImg,
    translations: {
      en: { singular: 'Tiger', plural: 'Tigers' },
      de: { singular: 'der Tiger', plural: 'die Tiger' },
      es: { singular: 'el tigre', plural: 'los tigres' },
    },
  },
  {
    id: 23,
    imageUrl: bicycleHelmetImg,
    translations: {
      en: { singular: 'Bicycle helmet', plural: 'Bicycle helmets' },
      de: { singular: 'der Fahrradhelm', plural: 'die Fahrradhelme' },
      es: { singular: 'el casco de bicicleta', plural: 'los cascos de bicicleta' },
    },
  },
  {
    id: 24,
    imageUrl: umbrellaImg,
    translations: {
      en: { singular: 'Umbrella', plural: 'Umbrellas' },
      de: { singular: 'der Regenschirm', plural: 'die Regenschirme' },
      es: { singular: 'el paraguas', plural: 'los paraguas' },
    },
  },
  {
    id: 25,
    imageUrl: boxImg,
    translations: {
      en: { singular: 'Box (Crate)', plural: 'Boxes' },
      de: { singular: 'die Kiste', plural: 'die Kisten' },
      es: { singular: 'la caja (or la caja de madera)', plural: 'las cajas' },
    },
  },
  {
    id: 26,
    imageUrl: tableImg,
    translations: {
      en: { singular: 'Table', plural: 'Tables' },
      de: { singular: 'der Tisch', plural: 'die Tische' },
      es: { singular: 'la mesa', plural: 'las mesas' },
    },
  },
  {
    id: 27,
    imageUrl: cabinetImg,
    translations: {
      en: { singular: 'Cabinet (Cupboard)', plural: 'Cabinets' },
      de: { singular: 'der Schrank', plural: 'die Schränke' },
      es: { singular: 'el armario', plural: 'los armarios' },
    },
  },
  {
    id: 28,
    imageUrl: glueImg,
    translations: {
      en: { singular: 'Glue (or Glue stick)', plural: 'Glues' },
      de: { singular: 'der Kleber', plural: 'die Kleber' },
      es: { singular: 'el pegamento', plural: 'los pegamentos' },
    },
  },
  {
    id: 29,
    imageUrl: mushroomImg,
    translations: {
      en: { singular: 'Mushroom', plural: 'Mushrooms' },
      de: { singular: 'der Pilz', plural: 'die Pilze' },
      es: { singular: 'el hongo (or la seta)', plural: 'los hongos' },
    },
  },
  {
    id: 30,
    imageUrl: treeImg,
    translations: {
      en: { singular: 'Tree', plural: 'Trees' },
      de: { singular: 'der Baum', plural: 'die Bäume' },
      es: { singular: 'el árbol', plural: 'los árboles' },
    },
  },
  {
    id: 31,
    imageUrl: floorImg,
    translations: {
      en: { singular: 'Floor (or Ground)', plural: 'Floors' },
      de: { singular: 'der Boden', plural: 'die Böden' },
      es: { singular: 'el suelo (or el piso)', plural: 'los suelos' },
    },
  },
  {
    id: 32,
    imageUrl: faucetImg,
    translations: {
      en: { singular: 'Faucet (or Tap)', plural: 'Faucets' },
      de: { singular: 'der Wasserhahn', plural: 'die Wasserhähne' },
      es: { singular: 'el grifo', plural: 'los grifos' },
    },
  },
  {
    id: 33,
    imageUrl: receiptImg,
    translations: {
      en: { singular: 'Receipt', plural: 'Receipts' },
      de: { singular: 'der Beleg', plural: 'die Belege' },
      es: { singular: 'el recibo (or el comprobante)', plural: 'los recibos' },
    },
  },
  {
    id: 34,
    imageUrl: cookieImg,
    translations: {
      en: { singular: 'Cookie (or Biscuit)', plural: 'Cookies' },
      de: { singular: 'der Keks', plural: 'die Kekse' },
      es: { singular: 'la galleta', plural: 'las galletas' },
    },
  },
  {
    id: 35,
    imageUrl: lightSwitchImg,
    translations: {
      en: { singular: 'Light switch', plural: 'Light switches' },
      de: { singular: 'der Lichtschalter', plural: 'die Lichtschalter' },
      es: { singular: 'el interruptor de luz', plural: 'los interruptores de luz' },
    },
  },
  {
    id: 36,
    imageUrl: mopImg,
    translations: {
      en: { singular: 'Mop', plural: 'Mops' },
      de: { singular: 'der Bodenwischer', plural: 'die Bodenwischer' },
      es: { singular: 'la fregona (or el trapeador)', plural: 'las fregonas' },
    },
  },
  {
    id: 37,
    imageUrl: sinkImg,
    translations: {
      en: { singular: 'Sink', plural: 'Sinks' },
      de: { singular: 'das Waschbecken', plural: 'die Waschbecken' },
      es: { singular: 'el lavabo (or el fregadero)', plural: 'los lavabos' },
    },
  },
  {
    id: 38,
    imageUrl: spongeImg,
    translations: {
      en: { singular: 'Sponge', plural: 'Sponges' },
      de: { singular: 'der Schwamm', plural: 'die Schwämme' },
      es: { singular: 'la esponja', plural: 'las esponjas' },
    },
  },
  {
    id: 39,
    imageUrl: clothesHangerImg,
    translations: {
      en: { singular: 'Clothes hanger', plural: 'Clothes hangers' },
      de: { singular: 'der Kleiderbügel', plural: 'die Kleiderbügel' },
      es: { singular: 'la percha (or el gancho de ropa)', plural: 'las perchas' },
    },
  },
  {
    id: 40,
    imageUrl: carpetImg,
    translations: {
      en: { singular: 'Carpet (or Rug)', plural: 'Carpets' },
      de: { singular: 'der Teppich', plural: 'die Teppiche' },
      es: { singular: 'la alfombra', plural: 'las alfombras' },
    },
  },
  {
    id: 41,
    imageUrl: mirrorImg,
    translations: {
      en: { singular: 'Mirror', plural: 'Mirrors' },
      de: { singular: 'der Spiegel', plural: 'die Spiegel' },
      es: { singular: 'el espejo', plural: 'los espejos' },
    },
  },
]
