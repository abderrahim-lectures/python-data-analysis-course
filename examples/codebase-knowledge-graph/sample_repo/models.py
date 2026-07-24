"""Defines a simple Order model that leans on utils.py for its math."""

import utils


class Order:
    """Represents a customer order: a quantity of one item at a unit price."""

    def __init__(self, quantity, unit_price):
        self.quantity = quantity
        self.unit_price = unit_price

    def total(self):
        """Total price for this order, before tax."""
        return utils.multiply(self.quantity, self.unit_price)

    def total_with_tax(self, tax_rate):
        """Total price including tax, built on top of total()."""
        tax = utils.multiply(self.total(), tax_rate)
        return utils.add(self.total(), tax)
