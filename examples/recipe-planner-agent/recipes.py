"""A small, local "recipe database" — the structured data the agent is
grounded in, instead of letting it hallucinate recipes from its training
data. See docs/projects/recipe-planner-agent/index.md for the walkthrough
this file accompanies.

Each recipe is a plain dict: a name, its ingredient list (lowercase, no
quantities — just what's needed), and short instructions. Real projects
would load this from a file or a real database; a Python list of dicts is
enough to demonstrate the pattern without extra machinery.
"""

RECIPES = [
    {
        "name": "Tomato Egg Stir-Fry",
        "ingredients": ["eggs", "tomatoes", "garlic", "salt", "oil"],
        "instructions": "Scramble the eggs, set aside. Saute garlic and chopped tomatoes "
        "until soft, stir the eggs back in, season with salt.",
    },
    {
        "name": "Garlic Butter Pasta",
        "ingredients": ["pasta", "butter", "garlic", "parmesan", "salt"],
        "instructions": "Boil the pasta. Melt butter with minced garlic, toss the pasta in "
        "it, top with grated parmesan and salt.",
    },
    {
        "name": "Classic Grilled Cheese",
        "ingredients": ["bread", "cheese", "butter"],
        "instructions": "Butter one side of each bread slice, add cheese between the "
        "unbuttered sides, grill in a pan until golden on both sides.",
    },
    {
        "name": "Simple Fried Rice",
        "ingredients": ["rice", "eggs", "soy sauce", "onion", "oil"],
        "instructions": "Scramble the eggs and set aside. Fry chopped onion in oil, add "
        "cooked rice, stir in soy sauce and the eggs.",
    },
    {
        "name": "Chickpea Salad",
        "ingredients": ["chickpeas", "cucumber", "tomatoes", "olive oil", "lemon", "salt"],
        "instructions": "Drain the chickpeas, dice the cucumber and tomatoes, toss "
        "everything with olive oil, lemon juice, and salt.",
    },
    {
        "name": "Peanut Butter Banana Toast",
        "ingredients": ["bread", "peanut butter", "banana"],
        "instructions": "Toast the bread, spread peanut butter, top with sliced banana.",
    },
    {
        "name": "Basic Vegetable Soup",
        "ingredients": ["carrots", "onion", "celery", "vegetable broth", "salt"],
        "instructions": "Saute chopped carrots, onion, and celery, add vegetable broth, "
        "simmer 15 minutes, season with salt.",
    },
    {
        "name": "Tuna Sandwich",
        "ingredients": ["bread", "tuna", "mayonnaise", "onion"],
        "instructions": "Mix drained tuna with mayonnaise and finely chopped onion, spread "
        "between bread slices.",
    },
    {
        "name": "Honey Mustard Chicken",
        "ingredients": ["chicken breast", "honey", "mustard", "salt", "oil"],
        "instructions": "Mix honey and mustard, coat the chicken breast, season with salt, "
        "pan-fry in oil until cooked through.",
    },
    {
        "name": "Guacamole",
        "ingredients": ["avocado", "lime", "onion", "tomatoes", "salt"],
        "instructions": "Mash the avocado, stir in lime juice, finely chopped onion and "
        "tomatoes, season with salt.",
    },
    {
        "name": "Oatmeal with Banana",
        "ingredients": ["oats", "milk", "banana", "honey"],
        "instructions": "Simmer oats in milk until thick, top with sliced banana and a "
        "drizzle of honey.",
    },
    {
        "name": "Caprese Salad",
        "ingredients": ["tomatoes", "mozzarella", "basil", "olive oil", "salt"],
        "instructions": "Slice tomatoes and mozzarella, layer with basil leaves, drizzle "
        "with olive oil, season with salt.",
    },
    {
        "name": "Black Bean Tacos",
        "ingredients": ["tortillas", "black beans", "onion", "lime", "salt"],
        "instructions": "Warm the black beans with chopped onion and salt, spoon into "
        "tortillas, finish with a squeeze of lime.",
    },
]
