// Copy for the credits page, ported from the Docusaurus-era src/pages/credits.tsx
// that was dropped in the Astro migration (8 lesson pages still linked to it).
// The dataset wording is deliberately precise: these are small *synthetic*
// datasets modelled on the Kaggle schemas, not the Kaggle data itself.
import type {Locale} from './routeSegments';

export interface CreditEntry {
  href: string;
  name: string;
  note: string;
}

export interface CreditsCopy {
  title: string;
  description: string;
  heading: string;
  intro: string;
  entries: CreditEntry[];
}

const TITANIC = 'https://www.kaggle.com/c/titanic';
const STUDENTS = 'https://www.kaggle.com/datasets/spscientist/students-performance-in-exams';

export const CREDITS: Record<Locale, CreditsCopy> = {
  en: {
    title: 'Credits — PyDA Course',
    description: 'Datasets and tools used in this course.',
    heading: 'Credits',
    intro: 'Datasets and third-party tools this course relies on:',
    entries: [
      {href: 'https://pyodide.org', name: 'Pyodide',
       note: 'The WebAssembly Python runtime that runs every code cell in this course, right in your browser.'},
      {href: TITANIC, name: 'Titanic dataset',
       note: "Week 10's guided EDA uses a small synthetic dataset modelled on this well-known Kaggle dataset's schema — the same columns with generated passenger rows — bundled locally so it works offline."},
      {href: STUDENTS, name: 'Students Performance in Exams',
       note: "The Week 10 Hard-track final EDA uses a small synthetic dataset modelled on this Kaggle dataset's schema, bundled locally so it works offline."},
    ],
  },
  ar: {
    title: 'المصادر — PyDA Course',
    description: 'مجموعات البيانات والأدوات المستخدمة في هذه الدورة.',
    heading: 'المصادر',
    intro: 'مجموعات البيانات والأدوات الخارجية التي تعتمد عليها هذه الدورة:',
    entries: [
      {href: 'https://pyodide.org', name: 'Pyodide',
       note: 'بيئة تشغيل بايثون بتقنية WebAssembly، وهي ما يشغّل كل خانة كود في هذه الدورة داخل متصفّحك مباشرةً.'},
      {href: TITANIC, name: 'مجموعة بيانات تايتانيك',
       note: 'يستخدم التحليل الاستكشافي الموجَّه في الأسبوع 10 مجموعة بيانات اصطناعية صغيرة مبنية على بنية مجموعة بيانات Kaggle الشهيرة — الأعمدة نفسها مع صفوف ركّاب مولّدة — ومضمّنة محليًا لتعمل دون اتصال.'},
      {href: STUDENTS, name: 'أداء الطلاب في الامتحانات',
       note: 'يستخدم التحليل الاستكشافي النهائي في المسار الصعب للأسبوع 10 مجموعة بيانات اصطناعية صغيرة مبنية على بنية مجموعة بيانات Kaggle هذه، ومضمّنة محليًا لتعمل دون اتصال.'},
    ],
  },
  es: {
    title: 'Créditos — PyDA Course',
    description: 'Conjuntos de datos y herramientas utilizados en este curso.',
    heading: 'Créditos',
    intro: 'Conjuntos de datos y herramientas de terceros en los que se apoya este curso:',
    entries: [
      {href: 'https://pyodide.org', name: 'Pyodide',
       note: 'El entorno de ejecución de Python en WebAssembly que ejecuta cada celda de código de este curso, directamente en tu navegador.'},
      {href: TITANIC, name: 'Conjunto de datos del Titanic',
       note: 'El AED guiado de la semana 10 usa un pequeño conjunto de datos sintético modelado sobre el esquema de este conocido conjunto de Kaggle —las mismas columnas con filas de pasajeros generadas— incluido localmente para que funcione sin conexión.'},
      {href: STUDENTS, name: 'Students Performance in Exams',
       note: 'El AED final del track Difícil de la semana 10 usa un pequeño conjunto de datos sintético modelado sobre el esquema de este conjunto de Kaggle, incluido localmente para que funcione sin conexión.'},
    ],
  },
  fr: {
    title: 'Crédits — PyDA Course',
    description: 'Jeux de données et outils utilisés dans ce cours.',
    heading: 'Crédits',
    intro: 'Jeux de données et outils tiers sur lesquels ce cours s’appuie :',
    entries: [
      {href: 'https://pyodide.org', name: 'Pyodide',
       note: 'L’environnement d’exécution Python en WebAssembly qui exécute chaque cellule de code de ce cours, directement dans votre navigateur.'},
      {href: TITANIC, name: 'Jeu de données Titanic',
       note: 'L’AED guidée de la semaine 10 utilise un petit jeu de données synthétique calqué sur le schéma de ce célèbre jeu de données Kaggle — mêmes colonnes, lignes de passagers générées — fourni localement pour fonctionner hors ligne.'},
      {href: STUDENTS, name: 'Students Performance in Exams',
       note: 'L’AED finale du parcours Difficile de la semaine 10 utilise un petit jeu de données synthétique calqué sur le schéma de ce jeu de données Kaggle, fourni localement pour fonctionner hors ligne.'},
    ],
  },
};
