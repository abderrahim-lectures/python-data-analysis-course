// Localized <title>/description for the handful of pages whose copy is
// hardcoded in the route file rather than pulled from translated content
// frontmatter (learn hub, projects index — section/week/project-detail
// pages already read title/description from the locale content collection).
import type {Locale} from './routeSegments';

export const PAGE_STRINGS: Record<Locale, {
  homeTitle: string;
  homeDescription: string;
  homeEyebrow: string;
  homeH1: string;
  homeLead: string;
  homeStartQuest: string;
  homeSeeRank: string;
  homeQuestLabel: string;
  homeProfileLabel: string;
  homeTerminalBracket: string;
  homeTerminalLine1: string;
  homeTerminalLine2: string;
  homeTerminalLine3: string;
  homeTerminalLine4: string;
  homeTerminalLine5: string;
  homeTerminalLine6: string;
  homeStatXP: string;
  homeStatStreak: string;
  homeStatBadges: string;
  homeStatLevel: string;
  homeXpToNext: string;
  homeXpAriaLabel: string;
  homeRewardsTitle: string;
  homeRewardsSub: string;
  homeReward1Title: string;
  homeReward1Desc: string;
  homeReward2Title: string;
  homeReward2Desc: string;
  homeReward3Title: string;
  homeReward3Desc: string;
  homeReward4Title: string;
  homeReward4Desc: string;
  homeHubTrack1: string;
  homeHubTrack1Meta: string;
  homeHubTrack1Name: string;
  homeHubTrack1Desc: string;
  homeHubTrack1CTA: string;
  homeHubTrack2: string;
  homeHubTrack2Meta: string;
  homeHubTrack2Name: string;
  homeHubTrack2Desc: string;
  homeHubTrack2CTA: string;
  homeHubProjects: string;
  homeHubProjectsMeta: string;
  homeHubProjectsName: string;
  homeHubProjectsDesc: string;
  homeHubProjectsCTA: string;
  homeHeroCta: string;
  homeInstall: string;
  homeHeroFeature1: string;
  homeHeroFeature2: string;
  homeHeroFeature3: string;
  homeRewardsGradient: string;
  pathLearn: string;
  pathProgress: string;
  pathPlayground: string;
  pathProjects: string;
  learnHubTitle: string;
  learnHubDescription: string;
  learnHubEyebrow: string;
  learnHubH1: string;
  learnHubLead: string;
  chooseRoute: string;
  normalStart: string;
  hardStart: string;
  seeAllModules: string;
  track1: string;
  track2: string;
  projectsTitle: string;
  projectsDescription: string;
  projectsEyebrow: string;
  projectsH1: string;
  projectsLead: string;
  track1Name: string;
  track1Desc: string;
  track2Name: string;
  track2Desc: string;
  markComplete: string;
  completed: string;
  weekLabel: string;
  moduleLabel: string;
  moduleLessonsLabel: string;
  lessonLabel: string;
  projectMarkDone: string;
  projectDoneHint: string;
  projectCompleted: string;
  prevLesson: string;
  nextLesson: string;
  objectives: string;
  trackNormalLabel: string;
  trackHardLabel: string;
  switchTo: string;
  sameWeekCalm: string;
  sameWeekSteep: string;
  prevWeek: string;
  nextWeek: string;
  courseDescription: string;
}> = {
   en: {
     homeTitle: 'PyDA Course — Free Interactive Python & Data Analysis Course',
      homeDescription: 'Learn Python and data analysis in your browser — run real code, earn XP, build streaks. Free interactive course with lessons and 20+ projects.',
     homeEyebrow: '🐍 Python · Data Analysis · Zero installs',
     homeH1: 'Learn Python by actually running it — and leveling up while you do.',
     homeLead: 'Every lesson earns XP. Streaks multiply it. Badges mark your climb. It\'s a course that plays like a game.',
     homeStartQuest: 'Start your quest',
     homeSeeRank: 'See your progress',
     homeQuestLabel: 'Quest',
     homeProfileLabel: 'Profile',
     homeTerminalBracket: '⚔️ Quest log — Run · Debug · Level up',
     homeTerminalLine1: '$ python main.py',
     homeTerminalLine2: '>>> print("Hello, world!")',
     homeTerminalLine3: 'Hello, world!',
      homeTerminalLine4: '✨ +100 XP earned',
      homeTerminalLine5: '🔥 streak: 3 (+10 bonus)',
     homeTerminalLine6: '🏆 Badge unlocked: First Step',
     homeStatXP: 'Total XP',
     homeStatStreak: 'Day streak',
     homeStatBadges: 'Badges',
     homeStatLevel: 'Your level',
     homeXpToNext: 'to next',
     homeXpAriaLabel: 'XP progress',
    homeRewardsTitle: "What you'll earn",
    homeRewardsSub: 'Every action pays off. Here\'s the scoreboard.',
    homeReward1Title: '+100 XP per lesson',
    homeReward1Desc: 'Each completed lesson fills your XP bar. Climb from Bronze to Grandmaster.',
    homeReward2Title: '+10 XP streak bonus',
    homeReward2Desc: '3+ day streak? Extra XP on every lesson. Keep it hot — fire intensity rises with consistency.',
    homeReward3Title: '24 unlockable quests',
    homeReward3Desc: 'From "First Step" to "Perfect Quiz" — each quest marks a real milestone in your progress.',
    homeReward4Title: '7 rank tiers',
    homeReward4Desc: 'Bronze → Silver → Gold → Platinum → Diamond → Master → Grandmaster. Earned, not given.',
    homeHubTrack1: '🐍 Track 1',
    homeHubTrack1Meta: '5 lessons · 100 XP total',
    homeHubTrack1Name: 'Python 101',
    homeHubTrack1Desc: 'Variables → functions → a mini language model. Two paths: chill or challenge.',
    homeHubTrack1CTA: 'Start Python 101',
    homeHubTrack2: '🔥 Track 2',
    homeHubTrack2Meta: '5 lessons · 100 XP total',
    homeHubTrack2Name: 'Pandas & Data',
    homeHubTrack2Desc: 'Reproduce a Kaggle-style notebook with pandas, from clean to insight.',
    homeHubTrack2CTA: 'Start Data Analysis',
    homeHubProjects: '👑 Projects',
    homeHubProjectsMeta: '29 builds · free & open-ended',
    homeHubProjectsName: 'Real-World Projects',
    homeHubProjectsDesc: '29 free Python projects — agents, CLIs, data tools. Browse any time, graduation not required.',
    homeHubProjectsCTA: 'Browse 29 projects',
    homeHeroCta: 'Run Python in Browser — No Install',
    homeInstall: 'Install App',
    homeHeroFeature1: 'Free & open-source',
    homeHeroFeature2: 'Runs in your browser',
    homeHeroFeature3: '🌍 4 languages',
    homeRewardsGradient: 'earn',
    pathLearn: 'learn',
    pathProgress: 'progress',
    pathPlayground: 'playground',
    pathProjects: 'projects',
    learnHubTitle: 'Learn Python & Data Analysis — Free Interactive Lessons | PyDA Course',
    learnHubDescription: 'Two tracks, two routes: Python 101 and Data Analysis. Free interactive lessons — run code in your browser, earn XP, and track your progress.',
    learnHubEyebrow: 'Your learning trail',
    learnHubH1: 'Two tracks. Two routes. Pick your path.',
    learnHubLead: 'Each lesson earns XP. Streaks multiply it. Badges mark your climb.',
    chooseRoute: 'Choose your route:',
    normalStart: 'Normal — start here',
    hardStart: 'Hard — start here',
    seeAllModules: 'See all modules →',
    track1: 'Track 1',
    track2: 'Track 2',
    projectsTitle: 'Python Projects for Beginners — Free Real-World Builds | PyDA Course',
    projectsDescription: '133 free Python projects for beginners — from agents to CLIs to data tools. Real-world builds that take you from browser playground to real Python.',
    projectsEyebrow: 'Beyond the course',
    projectsH1: 'Real-World Projects',
    projectsLead: 'Builds that graduate you from the browser playground to real Python.',
    track1Name: 'Python 101',
    track1Desc: 'The fundamentals: variables, types, control flow, functions — then a tiny language model.',
    track2Name: 'Pandas & Data',
    track2Desc: 'Ship a real notebook: pandas the way a data analyst actually uses it.',
    markComplete: 'Mark complete',
    completed: 'Completed ✓',
    projectMarkDone: 'Mark project as done ✓',
    projectDoneHint: 'Finish every step, then mark this project complete to claim its XP.',
    projectCompleted: 'Project completed ✓',
    weekLabel: 'Week',
    moduleLabel: 'Module',
    moduleLessonsLabel: 'Lessons',
    lessonLabel: 'Lesson',
    prevLesson: '← Previous',
    nextLesson: 'Next →',
    objectives: "What you'll learn:",
    trackNormalLabel: 'Normal',
    trackHardLabel: 'Hard',
    switchTo: 'Switch to',
    sameWeekCalm: 'Same week, gentler pace.',
    sameWeekSteep: 'Same week, steeper climb.',
    prevWeek: '← Week',
    nextWeek: 'Week →',
    courseDescription: 'Learn Python and data analysis in your browser — run real code, earn XP, build streaks.',
  },
  ar: {
    homeTitle: 'PyDA Course — دورة بايثون وتحليل البيانات التفاعلية المجانية',
    homeDescription: 'تعلّم بايثون وتحليل البيانات في متصفّحك — شغّل كود حقيقي، اكسب نقاط خبرة، وابنِ سلاسل تقدّم. دورة مجانية تفاعلية مع دروس تفاعلية و20+ مشروعًا.',
    homeEyebrow: '🐍 بايثون · تحليل البيانات · بلا تثبيت',
    homeH1: 'تعلّم بايثون بالتشغيل — وارتقِ وأنت تفعل ذلك.',
    homeLead: 'كل درس يمنحك نقاط خبرة. السلاسل تضاعفها. الأوسمة تُظهر تقدّمك. دورة تعلّم تشبه اللعبة.',
    homeStartQuest: 'ابدأ المهمّة',
    homeSeeRank: 'شاهد تقدّمك',
    homeQuestLabel: 'مهمّة',
    homeProfileLabel: 'الملف الشخصي',
    homeTerminalBracket: '⚔️ سجل المهمّات — شغّل · عطّل · ارتقِ',
    homeTerminalLine1: '$ python main.py',
    homeTerminalLine2: '>>> print("مرحبًا بالعالم!")',
    homeTerminalLine3: 'مرحبًا بالعالم!',
    homeTerminalLine4: '✨ +100 نقطة خبرة',
    homeTerminalLine5: '🔥 سلسلة: 3 (+10 مكافأة)',
    homeTerminalLine6: '🏆 أوسمة مفتوحة: الخطوة الأولى',
    homeStatXP: 'إجمالي نقاط الخبرة',
    homeStatStreak: 'سلسلة الأيام',
    homeStatBadges: 'أوسمة',
    homeStatLevel: 'مستواك',
    homeXpToNext: 'للتالي',
    homeXpAriaLabel: 'تقدّم نقاط الخبرة',
    homeRewardsTitle: 'ما ستكسبه',
    homeRewardsSub: 'كل إجراء له مكافأة. إليك لوحة النتائج.',
    homeReward1Title: '+100 نقطة خبرة لكل درس',
    homeReward1Desc: 'كل درس مكتمل يملأ شريط نقاط خبرة. ارتقِ من البرونزية إلى الغراند ماستر.',
    homeReward2Title: '+10 مكافأة سلسلة',
    homeReward2Desc: 'سلسلة 3+ أيام؟ نقاط خبرة إضافية على كل درس. حافظ عليها — شدّة النار تزداد مع الاستمرارية.',
    homeReward3Title: '24 مهمة قابلة للفتح',
    homeReward3Desc: 'من "الخطوة الأولى" إلى "اختبار مثالي" — كل مهمة تُعلِّم تقدّمك الحقيقي.',
    homeReward4Title: '7 طبقات مرتبة',
    homeReward4Desc: 'برونزية → فضية → ذهبية → بلاتينية → ماسية → ماستر → غراند ماستر. مكتسبة، ليست ممنوحة.',
    homeHubTrack1: '🐍 المسار 1',
    homeHubTrack1Meta: '5 دروس · 100 نقطة خبرة',
    homeHubTrack1Name: 'بايثون 101',
    homeHubTrack1Desc: 'المتغيّرات → الدوال → نموذج لغوي مصغّر. طريقان: هادئ أو تحدي.',
    homeHubTrack1CTA: 'ابدأ بايثون 101',
    homeHubTrack2: '🔥 المسار 2',
    homeHubTrack2Meta: '5 دروس · 100 نقطة خبرة',
    homeHubTrack2Name: 'بانداس والبيانات',
    homeHubTrack2Desc: 'أعد إنتاج دفتر عمل بنمط Kaggle باستخدام بانداس، من التنظيف إلى الاستنتاج.',
    homeHubTrack2CTA: 'ابدأ تحليل البيانات',
    homeHubProjects: '👑 المشاريع',
    homeHubProjectsMeta: '29 مشروع · مجاني ومفتوح',
    homeHubProjectsName: 'مشاريع واقعية',
    homeHubProjectsDesc: '29 مشروعاً بايثون مجانية — وكلاء وأدوات بيانات. تصفّح أيّ وقت، التخرج ليس مطلوبًا.',
    homeHubProjectsCTA: 'تصفح 29 مشروعاً',
    homeHeroCta: 'شغّل بايثون في المتصفح — بدون تثبيت',
    homeInstall: 'تثبيت التطبيق',
    homeHeroFeature1: 'مجاني ومفتوح المصدر',
    homeHeroFeature2: 'يعمل في متصفحك',
    homeHeroFeature3: '🌍 4 لغات',
    homeRewardsGradient: '→',
    pathLearn: 'ar/تعلم',
    pathProgress: 'ar/تقدم',
    pathPlayground: 'ar/تعلم',
    pathProjects: 'ar/مشاريع',
    learnHubTitle: 'تعلّم بايثون وتحليل البيانات — دروس تفاعلية مجانية | PyDA Course',
    learnHubDescription: 'مساران، طريقان: بايثون 101 وتحليل البيانات. دروس تفاعلية مجانية — شغّل الكود في متصفّحك وتابع تقدّمك.',
    learnHubEyebrow: 'مسار تعلّمك',
    learnHubH1: 'مساران. طريقان. اختر طريقك.',
    learnHubLead: 'كل درس يمنحك نقاط خبرة. السلاسل تضاعفها. الأوسمة تُظهر تقدّمك.',
    chooseRoute: 'اختر طريقك:',
    normalStart: 'عادي — ابدأ هنا',
    hardStart: 'صعب — ابدأ هنا',
    seeAllModules: 'عرض كل الوحدات ←',
    track1: 'المسار 1',
    track2: 'المسار 2',
    projectsTitle: 'مشاريع بايثون للمبتدئين — بناءات مجانية واقعية | PyDA Course',
    projectsDescription: '133 مشروع بايثون مجاني للمبتدئين — من وكلاء إلى أدوات سطر أوامر وأدوات بيانات. بناءات واقعية تنقلك من ملعب المتصفح إلى بايثون حقيقية.',
    projectsEyebrow: 'ما بعد الدورة',
    projectsH1: 'مشاريع واقعية',
    projectsLead: 'بناءات تُخرّجك من ملعب المتصفح إلى بايثون حقيقية.',
    track1Name: 'بايثون 101',
    track1Desc: 'الأساسيات: المتغيّرات، الأنواع، التحكّم بالتدفّق، الدوال — ثم نموذج لغوي مصغّر.',
    track2Name: 'بانداس والبيانات',
    track2Desc: 'أنجز دفتر عمل حقيقي: بانداس كما يستخدمها محلّل البيانات فعليًا.',
    markComplete: 'تحديد كمكتمل',
    completed: 'مكتمل ✓',
    projectMarkDone: 'حدد المشروع كمكتمل ✓',
    projectDoneHint: 'أكمل كل خطوة ثم حدد المشروع كمكتمل لجمع نقاطه.',
    projectCompleted: 'المشروع مكتمل ✓',
    weekLabel: 'الأسبوع',
    moduleLabel: 'الوحدة',
    moduleLessonsLabel: 'الدروس',
    lessonLabel: 'درس',
    prevLesson: '← السابق',
    nextLesson: 'التالي ←',
    objectives: 'ماذا ستتعلم:',
    trackNormalLabel: 'عادي',
    trackHardLabel: 'صعب',
    switchTo: 'انتقل إلى',
    sameWeekCalm: 'نفس الأسبوع، إيقاع أهدأ.',
    sameWeekSteep: 'نفس الأسبوع، مسار أكثر حدة.',
    prevWeek: 'الأسبوع ←',
    nextWeek: '→ الأسبوع',
    courseDescription: 'تعلّم بايثون وتحليل البيانات في متصفّحك — شغّل كود حقيقي، اكسب نقاط خبرة، وابنِ سلاسل تقدّم.',
  },
  es: {
    homeTitle: 'PyDA Course — Aprende Python como un juego',
    homeDescription: 'Aprende Python y análisis de datos en tu navegador — ejecuta código real, gana XP, construye rachas. Cero instalaciones, cero aburrimiento.',
    homeEyebrow: '🐍 Python · Análisis de Datos · Cero instalaciones',
    homeH1: 'Aprende Python ejecutándolo — y sube de nivel mientras lo haces.',
    homeLead: 'Cada lección gana XP. Las rachas lo multiplican. Las insignias marcan tu progreso. Es un curso que se siente como un juego.',
    homeStartQuest: 'Empieza tu misión',
    homeSeeRank: 'Mira tu progreso',
    homeQuestLabel: 'Misión',
    homeProfileLabel: 'Perfil',
    homeTerminalBracket: '⚔️ Registro de misiones — Ejecuta · Depura · Sube de nivel',
    homeTerminalLine1: '$ python main.py',
    homeTerminalLine2: '>>> print("¡Hola, mundo!")',
    homeTerminalLine3: '¡Hola, mundo!',
    homeTerminalLine4: '✨ +20 XP ganados',
    homeTerminalLine5: '🔥 racha: 3 (+5 bonificación)',
    homeTerminalLine6: '🏆 Insignia desbloqueada: Primer paso',
    homeStatXP: 'XP total',
    homeStatStreak: 'Racha de días',
    homeStatBadges: 'Insignias',
    homeStatLevel: 'Tu nivel',
    homeXpToNext: 'para siguiente',
    homeXpAriaLabel: 'Progreso de XP',
    homeRewardsTitle: 'Lo que ganarás',
    homeRewardsSub: 'Cada acción tiene recompensa. Aquí está el marcador.',
    homeReward1Title: '+20 XP por lección',
    homeReward1Desc: 'Cada lección completada llena tu barra de XP. Sube de Bronce a Gran Maestro.',
    homeReward2Title: '+5 bonificación de racha',
    homeReward2Desc: '¿Racha de 3+ días? XP extra en cada lección. Mantenla — la intensidad del fuego aumenta con la consistencia.',
    homeReward3Title: '11 insignias desbloqueables',
    homeReward3Desc: 'De "Primer paso" a "Racha de 14 días" — cada insignia marca un hito real en tu progreso.',
    homeReward4Title: '7 rangos',
    homeReward4Desc: 'Bronce → Plata → Oro → Platino → Diamante → Maestro → Gran Maestro. Se ganan, no se regalan.',
    homeHubTrack1: '🐍 Pista 1',
    homeHubTrack1Meta: '5 lecciones · 100 XP total',
    homeHubTrack1Name: 'Python 101',
    homeHubTrack1Desc: 'Variables → funciones → un mini modelo de lenguaje. Dos caminos: relajado o desafío.',
    homeHubTrack1CTA: 'Empieza Python 101',
    homeHubTrack2: '🔥 Pista 2',
    homeHubTrack2Meta: '5 lecciones · 100 XP total',
    homeHubTrack2Name: 'Pandas y Datos',
    homeHubTrack2Desc: 'Reproduce un notebook estilo Kaggle con pandas, de limpio a insights.',
    homeHubTrack2CTA: 'Empieza Análisis de Datos',
    homeHubProjects: '👑 Proyectos',
    homeHubProjectsMeta: '29 construcciones · gratis y abiertas',
    homeHubProjectsName: 'Proyectos del Mundo Real',
    homeHubProjectsDesc: '29 proyectos Python gratuitos — agentes, CLI, herramientas de datos. Navega cuando quieras, no necesitas graduarte.',
    homeHubProjectsCTA: 'Explorar 29 proyectos',
    homeHeroCta: 'Ejecuta Python en tu navegador — Sin instalar',
    homeInstall: 'Instalar App',
    homeHeroFeature1: 'Gratis y de código abierto',
    homeHeroFeature2: 'Ejecuta en tu navegador',
    homeHeroFeature3: '🌍 4 idiomas',
    homeRewardsGradient: '→',
    pathLearn: 'es/aprender',
    pathProgress: 'es/progreso',
    pathPlayground: 'es/aprender',
    pathProjects: 'es/proyectos',
    learnHubTitle: 'Aprender — PyDA Course',
    learnHubDescription: 'Dos pistas, dos rutas: Python 101 y Análisis de Datos. Elige tu camino y empieza a ganar XP.',
    learnHubEyebrow: 'Tu ruta de aprendizaje',
    learnHubH1: 'Dos pistas. Dos rutas. Elige tu camino.',
    learnHubLead: 'Cada lección gana XP. Las rachas lo multiplican. Las insignias marcan tu progreso.',
    chooseRoute: 'Elige tu ruta:',
    normalStart: 'Normal — empieza aquí',
    hardStart: 'Difícil — empieza aquí',
    seeAllModules: 'Ver todos los módulos →',
    track1: 'Pista 1',
    track2: 'Pista 2',
    projectsTitle: 'Proyectos del Mundo Real — PyDA Course',
    projectsDescription: '133 proyectos de Python gratuitos para principiantes — de agentes a CLI a herramientas de datos. Construcciones del mundo real que te llevan del playground del navegador a Python real.',
    projectsEyebrow: 'Más allá del curso',
    projectsH1: 'Proyectos del Mundo Real',
    projectsLead: 'Construcciones que te gradúan del playground del navegador a Python real.',
    track1Name: 'Python 101',
    track1Desc: 'Los fundamentos: variables, tipos, control de flujo, funciones — y luego un pequeño modelo de lenguaje.',
    track2Name: 'Pandas y Datos',
    track2Desc: 'Publica un notebook real: pandas tal como lo usa de verdad un analista de datos.',
    markComplete: 'Marcar como completado',
    completed: 'Completado ✓',
    projectMarkDone: 'Marcar proyecto como terminado ✓',
    projectDoneHint: 'Termina todos los pasos y luego marca este proyecto como completo para ganar su XP.',
    projectCompleted: 'Proyecto completado ✓',
    weekLabel: 'Semana',
    moduleLabel: 'Módulo',
    moduleLessonsLabel: 'Lecciones',
    lessonLabel: 'Lección',
    prevLesson: '← Anterior',
    nextLesson: 'Siguiente →',
    objectives: 'Lo que aprenderás:',
    trackNormalLabel: 'Normal',
    trackHardLabel: 'Difícil',
    switchTo: 'Cambiar a',
    sameWeekCalm: 'Misma semana, ritmo más suave.',
    sameWeekSteep: 'Misma semana, ascenso más empinado.',
    prevWeek: '← Semana',
    nextWeek: 'Semana →',
    courseDescription: 'Aprende Python y análisis de datos en tu navegador — ejecuta código real, gana XP, construye rachas.',
  },
  fr: {
    homeTitle: 'PyDA Course — Apprends Python comme un jeu',
    homeDescription: 'Apprends Python et l\'analyse de données dans ton navigateur — exécute du vrai code, gagne des XP, construis des séries. Zéro installation, zéro ennui.',
    homeEyebrow: '🐍 Python · Analyse de Données · Zéro installation',
    homeH1: 'Apprends Python en l\'exécutant — et monte de niveau en cours de route.',
    homeLead: 'Chaque leçon rapporte des XP. Les séries les multiplient. Les badges marquent ta progression. Un cours qui se joue comme un jeu.',
    homeStartQuest: 'Commence ta quête',
    homeSeeRank: 'Voir ta progression',
    homeQuestLabel: 'Quête',
    homeProfileLabel: 'Profil',
    homeTerminalBracket: '⚔️ Journal de quêtes — Exécute · Débogue · Monte de niveau',
    homeTerminalLine1: '$ python main.py',
    homeTerminalLine2: '>>> print("Bonjour, le monde !")',
    homeTerminalLine3: 'Bonjour, le monde !',
    homeTerminalLine4: '✨ +20 XP gagnés',
    homeTerminalLine5: '🔥 série : 3 (+5 bonus)',
    homeTerminalLine6: '🏆 Badge débloqué : Premier pas',
    homeStatXP: 'XP total',
    homeStatStreak: 'Série de jours',
    homeStatBadges: 'Insignias',
    homeStatLevel: 'Ton niveau',
    homeXpToNext: 'pour suivant',
    homeXpAriaLabel: 'Progression XP',
    homeRewardsTitle: 'Ce que tu gagneras',
    homeRewardsSub: 'Chaque action a une récompense. Voici le tableau de bord.',
    homeReward1Title: '+20 XP par leçon',
    homeReward1Desc: 'Chaque leçon complétée remplit ta barre d\'XP. Monte de Bronze à Grand Maître.',
    homeReward2Title: '+5 bonus de série',
    homeReward2Desc: 'Série de 3+ jours ? XP supplémentaire sur chaque leçon. Maintiens-la — l\'intensité du feu augmente avec la régularité.',
    homeReward3Title: '11 badges débloquables',
    homeReward3Desc: 'De "Premier pas" à "Série de 14 jours" — chaque badge marque une étape réelle de ta progression.',
    homeReward4Title: '7 paliers de rang',
    homeReward4Desc: 'Bronze → Argent → Or → Platine → Diamant → Maître → Grand Maître. Se gagnent, ne se donnent pas.',
    homeHubTrack1: '🐍 Parcours 1',
    homeHubTrack1Meta: '5 leçons · 100 XP total',
    homeHubTrack1Name: 'Python 101',
    homeHubTrack1Desc: 'Variables → fonctions → un mini modèle de langage. Deux chemins : chill ou défi.',
    homeHubTrack1CTA: 'Commence Python 101',
    homeHubTrack2: '🔥 Parcours 2',
    homeHubTrack2Meta: '5 leçons · 100 XP total',
    homeHubTrack2Name: 'Pandas & Données',
    homeHubTrack2Desc: 'Reproduis un notebook style Kaggle avec pandas, du nettoyage aux insights.',
    homeHubTrack2CTA: 'Commence l\'Analyse de Données',
    homeHubProjects: '👑 Projets',
    homeHubProjectsMeta: '29 réalisations · gratuites et ouvertes',
    homeHubProjectsName: 'Projets Concrets',
    homeHubProjectsDesc: '29 projets Python gratuits — agents, CLI, outils de données. Navigue quand tu veux, pas besoin de diplôme.',
    homeHubProjectsCTA: 'Explorer 29 projets',
    homeHeroCta: 'Exécute Python dans ton navigateur — Sans installer',
    homeInstall: "Installer l'appli",
    homeHeroFeature1: 'Gratuit et open-source',
    homeHeroFeature2: 'Exécute dans ton navigateur',
    homeHeroFeature3: '🌍 4 langues',
    homeRewardsGradient: '→',
    pathLearn: 'fr/apprendre',
    pathProgress: 'fr/progres',
    pathPlayground: 'fr/apprendre',
    pathProjects: 'fr/projets',
    learnHubTitle: 'Apprendre — PyDA Course',
    learnHubDescription: 'Deux parcours, deux routes : Python 101 et Analyse de Données. Choisis ta voie et gagne des XP.',
    learnHubEyebrow: 'Ton parcours',
    learnHubH1: 'Deux parcours. Deux routes. Choisis ta voie.',
    learnHubLead: 'Chaque leçon rapporte des XP. Les séries les multiplient. Les badges marquent ta progression.',
    chooseRoute: 'Choisis ta route :',
    normalStart: 'Normal — commencer ici',
    hardStart: 'Difficile — commencer ici',
    seeAllModules: 'Voir tous les modules →',
    track1: 'Parcours 1',
    track2: 'Parcours 2',
    projectsTitle: 'Projets Concrets — PyDA Course',
    projectsDescription: '133 projets Python gratuits pour débutants — des agents aux CLI en passant par les outils de données. Des constructions concrètes qui te font passer du bac à sable du navigateur à du vrai Python.',
    projectsEyebrow: 'Au-delà du cours',
    projectsH1: 'Projets Concrets',
    projectsLead: 'Des constructions qui te font passer du bac à sable du navigateur à du vrai Python.',
    track1Name: 'Python 101',
    track1Desc: 'Les fondamentaux : variables, types, structures de contrôle, fonctions — puis un mini modèle de langage.',
    track2Name: 'Pandas & Données',
    track2Desc: 'Réalisez un vrai notebook : pandas tel qu’un analyste de données l’utilise vraiment.',
    markComplete: 'Marquer comme terminé',
    completed: 'Terminé ✓',
    projectMarkDone: 'Marquer ce projet comme terminé ✓',
    projectDoneHint: 'Terminez chaque étape puis marquez ce projet comme terminé pour gagner ses points.',
    projectCompleted: 'Projet terminé ✓',
    weekLabel: 'Semaine',
    moduleLabel: 'Module',
    moduleLessonsLabel: 'Leçons',
    lessonLabel: 'Leçon',
    prevLesson: '← Précédent',
    nextLesson: 'Suivant →',
    objectives: 'Ce que vous apprendrez :',
    trackNormalLabel: 'Normal',
    trackHardLabel: 'Difficile',
    switchTo: 'Passer à',
    sameWeekCalm: 'Même semaine, rythme plus doux.',
    sameWeekSteep: 'Même semaine, ascension plus raide.',
    prevWeek: '← Semaine',
    nextWeek: 'Semaine →',
    courseDescription: 'Apprends Python et l\'analyse de données dans ton navigateur — exécute du vrai code, gagne des XP, construis des séries.',
  },
};
