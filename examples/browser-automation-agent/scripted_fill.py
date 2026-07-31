"""
Step 1: a hand-written, hardcoded Playwright script -- no LLM involved.

Fills out the well-known httpbin.org "pizza order" practice form
(https://httpbin.org/forms/post) with one fixed set of values and submits it.

Run with:
    uv run python scripted_fill.py

This works, but notice how brittle it is: every field name, every selector,
and every value is spelled out by hand, in exactly the right order. Change
the form (rename a field, add a required one) and this script breaks with no
warning -- it has no idea what it's looking at, it's just replaying clicks.
That brittleness is the whole motivation for Step 2 onward: give an LLM the
same *capabilities* (read the page, fill a field, click) as tools, and let it
figure out which field is which instead of you hardcoding it.
"""

from playwright.sync_api import sync_playwright

FORM_URL = "https://httpbin.org/forms/post"

# The values we want in the form -- hardcoded, in the exact shape this one
# form happens to expect.
ORDER = {
    "custname": "Ada Lovelace",
    "custtel": "555-0100",
    "custemail": "ada@example.com",
    "size": "medium",  # radio: small / medium / large
    "topping": ["bacon", "cheese"],  # checkboxes, can pick several
    "delivery": "18:30",  # <input type="time">
    "comments": "Please ring the bell twice.",
}


def main() -> None:
    with sync_playwright() as p:
        # headless=False pops up a real, visible browser window -- useful
        # while writing/debugging a script. Flip to True (the default) once
        # you trust it, especially for CI or a headless server.
        browser = p.chromium.launch(headless=False, slow_mo=250)
        page = browser.new_page()

        page.goto(FORM_URL)

        page.fill('input[name="custname"]', ORDER["custname"])
        page.fill('input[name="custtel"]', ORDER["custtel"])
        page.fill('input[name="custemail"]', ORDER["custemail"])

        # Radio buttons: click the one whose value matches.
        page.check(f'input[name="size"][value="{ORDER["size"]}"]')

        # Checkboxes: one click per topping we want selected.
        for topping in ORDER["topping"]:
            page.check(f'input[name="topping"][value="{topping}"]')

        page.fill('input[name="delivery"]', ORDER["delivery"])
        page.fill('textarea[name="comments"]', ORDER["comments"])

        page.click('button[type="submit"]')

        # httpbin echoes the submitted form back as JSON on the result page.
        page.wait_for_selector("pre")
        print(page.locator("pre").inner_text())

        browser.close()


if __name__ == "__main__":
    main()
