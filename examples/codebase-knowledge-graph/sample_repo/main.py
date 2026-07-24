"""Entry point: builds a couple of sample orders and prints their totals."""

from models import Order
from utils import Formatter


def print_order_summary(order):
    """Prints a formatted one-line summary of an order's total."""
    formatter = Formatter()
    print(f"Total: {formatter.format(order.total())}")


def main():
    """Builds two sample orders and prints their summaries."""
    order1 = Order(3, 19.99)
    order2 = Order(1, 499.00)
    print_order_summary(order1)
    print_order_summary(order2)


if __name__ == "__main__":
    main()
