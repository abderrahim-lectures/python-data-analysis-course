// Cheatsheet page copy. Like lesson bodies, the reference content is authored
// once in English (the code snippets are locale-neutral anyway); the page
// chrome (title/intro) is translated per locale — same split as the lessons.
import type {Locale} from './routeSegments';

export interface CheatCard {
  title: string;
  code: string;
  note: string;
}

export interface CheatSection {
  icon: string;
  title: string;
  cards: CheatCard[];
}

export interface CheatsheetsChrome {
  title: string;
  description: string;
  heading: string;
  intro: string;
}

export const CHEATSHEETS_CHROME: Record<Locale, CheatsheetsChrome> = {
  en: {
    title: 'Cheatsheets — PyDA Course',
    description: 'Quick Python reference for every lesson: syntax, snippets, and gotchas at a glance.',
    heading: 'Python cheatsheets',
    intro: 'The snippets you will reach for every single lesson. Code runs in the cells above; these are the patterns to copy.',
  },
  ar: {
    title: 'ملخصات — دورة بايثون وتحليل البيانات',
    description: 'مرجع بايثون السريع لكل درس: صيغ ومقتطفات وأخطاء شائعة في لمحة.',
    heading: 'ملخصات بايثون',
    intro: 'المقتطفات التي ستلجأ إليها في كل درس. الكود أعلاه يعمل في الخلايا؛ هذه هي الأنماط الجاهزة للنسخ.',
  },
  es: {
    title: 'Referencias — Curso PyDA',
    description: 'Referencia rápida de Python para cada lección: sintaxis, fragmentos y errores comunes de un vistazo.',
    heading: 'Referencias de Python',
    intro: 'Los fragmentos a los que recurrirás en cada lección. El código corre en las celdas de arriba; estos son los patrones para copiar.',
  },
  fr: {
    title: 'Antisèches — Cours PyDA',
    description: 'Référence Python rapide pour chaque leçon : syntaxe, extraits et pièges en un coup d’œil.',
    heading: 'Antisèches Python',
    intro: 'Les extraits auxquels vous reviendrez à chaque leçon. Le code s’exécute dans les cellules ci-dessus ; voici les motifs à copier.',
  },
};

