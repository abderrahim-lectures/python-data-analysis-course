// Localized <title>/description for the handful of pages whose copy is
// hardcoded in the route file rather than pulled from translated content
// frontmatter (learn hub, projects index — section/week/project-detail
// pages already read title/description from the locale content collection).
import type {Locale} from './routeSegments';

export const PAGE_STRINGS: Record<Locale, {
  learnHubTitle: string;
  learnHubDescription: string;
  learnHubEyebrow: string;
  learnHubH1: string;
  learnHubLead: string;
  chooseRoute: string;
  normalStart: string;
  hardStart: string;
  seeAllWeeks: string;
  track1: string;
  track2: string;
  projectsTitle: string;
  projectsDescription: string;
  projectsEyebrow: string;
  projectsH1: string;
  projectsLead: string;
  optionalUngraded: string;
  track1Name: string;
  track1Desc: string;
  track2Name: string;
  track2Desc: string;
  markComplete: string;
  completed: string;
}> = {
  en: {
    learnHubTitle: 'Learn — PyDA Course',
    learnHubDescription: 'Two tracks, two routes: Python 101 and Data Analysis. Pick your path and start earning XP.',
    learnHubEyebrow: 'Your learning trail',
    learnHubH1: 'Two tracks. Two routes. Pick your path.',
    learnHubLead: 'Each lesson earns XP. Streaks multiply it. Badges mark your climb.',
    chooseRoute: 'Choose your route:',
    normalStart: 'Normal — start here',
    hardStart: 'Hard — start here',
    seeAllWeeks: 'See all 5 weeks →',
    track1: 'Track 1',
    track2: 'Track 2',
    projectsTitle: 'Real-World Projects — PyDA Course',
    projectsDescription: 'Optional, ungraded projects that take you from the in-browser playground to real Python.',
    projectsEyebrow: 'Beyond the course',
    projectsH1: 'Real-World Projects',
    projectsLead: 'Optional, ungraded builds that graduate you from the browser playground to real Python.',
    optionalUngraded: '🎯 Optional · ungraded',
    track1Name: 'Python 101',
    track1Desc: 'Weeks 1–5. The fundamentals: variables, types, control flow, functions — then a tiny language model.',
    track2Name: 'Pandas & Data',
    track2Desc: 'Weeks 6–10. Ship a real notebook: pandas the way a data analyst actually uses it.',
    markComplete: 'Mark complete ✓',
    completed: 'Completed ✓',
  },
  ar: {
    learnHubTitle: 'تعلّم — PyDA Course',
    learnHubDescription: 'مساران، طريقان: بايثون 101 وتحليل البيانات. اختر طريقك وابدأ بكسب نقاط الخبرة.',
    learnHubEyebrow: 'مسار تعلّمك',
    learnHubH1: 'مساران. طريقان. اختر طريقك.',
    learnHubLead: 'كل درس يمنحك نقاط خبرة. السلاسل تضاعفها. الأوسمة تُظهر تقدّمك.',
    chooseRoute: 'اختر طريقك:',
    normalStart: 'عادي — ابدأ هنا',
    hardStart: 'صعب — ابدأ هنا',
    seeAllWeeks: 'عرض كل الأسابيع الخمسة ←',
    track1: 'المسار 1',
    track2: 'المسار 2',
    projectsTitle: 'مشاريع واقعية — PyDA Course',
    projectsDescription: 'مشاريع اختيارية غير مقيَّمة تنقلك من ملعب المتصفح إلى بايثون حقيقية.',
    projectsEyebrow: 'ما بعد الدورة',
    projectsH1: 'مشاريع واقعية',
    projectsLead: 'مشاريع اختيارية غير مقيَّمة تُخرّجك من ملعب المتصفح إلى بايثون حقيقية.',
    optionalUngraded: '🎯 اختياري · غير مقيَّم',
    track1Name: 'بايثون 101',
    track1Desc: 'الأسابيع 1–5. الأساسيات: المتغيّرات، الأنواع، التحكّم بالتدفّق، الدوال — ثم نموذج لغوي مصغّر.',
    track2Name: 'Pandas والبيانات',
    track2Desc: 'الأسابيع 6–10. أنجز دفتر عمل حقيقي: pandas كما يستخدمها محلّل البيانات فعليًا.',
    markComplete: 'تحديد كمكتمل ✓',
    completed: 'مكتمل ✓',
  },
  es: {
    learnHubTitle: 'Aprender — PyDA Course',
    learnHubDescription: 'Dos pistas, dos rutas: Python 101 y Análisis de Datos. Elige tu camino y empieza a ganar XP.',
    learnHubEyebrow: 'Tu ruta de aprendizaje',
    learnHubH1: 'Dos pistas. Dos rutas. Elige tu camino.',
    learnHubLead: 'Cada lección gana XP. Las rachas lo multiplican. Las insignias marcan tu progreso.',
    chooseRoute: 'Elige tu ruta:',
    normalStart: 'Normal — empieza aquí',
    hardStart: 'Difícil — empieza aquí',
    seeAllWeeks: 'Ver las 5 semanas →',
    track1: 'Pista 1',
    track2: 'Pista 2',
    projectsTitle: 'Proyectos del Mundo Real — PyDA Course',
    projectsDescription: 'Proyectos opcionales, sin calificar, que te llevan del playground del navegador a Python real.',
    projectsEyebrow: 'Más allá del curso',
    projectsH1: 'Proyectos del Mundo Real',
    projectsLead: 'Builds opcionales, sin calificar, que te gradúan del playground del navegador a Python real.',
    optionalUngraded: '🎯 Opcional · sin calificar',
    track1Name: 'Python 101',
    track1Desc: 'Semanas 1–5. Los fundamentos: variables, tipos, control de flujo, funciones — y luego un pequeño modelo de lenguaje.',
    track2Name: 'Pandas y Datos',
    track2Desc: 'Semanas 6–10. Publica un notebook real: pandas tal como lo usa de verdad un analista de datos.',
    markComplete: 'Marcar como completado ✓',
    completed: 'Completado ✓',
  },
  fr: {
    learnHubTitle: 'Apprendre — PyDA Course',
    learnHubDescription: 'Deux parcours, deux routes : Python 101 et Analyse de Données. Choisis ta voie et gagne des XP.',
    learnHubEyebrow: 'Ton parcours',
    learnHubH1: 'Deux parcours. Deux routes. Choisis ta voie.',
    learnHubLead: 'Chaque leçon rapporte des XP. Les séries les multiplient. Les badges marquent ta progression.',
    chooseRoute: 'Choisis ta route :',
    normalStart: 'Normal — commencer ici',
    hardStart: 'Difficile — commencer ici',
    seeAllWeeks: 'Voir les 5 semaines →',
    track1: 'Parcours 1',
    track2: 'Parcours 2',
    projectsTitle: 'Projets Concrets — PyDA Course',
    projectsDescription: 'Projets optionnels, non notés, qui te font passer du bac à sable du navigateur à du vrai Python.',
    projectsEyebrow: 'Au-delà du cours',
    projectsH1: 'Projets Concrets',
    projectsLead: 'Des builds optionnels, non notés, qui te font passer du bac à sable du navigateur à du vrai Python.',
    optionalUngraded: '🎯 Optionnel · non noté',
    track1Name: 'Python 101',
    track1Desc: 'Semaines 1–5. Les fondamentaux : variables, types, structures de contrôle, fonctions — puis un mini modèle de langage.',
    track2Name: 'Pandas & Données',
    track2Desc: 'Semaines 6–10. Réalisez un vrai notebook : pandas tel qu’un analyste de données l’utilise vraiment.',
    markComplete: 'Marquer comme terminé ✓',
    completed: 'Terminé ✓',
  },
};
