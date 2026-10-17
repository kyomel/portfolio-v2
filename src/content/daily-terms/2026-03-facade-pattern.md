---
title: "Facade Pattern"
termSlug: "facade-pattern"
year: 2026
month: 3
monthName: "March"
day: 26
order: 19
source: "2026/mar-term.md"
sourceUrl: "https://github.com/swegrowthid/daily-term-SE-Growth/blob/main/2026/mar-term.md"
excerpt: "The Facade Pattern is a structural software design pattern that provides a simplified, unified interface to a complex subsystem — hiding the internal complexity of multiple classes, libraries, or A..."
---
### Definition:
The Facade Pattern is a structural software design pattern that provides a simplified, unified interface to a complex subsystem — hiding the internal complexity of multiple classes, libraries, or APIs behind a single, clean entry point that clients interact with instead of the messy details underneath.

The Facade Pattern does not add new functionality — it reorganizes access to existing functionality, making a complex system feel simple from the outside.

— refactoring.guru

The Core Idea in One Sentence

Without Facade:  Client talks to 7 complex subsystems directly
With Facade:     Client talks to 1 simple interface
                 Facade talks to the 7 complex subsystems

### Example:
E-Commerce Order Placement
A more practical, modern example — placing an order in an e-commerce system:

```
from dataclasses import dataclass
from typing import Optional

@dataclass
class OrderResult:
    success:       bool
    order_id:      Optional[str]
    tracking_code: Optional[str]
    total:         Optional[float]
    message:       str

class OrderFacade:
    """
    Facade: one simple interface for placing an order.
    Client doesn't need to know about inventory, payments,
    shipping, notifications, or database — just this class.
    """

    def __init__(self):
        # Facade owns and manages all subsystems
        self.inventory     = InventoryService()
        self.payment       = PaymentService()
        self.shipping      = ShippingService()
        self.notifications = NotificationService()
        self.orders        = OrderRepository()

    def place_order(
        self,
        user_id:    str,
        email:      str,
        phone:      str,
        product_id: str,
        quantity:   int,
        card_token: str,
        address:    dict
    ) -> OrderResult:
        """
        Client calls THIS ONE METHOD.
        Facade orchestrates 5 subsystems internally.
        """

        reservation_id  = None
        transaction_id  = None

        try:
            # Step 1: Check inventory
            if not self.inventory.check_stock(product_id, quantity):
                return OrderResult(
                    success=False, order_id=None,
                    tracking_code=None, total=None,
                    message="Sorry, item is out of stock"
                )

            # Step 2: Reserve items (hold stock)
            reservation_id = self.inventory.reserve_items(
                product_id, quantity
            )

            # Step 3: Calculate total
            item_price  = 49.99 * quantity
            shipping    = self.shipping.calculate_shipping(address, 1.2)
            total       = item_price + shipping

            # Step 4: Validate and charge payment
            if not self.payment.validate_card(card_token):
                self.inventory.release_reservation(reservation_id)
                return OrderResult(
                    success=False, order_id=None,
                    tracking_code=None, total=None,
                    message="Payment validation failed"
                )

            transaction_id = self.payment.charge(
                card_token, total, "USD"
            )

            # Step 5: Create order record
            order_id = self.orders.create({
                "user_id":      user_id,
                "product_id":   product_id,
                "quantity":     quantity,
                "total":        total,
                "address":      address,
                "payment_tx":   transaction_id
            })

            # Step 6: Create shipment
            tracking_code = self.shipping.create_shipment(
                order_id, address
            )
            delivery_date = self.shipping.get_estimated_delivery(address)

            # Step 7: Update order status
            self.orders.update_status(order_id, "CONFIRMED")

            # Step 8: Notify customer (all channels)
            self.notifications.send_email(email, "order_confirmed", {
                "order_id":     order_id,
                "total":        total,
                "tracking":     tracking_code,
                "delivery":     delivery_date
            })
            self.notifications.send_sms(
                phone,
                f"Order {order_id} confirmed! Track: {tracking_code}"
            )
            self.notifications.send_push(
                user_id,
                f"Your order is confirmed! Arriving in {delivery_date}"
            )

            return OrderResult(
                success       = True,
                order_id      = order_id,
                tracking_code = tracking_code,
                total         = total,
                message       = f"Order placed! Arriving {delivery_date}"
            )

        except Exception as e:
            # Facade also handles rollback — client doesn't worry about this
            if transaction_id:
                self.payment.refund(transaction_id)
            if reservation_id:
                self.inventory.release_reservation(reservation_id)

            return OrderResult(
                success=False, order_id=None,
                tracking_code=None, total=None,
                message=f"Order failed: {str(e)}"
            )
```