export const CHEAT_SECTIONS: CheatSection[] = [
  {
    icon: '🖨️',
    title: 'Output',
    cards: [
      {title: 'print', code: "print('Hello, world!')\nprint(2 + 3)      # 5, values print automatically",
       note: 'The one function you will use in every single lesson.'},
      {title: 'No trailing comma', code: "print('a', 'b', sep='-')   # a-b",
       note: 'sep controls the separator; the default is a space.'},
    ],
  },
  {
    icon: '🔢',
    title: 'Numbers',
    cards: [
      {title: 'Basic arithmetic', code: 'x = 7\nx // 2   # 3  integer division\nx % 2    # 1  remainder\nx ** 2   # 49 exponent',
       note: '// and % are division partners — they answer "how many times" and "how much is left".'},
      {title: 'type()', code: 'type(3)     # <class \'int\'>\ntype(3.0)   # <class \'float\'>\ntype("3")   # <class \'str\'>',
       note: 'Check any value\'s type when an error mentions a type mismatch.'},
      {title: 'Converting', code: "int('42')   # 42\nfloat('4.2')\nstr(42)     # '42'",
       note: 'input() always returns a string — convert before doing math.'},
    ],
  },
  {
    icon: '📝',
    title: 'Strings',
    cards: [
      {title: 'f-strings', code: "name = 'PyDA'\nprint(f'{name} → {len(name)} letters')",
       note: 'The f before the quote makes {…} insert values. Use this, not concatenation.'},
      {title: 'Methods', code: "'  hi  '.strip()   # 'hi'\n'hello'.upper()   # 'HELLO'\n'a,b'.split(',')   # ['a', 'b']",
       note: 'Methods return a NEW string — strings are immutable.'},
      {title: 'Slicing', code: "word = 'python'\nword[0]    # 'p'\nword[-1]   # 'n'\nword[1:4]  # 'yth'",
       note: 'start inclusive, end exclusive. Negative indexes count from the end.'},
    ],
  },
  {
    icon: '📚',
    title: 'Lists',
    cards: [
      {title: 'Building & adding', code: 'nums = [1, 2, 3]\nnums.append(4)      # [1, 2, 3, 4]\nnums + [5]        # [1, 2, 3, 4, 5]',
       note: 'append mutates the list in place; + makes a new one.'},
      {title: 'Reading', code: 'nums[0]      # 1\nlen(nums)    # 4\nnums[-1]     # 4\n3 in nums    # True',
       note: 'in / not in are the membership checks.'},
      {title: 'Looping', code: 'for n in nums:\n    print(n * 2)',
       note: 'The for loop reaches for each element one at a time.'},
    ],
  },
  {
    icon: '🗂️',
    title: 'Dictionaries',
    cards: [
      {title: 'Build & read', code: "ages = {'ada': 36, 'bob': 41}\nages['ada']        # 36\nages.get('zoe')    # None (safe \"missing\")\nages.get('zoe', 0) # 0 (with default)",
       note: 'Using [key] on a missing key raises KeyError — prefer .get() when unsure.'},
      {title: 'Write', code: "ages['ada'] = 37\nages['zoe'] = 22\ndel ages['bob']",
       note: 'Assignment adds or updates; del removes a key.'},
      {title: 'Iterate', code: "for k, v in ages.items():\n    print(k, v)",
       note: '.items() gives (key, value) pairs; .keys() and .values() give just one side.'},
    ],
  },
  {
    icon: '🔀',
    title: 'Conditionals',
    cards: [
      {title: 'if / elif / else', code: 'if score >= 90:\n    print("A")\nelif score >= 80:\n    print("B")\nelse:\n    print("C")',
       note: 'elif stops once a condition is True — order matters.'},
      {title: 'Comparisons', code: '==  !=  <  <=  >  >=',
       note: '== tests equality; = assigns. Remembering this fixes most beginner "why is it True" bugs.'},
      {title: 'Boolean operators', code: 'a and b    # both truthy\na or b     # at least one\na and not b',
       note: 'and / or / not — the plain words, not && and ! like other languages.'},
    ],
  },
  {
    icon: '🔁',
    title: 'Loops',
    cards: [
      {title: 'range', code: 'for i in range(3):   # 0, 1, 2\n    print(i)\nfor i in range(1, 4): # 1, 2, 3\n    print(i)',
       note: 'range stops before the second number — same end-exclusive rule as slicing.'},
      {title: 'enumerate / zip', code: "for i, item in enumerate(['a','b']):\n    print(i, item)\nfor x, y in zip([1,2],[3,4]):\n    print(x, y)",
       note: 'enumerate adds a counter; zip pairs two sequences element-wise.'},
      {title: 'while', code: 'n = 3\nwhile n > 0:\n    print(n)\n    n -= 1   # don\'t forget: while needs progress',
       note: 'while repeats until its condition becomes False — a loop that never updates its condition never ends.'},
    ],
  },
  {
    icon: '🛠️',
    title: 'Functions',
    cards: [
      {title: 'Define & call', code: 'def double(x):\n    return x * 2\n\ny = double(21)   # 42',
       note: 'def … body must be indented. return hands a value back; without it you get None.'},
      {title: 'Defaults & keywords', code: 'def greet(name, exclaim=True):\n    s = f"Hello {name}"\n    return s + ("!" if exclaim else "")\n\ngreet("ada")        # Hello ada!\ngreet("ada", False) # Hello ada',
       note: 'Parameters with = get defaults; callers can pass by keyword.'},
      {title: 'Lambda (short forms)', code: 'double = lambda x: x * 2\nsorted(nums, key=lambda n: -n)',
       note: 'Use lambdas for one-line throwaway functions passed to sort/max/map.'},
    ],
  },
  {
    icon: '🧰',
    title: 'Comprehensions',
    cards: [
      {title: 'List', code: '[n * 2 for n in nums]              # [2, 4, 6]\n[n for n in nums if n > 1]      # [2, 3]\n{n * 2 for n in nums}           # set',
       note: 'A for loop inside brackets — the idiomatic way to transform a list.'},
      {title: 'Dict', code: "{n: n ** 2 for n in range(4)}   # {0: 0, 1: 1, 2: 4, 3: 9}",
       note: 'Same shape, with a colon between the key and the value.'},
    ],
  },
  {
    icon: '🗃️',
    title: 'Files & CSV',
    cards: [
      {title: 'Read a file', code: 'text = open("file.txt").read()\nlines = text.splitlines()',
       note: 'The easiest read; use with open(...) as f when you need streaming.'},
      {title: 'CSV rows', code: "import csv\nwith open('data.csv') as f:\n    rows = list(csv.reader(f))",
       note: 'rows[0] is the header; each later row is a list of strings — convert to numbers before math.'},
    ],
  },
  {
    icon: '🐼',
    title: 'pandas (Data Analysis)',
    cards: [
      {title: 'Load & glance', code: "import pandas as pd\ndf = pd.read_csv('data.csv')\ndf.head()      # first 5 rows\ndf.describe()  # numeric summary",
       note: 'The standard incantation — pd.read_csv is how every data lesson starts.'},
      {title: 'Columns & rows', code: "df['name']          # one column\ndf[['a', 'b']]      # several\ndf.loc[0]           # first row\ndf[df['age'] > 30]  # filter rows",
       note: 'Square brackets on a column name; boolean masks for filtering.'},
      {title: 'Group & aggregate', code: "df.groupby('city')['sales'].sum()\ndf.groupby('city').mean()",
       note: 'groupby + one summary method is the pivot of the Data Analysis section.'},
    ],
  },
  {
    icon: '🛟',
    title: 'Error recovery',
    cards: [
      {title: 'Read the last line', code: "TypeError: unsupported operand type(s) for +: 'int' and 'str'",
       note: 'The final line names the error and the offending values — it is the message that says what to fix.'},
      {title: 'try / except', code: "try:\n    total = int(user_input) * 2\nexcept ValueError:\n    print('That was not a number')",
       note: 'Catch only the specific error you expect; catching everything hides real bugs.'},
    ],
  },
];