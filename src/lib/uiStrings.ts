// Site-chrome UI strings for Base.astro (nav, footer, onboarding modal).
// Nav/footer link labels and copyright phrasing for ar/es/fr are carried over
// from the old Docusaurus i18n/<locale>/docusaurus-theme-classic/{navbar,footer}.json
// (human-reviewed translations) before that source was removed from the repo.
// Onboarding copy has no Docusaurus equivalent (the modal is new to Astro) and
// is translated fresh here.
export type Locale = 'en' | 'ar' | 'es' | 'fr';

export interface UiStrings {
  nav: {learn: string; projects: string; progress: string; playground: string};
  lvlUpText: string;
  footer: {
    courseCol: string;
    siteCol: string;
    moreCol: string;
    python101: string;
    dataAnalysis: string;
    projects: string;
    myProgress: string;
    github: string;
    tagline: string;
    changelog: string;
    copyright: (year: number, version: string) => string;
  };
  onboarding: {
    title: string;
    sub: string;
    steps: [string, string, string];
    cta: string;
    skip: string;
  };
  skipToContent: string;
  themeToggleLabel: string;
  mobileNav: {home: string; learn: string; projects: string; playground: string; progress: string};
}

export const UI_STRINGS: Record<Locale, UiStrings> = {
  en: {
    nav: {learn: 'Learn', projects: 'Projects', progress: 'Progress', playground: 'Playground'},
    lvlUpText: 'LEVEL UP',
    footer: {
      courseCol: 'Course',
      siteCol: 'Site',
      moreCol: 'More',
      python101: 'Python 101',
      dataAnalysis: 'Data Analysis',
      projects: 'Projects',
      myProgress: 'My Progress',
      github: 'GitHub',
      tagline: 'Learn Python and data analysis in your browser. Zero installs, zero boring.',
    changelog: 'Changelog',
      copyright: (year, version) =>
        `Copyright © ${year} Abderrahim Adrabi. Code MIT-licensed, content CC-BY 4.0. v${version}`,
    },
    onboarding: {
      title: 'Welcome to PyDA Course',
      sub: 'Learn Python, earn XP, build streaks. Zero boring.',
      steps: ['Run code cells & earn ⚡ XP', 'Build streaks 🔥 for bonus XP', 'Complete quests & unlock badges'],
      cta: "Let's go!",
      skip: 'Skip',
    },
    skipToContent: 'Skip to content',
    themeToggleLabel: 'Toggle theme',
    mobileNav: {home: 'Home', learn: 'Learn', projects: 'Projects', playground: 'Playground', progress: 'Progress'},
  },
  ar: {
    nav: {learn: 'تعلّم', projects: 'المشاريع', progress: 'تقدمي', playground: 'ساحة التجربة'},
    lvlUpText: 'ارتقِ',
    footer: {
      courseCol: 'الدورة',
      siteCol: 'الموقع',
      moreCol: 'المزيد',
      python101: 'بايثون 101',
      dataAnalysis: 'تحليل البيانات',
      projects: 'المشاريع',
      myProgress: 'تقدمي',
      github: 'GitHub',
      tagline: 'تعلّم بايثون وتحليل البيانات في متصفّحك. بلا تثبيت، وبلا ملل.',
    changelog: 'Changelog',
      copyright: (year, version) =>
        `حقوق النشر © ${year} Abderrahim Adrabi. الكود مرخّص بموجب MIT، والمحتوى بموجب CC-BY 4.0. v${version}`,
    },
    onboarding: {
      title: 'أهلًا بك في PyDA Course',
      sub: 'تعلّم بايثون، اكسب نقاط خبرة، وابنِ سلسلة تقدّم يومية. بلا ملل.',
      steps: ['شغّل خلايا الكود واكسب ⚡ نقاط خبرة', 'ابنِ سلسلة تقدّم 🔥 لنقاط إضافية', 'أكمل المهام وافتح الأوسمة'],
      cta: 'لنبدأ ←',
      skip: 'تخطّي',
    },
    skipToContent: 'تخطَّ إلى المحتوى',
    themeToggleLabel: 'تبديل المظهر',
    mobileNav: {home: 'الرئيسية', learn: 'تعلّم', projects: 'المشاريع', playground: 'التجربة', progress: 'تقدمي'},
  },
  es: {
    nav: {learn: 'Aprender', projects: 'Proyectos', progress: 'Progreso', playground: 'Playground'},
    lvlUpText: '¡SUBE DE NIVEL!',
    footer: {
      courseCol: 'Curso',
      siteCol: 'Sitio',
      moreCol: 'Más',
      python101: 'Python 101',
      dataAnalysis: 'Análisis de Datos',
      projects: 'Proyectos',
      myProgress: 'Mi Progreso',
      github: 'GitHub',
      tagline: 'Aprende Python y análisis de datos en tu navegador. Cero instalaciones, cero aburrimiento.',
    changelog: 'Changelog',
      copyright: (year, version) =>
        `Copyright © ${year} Abderrahim Adrabi. Código con licencia MIT, contenido con licencia CC-BY 4.0. v${version}`,
    },
    onboarding: {
      title: 'Bienvenido a PyDA Course',
      sub: 'Aprende Python, gana XP, construye rachas. Cero aburrimiento.',
      steps: ['Ejecuta celdas de código y gana ⚡ XP', 'Construye rachas 🔥 para XP extra', 'Completa misiones y desbloquea insignias'],
      cta: '¡Vamos!',
      skip: 'Omitir',
    },
    skipToContent: 'Saltar al contenido',
    themeToggleLabel: 'Cambiar tema',
    mobileNav: {home: 'Inicio', learn: 'Aprender', projects: 'Proyectos', playground: 'Playground', progress: 'Progreso'},
  },
  fr: {
    nav: {learn: 'Apprendre', projects: 'Projets', progress: 'Progression', playground: 'Bac à sable'},
    lvlUpText: 'NIVEAU SUPÉRIEUR',
    footer: {
      courseCol: 'Cours',
      siteCol: 'Site',
      moreCol: 'Plus',
      python101: 'Python 101',
      dataAnalysis: 'Analyse de Données',
      projects: 'Projets',
      myProgress: 'Ma Progression',
      github: 'GitHub',
      tagline: 'Apprends Python et l’analyse de données dans ton navigateur. Zéro installation, zéro ennui.',
    changelog: 'Changelog',
      copyright: (year, version) =>
        `Copyright © ${year} Abderrahim Adrabi. Code sous licence MIT, contenu sous licence CC-BY 4.0. v${version}`,
    },
    onboarding: {
      title: 'Bienvenue sur PyDA Course',
      sub: 'Apprends Python, gagne des XP, construis des séries. Zéro ennui.',
      steps: ['Exécute des cellules de code et gagne ⚡ des XP', 'Construis des séries 🔥 pour des XP bonus', 'Termine des quêtes et débloque des badges'],
      cta: 'Allons-y !',
      skip: 'Passer',
    },
    skipToContent: 'Aller au contenu',
    themeToggleLabel: 'Changer de thème',
    mobileNav: {home: 'Accueil', learn: 'Apprendre', projects: 'Projets', playground: 'Bac à sable', progress: 'Progression'},
  },
};

export function resolveLocale(lang: string): Locale {
  return lang === 'ar' || lang === 'es' || lang === 'fr' ? lang : 'en';
}
