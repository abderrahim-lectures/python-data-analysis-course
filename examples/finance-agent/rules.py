"""Rule-based baseline categorizer.

A dict of keyword -> category, matched case-insensitively against a bank
transaction's description. This is deliberately simple and deliberately
limited -- see docs/projects/finance-agent/index.md Step 2 for the point
this makes: keyword rules cover the *obvious* merchants quickly, but real
bank exports are full of payment-processor prefixes (`SQ *`, `TST*`,
`PAYPAL *`, `AMZN MKTP US*...`) and person-to-person transfers (Venmo) that
no fixed keyword list can fully anticipate. That gap is what Step 3's LLM
agent exists to close.
"""

# Ordered roughly most-specific-first; the first matching keyword wins.
RULES: dict[str, str] = {
    "payroll direct deposit": "Income",
    "freelance bonus": "Income",
    "rent": "Housing",
    "trader joes": "Groceries",
    "whole foods": "Groceries",
    "safeway": "Groceries",
    "costco whse": "Groceries",
    "starbucks": "Dining",
    "chipotle": "Dining",
    "mcdonalds": "Dining",
    "doordash": "Dining",
    "uber eats": "Dining",
    "uber trip": "Transport",
    "lyft": "Transport",
    "shell oil": "Transport",
    "chevron": "Transport",
    "bart clipper": "Transport",
    "pacific gas electric": "Utilities",
    "comcast xfinity": "Utilities",
    "city water util": "Utilities",
    "netflix.com": "Subscriptions",
    "spotify": "Subscriptions",
    "amc theatres": "Entertainment",
    "steam games": "Entertainment",
    "ticketmaster": "Entertainment",
    "target": "Shopping",
    "amazon.com": "Shopping",
    "best buy": "Shopping",
    "ikea": "Shopping",
    "cvs pharmacy": "Healthcare",
    "walgreens": "Healthcare",
    "kaiser permanente": "Healthcare",
    "delta air lines": "Travel",
    "marriott hotels": "Travel",
    "airbnb": "Travel",
    "overdraft fee": "Fees",
    "atm withdrawal fee": "Fees",
    "monthly maintenance fee": "Fees",
}


def categorize_rule_based(description: str) -> str | None:
    """Return a category for `description` using keyword matching, or None if no rule matches.

    None is the honest answer for anything a payment-processor prefix or
    a peer-to-peer transfer obscures -- e.g. "SQ *JOES COFFEE CART" doesn't
    contain any keyword above, even though a human would recognize it as a
    coffee shop in about half a second. Returning None (instead of guessing)
    is what lets Step 3 tell the difference between "confidently categorized"
    and "needs a smarter look."
    """
    text = description.lower()
    for keyword, category in RULES.items():
        if keyword in text:
            return category
    return None
