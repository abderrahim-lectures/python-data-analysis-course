"""The bundled dataset for the Rate-Limited API example.

A few hundred real, public-domain-or-widely-attributed quotes, collected and
categorized by hand for this course -- no external API or scraping involved.
Each entry has a stable integer id (assigned at import time, by list order),
a quote's text, its author, and one category tag used for filtering.

This file is intentionally plain data -- no framework imports -- so it can be
loaded, filtered, and tested in complete isolation from FastAPI itself.
"""

from __future__ import annotations

_RAW_QUOTES: list[tuple[str, str, str]] = [
    # (text, author, category)

    # -- programming --
    ("Programs must be written for people to read, and only incidentally for machines to execute.", "Harold Abelson", "programming"),
    ("Any fool can write code that a computer can understand. Good programmers write code that humans can understand.", "Martin Fowler", "programming"),
    ("The most disastrous thing that you can ever learn is your first programming language.", "Alan Kay", "programming"),
    ("Simplicity is prerequisite for reliability.", "Edsger W. Dijkstra", "programming"),
    ("There are only two hard things in Computer Science: cache invalidation and naming things.", "Phil Karlton", "programming"),
    ("Premature optimization is the root of all evil.", "Donald Knuth", "programming"),
    ("Talk is cheap. Show me the code.", "Linus Torvalds", "programming"),
    ("First, solve the problem. Then, write the code.", "John Johnson", "programming"),
    ("Testing leads to failure, and failure leads to understanding.", "Burt Rutan", "programming"),
    ("A good programmer is someone who always looks both ways before crossing a one-way street.", "Doug Linder", "programming"),
    ("Debugging is twice as hard as writing the code in the first place.", "Brian Kernighan", "programming"),
    ("It's not a bug, it's an undocumented feature.", "Anonymous", "programming"),
    ("Code never lies, comments sometimes do.", "Ron Jeffries", "programming"),
    ("Deleted code is debugged code.", "Jeff Sickel", "programming"),
    ("Walking on water and developing software from a specification are easy if both are frozen.", "Edward V. Berard", "programming"),
    ("The best error message is the one that never shows up.", "Thomas Fuchs", "programming"),
    ("Make it work, make it right, make it fast.", "Kent Beck", "programming"),
    ("Simplicity is the soul of efficiency.", "Austin Freeman", "programming"),
    ("Programming isn't about what you know; it's about what you can figure out.", "Chris Pine", "programming"),
    ("The only way to go fast is to go well.", "Robert C. Martin", "programming"),
    ("Before software can be reusable it first has to be usable.", "Ralph Johnson", "programming"),
    ("Optimism is an occupational hazard of programming; feedback is the treatment.", "Kent Beck", "programming"),
    ("Measuring programming progress by lines of code is like measuring aircraft building progress by weight.", "Bill Gates", "programming"),
    ("Good code is its own best documentation.", "Steve McConnell", "programming"),
    ("The computer was born to solve problems that did not exist before.", "Bill Gates", "programming"),
    ("Software is a great combination between artistry and engineering.", "Bill Gates", "programming"),
    ("Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away.", "Antoine de Saint-Exupery", "programming"),
    ("A language that doesn't affect the way you think about programming is not worth knowing.", "Alan Perlis", "programming"),
    ("Controlling complexity is the essence of computer programming.", "Brian Kernighan", "programming"),
    ("If debugging is the process of removing bugs, then programming must be the process of putting them in.", "Edsger W. Dijkstra", "programming"),

    # -- humor --
    ("I would love to change the world, but they won't give me the source code.", "Anonymous", "humor"),
    ("There are 10 types of people in the world: those who understand binary, and those who don't.", "Anonymous", "humor"),
    ("A SQL query walks into a bar, walks up to two tables and asks, 'Can I join you?'", "Anonymous", "humor"),
    ("Why do programmers prefer dark mode? Because light attracts bugs.", "Anonymous", "humor"),
    ("99 little bugs in the code, 99 little bugs. Take one down, patch it around, 127 little bugs in the code.", "Anonymous", "humor"),
    ("A programmer's wife tells him: 'Go to the store and buy a loaf of bread. If they have eggs, buy a dozen.' He comes back with 12 loaves of bread.", "Anonymous", "humor"),
    ("Why did the developer go broke? Because he used up all his cache.", "Anonymous", "humor"),
    ("I'm not lazy, I'm just very selective about the things I feel like doing.", "Anonymous", "humor"),
    ("To err is human, to really foul things up requires a computer.", "Anonymous", "humor"),
    ("I told my computer I needed a break, and now it won't stop sending me KitKat ads.", "Anonymous", "humor"),
    ("Why do Java developers wear glasses? Because they don't C#.", "Anonymous", "humor"),
    ("There's no place like 127.0.0.1.", "Anonymous", "humor"),
    ("I've got a joke about UDP, but you might not get it.", "Anonymous", "humor"),
    ("How many programmers does it take to change a light bulb? None, that's a hardware problem.", "Anonymous", "humor"),
    ("Real programmers count from zero.", "Anonymous", "humor"),
    ("A byte walks into a bar looking miserable. The bartender asks what's wrong, and the byte says, 'Parity error.' The bartender says, 'Yeah, I thought you looked a bit off.'", "Anonymous", "humor"),
    ("My code doesn't work, I have no idea why. My code works, I have no idea why.", "Anonymous", "humor"),
    ("The generation of random numbers is too important to be left to chance.", "Robert R. Coveyou", "humor"),
    ("Documentation is like sex: when it's good, it's very good, and when it's bad, it's still better than nothing.", "Dick Brandon", "humor"),
    ("It works on my machine.", "Anonymous", "humor"),

    # -- wisdom --
    ("The unexamined life is not worth living.", "Socrates", "wisdom"),
    ("Knowing yourself is the beginning of all wisdom.", "Aristotle", "wisdom"),
    ("The only true wisdom is in knowing you know nothing.", "Socrates", "wisdom"),
    ("Turn your wounds into wisdom.", "Oprah Winfrey", "wisdom"),
    ("Yesterday is history, tomorrow is a mystery, today is a gift.", "Eleanor Roosevelt", "wisdom"),
    ("It is not the man who has too little, but the man who craves more, that is poor.", "Seneca", "wisdom"),
    ("We suffer more often in imagination than in reality.", "Seneca", "wisdom"),
    ("He who has a why to live can bear almost any how.", "Friedrich Nietzsche", "wisdom"),
    ("The only way to make sense out of change is to plunge into it, move with it, and join the dance.", "Alan Watts", "wisdom"),
    ("What you seek is seeking you.", "Rumi", "wisdom"),
    ("The wound is the place where the Light enters you.", "Rumi", "wisdom"),
    ("It does not matter how slowly you go as long as you do not stop.", "Confucius", "wisdom"),
    ("Our greatest glory is not in never falling, but in rising every time we fall.", "Confucius", "wisdom"),
    ("The journey of a thousand miles begins with a single step.", "Lao Tzu", "wisdom"),
    ("Knowing others is wisdom, knowing yourself is enlightenment.", "Lao Tzu", "wisdom"),
    ("Patience is bitter, but its fruit is sweet.", "Aristotle", "wisdom"),
    ("Well begun is half done.", "Aristotle", "wisdom"),
    ("The mind is everything. What you think you become.", "Buddha", "wisdom"),
    ("Peace comes from within. Do not seek it without.", "Buddha", "wisdom"),
    ("An eye for an eye will only make the whole world blind.", "Mahatma Gandhi", "wisdom"),
    ("Be the change that you wish to see in the world.", "Mahatma Gandhi", "wisdom"),
    ("Whatever you are, be a good one.", "Abraham Lincoln", "wisdom"),
    ("The best way to predict the future is to create it.", "Abraham Lincoln", "wisdom"),
    ("In the middle of difficulty lies opportunity.", "Albert Einstein", "wisdom"),
    ("A person who never made a mistake never tried anything new.", "Albert Einstein", "wisdom"),
    ("Life is what happens when you're busy making other plans.", "John Lennon", "wisdom"),
    ("The purpose of our lives is to be happy.", "Dalai Lama", "wisdom"),
    ("Happiness is not something ready made. It comes from your own actions.", "Dalai Lama", "wisdom"),
    ("To live is the rarest thing in the world. Most people exist, that is all.", "Oscar Wilde", "wisdom"),
    ("Be yourself; everyone else is already taken.", "Oscar Wilde", "wisdom"),

    # -- science --
    ("Somewhere, something incredible is waiting to be known.", "Carl Sagan", "science"),
    ("Extraordinary claims require extraordinary evidence.", "Carl Sagan", "science"),
    ("The nitrogen in our DNA, the calcium in our teeth, the iron in our blood... were made in the interiors of collapsing stars.", "Carl Sagan", "science"),
    ("Science is not only compatible with spirituality; it is a profound source of spirituality.", "Carl Sagan", "science"),
    ("The good thing about science is that it's true whether or not you believe in it.", "Neil deGrasse Tyson", "science"),
    ("Not only is the universe stranger than we think, it is stranger than we can think.", "Werner Heisenberg", "science"),
    ("Physics is like sex: sure, it may give some practical results, but that's not why we do it.", "Richard Feynman", "science"),
    ("The first principle is that you must not fool yourself, and you are the easiest person to fool.", "Richard Feynman", "science"),
    ("I would rather have questions that can't be answered than answers that can't be questioned.", "Richard Feynman", "science"),
    ("Science is a way of thinking much more than it is a body of knowledge.", "Carl Sagan", "science"),
    ("Nothing in life is to be feared, it is only to be understood.", "Marie Curie", "science"),
    ("I was taught that the way of progress was neither swift nor easy.", "Marie Curie", "science"),
    ("Research is what I'm doing when I don't know what I'm doing.", "Wernher von Braun", "science"),
    ("Equipped with his five senses, man explores the universe around him and calls the adventure Science.", "Edwin Hubble", "science"),
    ("An expert is a person who has made all the mistakes that can be made in a very narrow field.", "Niels Bohr", "science"),
    ("Prediction is very difficult, especially if it's about the future.", "Niels Bohr", "science"),
    ("The whole of science is nothing more than a refinement of everyday thinking.", "Albert Einstein", "science"),
    ("Imagination is more important than knowledge.", "Albert Einstein", "science"),
    ("Science knows no country, because knowledge belongs to humanity.", "Louis Pasteur", "science"),
    ("Chance favors the prepared mind.", "Louis Pasteur", "science"),
    ("In science, there is only physics; all the rest is stamp collecting.", "Ernest Rutherford", "science"),
    ("The scientist is not the person who gives the right answers, he's the one who asks the right questions.", "Claude Levi-Strauss", "science"),
    ("Somewhere, something incredible is waiting to be known -- that curiosity is science's real engine.", "Carl Sagan", "science"),
    ("We are a way for the cosmos to know itself.", "Carl Sagan", "science"),
    ("If I have seen further it is by standing on the shoulders of giants.", "Isaac Newton", "science"),

    # -- life --
    ("In the end, it's not the years in your life that count. It's the life in your years.", "Abraham Lincoln", "life"),
    ("Life is really simple, but we insist on making it complicated.", "Confucius", "life"),
    ("The purpose of our lives is to add value to the people around us.", "John C. Maxwell", "life"),
    ("Get busy living, or get busy dying.", "Stephen King", "life"),
    ("You only live once, but if you do it right, once is enough.", "Mae West", "life"),
    ("Many of life's failures are people who did not realize how close they were to success when they gave up.", "Thomas Edison", "life"),
    ("If you want to live a happy life, tie it to a goal, not to people or things.", "Albert Einstein", "life"),
    ("Life is 10% what happens to you and 90% how you react to it.", "Charles R. Swindoll", "life"),
    ("The two most important days in your life are the day you are born and the day you find out why.", "Mark Twain", "life"),
    ("Twenty years from now you will be more disappointed by the things you didn't do than by the ones you did.", "Mark Twain", "life"),
    ("Do not go where the path may lead, go instead where there is no path and leave a trail.", "Ralph Waldo Emerson", "life"),
    ("What lies behind us and what lies before us are tiny matters compared to what lies within us.", "Ralph Waldo Emerson", "life"),
    ("Life is not measured by the number of breaths we take, but by the moments that take our breath away.", "Maya Angelou", "life"),
    ("I've learned that people will forget what you said, but people will never forget how you made them feel.", "Maya Angelou", "life"),
    ("The unexamined life is not worth living, but the overexamined life leaves no time for actually living it.", "Anonymous", "life"),
    ("Success is not final, failure is not fatal: it is the courage to continue that counts.", "Winston Churchill", "life"),
    ("The pessimist sees difficulty in every opportunity. The optimist sees opportunity in every difficulty.", "Winston Churchill", "life"),
    ("Keep your face always toward the sunshine, and shadows will fall behind you.", "Walt Whitman", "life"),
    ("Every strike brings me closer to the next home run.", "Babe Ruth", "life"),
    ("The road to success and the road to failure are almost exactly the same road.", "Colin R. Davis", "life"),
    ("Nothing in the world is worth having or worth doing unless it means effort, pain, difficulty.", "Theodore Roosevelt", "life"),
    ("Believe you can and you're halfway there.", "Theodore Roosevelt", "life"),
    ("It is during our darkest moments that we must focus to see the light.", "Aristotle", "life"),
    ("You must be the change you wish to see in the world.", "Mahatma Gandhi", "life"),
    ("Life shrinks or expands in proportion to one's courage.", "Anais Nin", "life"),
]

QUOTES: list[dict] = [
    {"id": index, "text": text, "author": author, "category": category}
    for index, (text, author, category) in enumerate(_RAW_QUOTES, start=1)
]

CATEGORIES: list[str] = sorted({quote["category"] for quote in QUOTES})
