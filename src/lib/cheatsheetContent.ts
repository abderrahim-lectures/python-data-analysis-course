import type {Locale} from './routeSegments';
import {CHEAT_SECTIONS as CHEAT_SECTIONS_AR} from './cheatsheet.ar';
import {CHEAT_SECTIONS as CHEAT_SECTIONS_ES} from './cheatsheet.es';
import {CHEAT_SECTIONS as CHEAT_SECTIONS_FR} from './cheatsheet.fr';

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

export function cheatSections(locale: Locale): CheatSection[] {
  switch (locale) {
    case 'ar': return CHEAT_SECTIONS_AR;
    case 'es': return CHEAT_SECTIONS_ES;
    case 'fr': return CHEAT_SECTIONS_FR;
    default: return CHEAT_SECTIONS;
  }
}

export const CHEAT_SECTIONS: CheatSection[] = [
  {
    icon: '📦',
    title: 'Variables',
    cards: [
      {title: 'Assign & read', code: 'x = 5\nx = x + 1   # 6\nprint(x)    # 6',
       note: '= stores a value under a name. Reassigning just points the name at the new value.'},
      {title: 'Naming rules', code: 'score = 10      # snake_case ✅\nage_2 = 3       # digits ok after first char\nage 2 = 3       # ❌ space & leading digit\nScore = 10      # works, but remember: case-sensitive',
       note: 'Names are case-sensitive. Use snake_case, descriptive names, and avoid built-in words like print.'},
      {title: 'Swap & unpack', code: 'a, b = 1, 2\na, b = b, a   # swap in one line\nfirst, *rest = [1, 2, 3]  # first=1, rest=[2, 3]',
       note: 'Python assigns several names at once — the cleanest swap there is.'},
    ],
  },
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
    icon: '⌨️',
    title: 'Input',
    cards: [
      {title: 'Read the prompt', code: "name = input('Your name: ')\nprint('Hi', name)",
       note: 'input() pauses and waits; it ALWAYS returns a string.'},
      {title: 'Convert it', code: "age = int(input('Age: '))\nprice = float(input('Price: '))",
       note: 'Convert at the read with int()/float(), or every math step after will fail.'},
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
      {title: 'Combine, repeat, search', code: "'py' + 'thon'    # 'python'\n'ha' * 3        # 'hahaha'\n'py' in 'python'  # True\nlen('abc')        # 3",
       note: '+ glues strings, * repeats them, in tests for a substring, len() counts characters.'},
      {title: 'Backslash escapes', code: "print('she\\'s fine')   # she's fine\nprint('line1\\nline2')  # two lines\nprint('tab\\there')      # tab       here",
       note: "\\' is a quote, \\n a new line, \\t a tab. Use raw strings r\"…\" when a path has too many backslashes."},
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
      {title: 'Sort & copy', code: 'nums.sort()          # in place\nsorted(nums)         # NEW sorted list\ncopy = nums[:]       # real copy, not the same list',
       note: 'sort() changes the list and returns None; sorted() returns a new one. Use nums[:] to work on a copy.'},
      {title: 'Slice tricks', code: 'nums = [0, 1, 2, 3, 4]\nnums[1:]    # [1, 2, 3, 4]  drop the head\nnums[:-1]   # [0, 1, 2, 3]  drop the tail\nnums[::-1]  # [4, 3, 2, 1, 0]  reversed',
       note: 'The [start:end:step] form is list surgery — dropping, copying, and reversing in one line.'},
    ],
  },
  {
    icon: '🏷️',
    title: 'Tuples & Sets',
    cards: [
      {title: 'Tuples', code: "t = (1, 2, 3)\nt[0]        # 1\nx, y = t        # unpack\n# t[0] = 9      # ❌ tuples can't change",
       note: 'A fixed list — use it when the shape should not change: coordinates, config pairs, read-only data.'},
      {title: 'Sets', code: "s = {1, 2, 2, 3}   # {1, 2, 3} — duplicates dropped\ns.add(4)\n4 in s        # True\ns.remove(4)",
       note: 'An unordered bag of unique items — perfect for de-duplication and fast membership checks.'},
      {title: 'Set operations', code: "a = {1, 2, 3}\nb = {3, 4}\na | b       # {1, 2, 3, 4}  union\na & b       # {3}           intersection\na - b       # {1, 2}        difference\na ^ b       # {1, 2, 4}     symmetric",
       note: '| , & , - , ^ turn sets into one-line math — compare groups without nested loops.'},
      {title: 'Which container?', code: 'list    # ordered, editable, keeps order\ntuple   # ordered, read-only\nset     # unordered, unique, fast in\ndict    # key → value lookup',
       note: 'Pick by what the code needs: order, uniqueness, or finding things by name.'},
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
      {title: 'Truthiness', code: "if x:             # 'is x non-empty?'\n    print(x)\n# Falsy: 0, 0.0, '', [], {}, None\n# Everything else is truthy",
       note: '"if x:" is the idiomatic "is x there?" check — empty containers and 0 fail, everything else passes.'},
      {title: 'Ternary one-liner', code: "'pass' if score >= 50 else 'fail'",
       note: 'A compact if/else that returns a value — great inside f-strings and print().'},
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
      {title: 'break / continue', code: 'for n in range(10):\n    if n == 3:\n        break      # stop the loop\nfor n in range(10):\n    if n % 2:\n        continue   # skip this one\n    print(n)',
       note: 'break leaves the loop entirely; continue jumps to the next iteration.'},
      {title: 'while', code: 'n = 3\nwhile n > 0:\n    print(n)\n    n -= 1   # don\'t forget: while needs progress',
       note: 'while repeats until its condition becomes False — a loop that never updates its condition never ends.'},
      {title: 'Loop else (optional)', code: 'for n in nums:\n    if n == target:\n        break\nelse:\n    print("not found")',
       note: 'The else block runs only if the loop finished without a break — a built-in "was it found?" flag.'},
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
      {title: 'Return multiple values', code: 'def minmax(nums):\n    return min(nums), max(nums)\n\nlo, hi = minmax([3, 1, 4])  # lo=1, hi=4',
       note: 'A function can return a tuple and callers unpack it into several names at once.'},
      {title: 'Scope & print vs return', code: 'x = 10            # global\n\ndef show(y):\n    x = 5         # local — different x!\n    print(x, y)   # side effect, returns None\n\nresult = show(1)  # result is None',
       note: 'print shows a value in the console; return actually hands it back. Assigning inside a function shadows the global.'},
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