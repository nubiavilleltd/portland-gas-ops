from __future__ import annotations
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from typing import Optional, List, Tuple
from app.orders.model import Order, OrderItem
from app.orders.enums import OrderStatus, FulfillmentStatus
from app.payments.enums import PaymentStatus


class OrderRepository:

    def get_by_id(self, db: Session, order_id: str) -> Optional[Order]:
        return (
            db.query(Order)
            .options(joinedload(Order.order_items), joinedload(Order.customer))
            .filter(Order.id == order_id)
            .first()
        )

    def get_by_no(self, db: Session, order_no: str) -> Optional[Order]:
        return (
            db.query(Order)
            .options(joinedload(Order.order_items), joinedload(Order.customer))
            .filter(Order.order_no == order_no)
            .first()
        )

    def list(
        self,
        db:                 Session,
        search:             Optional[str]              = None,
        order_status:       Optional[OrderStatus]              = None,
        fulfillment_status: Optional[FulfillmentStatus]              = None,
        payment_status:     Optional[PaymentStatus]              = None,
        customer_id:        Optional[str]              = None,
        page:               int = 1,
        page_size:          int = 50,
    ) -> Tuple[List[Order], int]:
        from app.customers.model import Customer
        q = (
            db.query(Order)
            .options(joinedload(Order.order_items), joinedload(Order.customer))
            .join(Order.customer)
        )
        if search:
            term = f"%{search.strip()}%"
            q = q.filter(
                or_(
                    Order.order_no.ilike(term),
                    Order.delivery_address.ilike(term),
                    Customer.name.ilike(term),
                )
            )
        if order_status:
            q = q.filter(Order.order_status == order_status)
        if fulfillment_status:
            q = q.filter(Order.fulfillment_status == fulfillment_status)
        if payment_status:
            q = q.filter(Order.payment_status == payment_status)
        if customer_id:
            q = q.filter(Order.customer_id == customer_id)

        total = q.with_entities(func.count(Order.id)).scalar() or 0
        items = q.order_by(Order.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
        return items, total

    def create(self, db: Session, **fields) -> Order:
        order = Order(**{k: v for k, v in fields.items() if k != "order_items"})
        db.add(order)
        db.flush()
        return order

    def create_items(self, db: Session, order_id: str, items: list) -> List[OrderItem]:
        created = []
        for item in items:
            oi = OrderItem(
                order_id     = order_id,
                product_id   = item["product_id"],
                product_name = item["product_name"],
                quantity     = item["quantity"],
                unit_price   = item["unit_price"],
                total        = item["total"],
            )
            db.add(oi)
            created.append(oi)
        db.flush()
        return created

    def replace_items(self, db: Session, order_id: str, items: list) -> None:
        db.query(OrderItem).filter(OrderItem.order_id == order_id).delete()
        db.flush()
        self.create_items(db, order_id, items)

    def update(self, db: Session, order: Order, **fields) -> Order:
        for key, value in fields.items():
            setattr(order, key, value)
        db.flush()
        return order