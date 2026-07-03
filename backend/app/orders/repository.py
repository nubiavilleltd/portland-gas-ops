from __future__ import annotations

from typing import List, Mapping, Optional, Tuple

from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.orders.enums import FulfillmentStatus, OrderStatus
from app.orders.model import Order, OrderItem
from app.payments.enums import PaymentStatus
from app.shared.utils.number_generator import generate_entity_no


class OrderRepository:
    def generate_order_no(self, db: Session) -> str:
        return generate_entity_no(db, Order, "order_no", "ORD")

    def get_by_id(self, db: Session, order_id: str) -> Optional[Order]:
        return (
            db.query(Order)
            .options(joinedload(Order.order_items))
            .filter(Order.id == order_id)
            .first()
        )

    def get_by_no(self, db: Session, order_no: str) -> Optional[Order]:
        return (
            db.query(Order)
            .options(joinedload(Order.order_items))
            .filter(Order.order_no == order_no)
            .first()
        )

    def list(
        self,
        db: Session,
        search: Optional[str] = None,
        order_status: Optional[OrderStatus] = None,
        fulfillment_status: Optional[FulfillmentStatus] = None,
        payment_status: Optional[PaymentStatus] = None,
        customer_id: Optional[str] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> Tuple[List[Order], int]:

        query = (
            db.query(Order)
            .options(joinedload(Order.order_items))
        )

        if search:
            term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Order.order_no.ilike(term),
                    Order.customer_name.ilike(term),
                    Order.delivery_address.ilike(term),
                )
            )

        if order_status:
            query = query.filter(Order.order_status == order_status)

        if fulfillment_status:
            query = query.filter(
                Order.fulfillment_status == fulfillment_status
            )

        if payment_status:
            query = query.filter(
                Order.payment_status == payment_status
            )

        if customer_id:
            query = query.filter(Order.customer_id == customer_id)

        total = query.with_entities(func.count(Order.id)).scalar() or 0

        items = (
            query.order_by(Order.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
            .all()
        )

        return items, total

    def create(self, db: Session, **fields) -> Order:
        order = Order(
            **{k: v for k, v in fields.items() if k != "order_items"}
        )
        db.add(order)
        db.flush()
        return order

    def create_items(
        self,
        db: Session,
        order_id: str,
        items: List[Mapping[str, object]],
    ) -> List[OrderItem]:

        created: List[OrderItem] = []

        for item in items:
            order_item = OrderItem(
                order_id=order_id,
                product_id=item["product_id"],
                product_name=item["product_name"],  # snapshot
                quantity=item["quantity"],
                unit_price=item["unit_price"],      # snapshot
                total=item["total"],
            )

            db.add(order_item)
            created.append(order_item)

        db.flush()

        return created

    def replace_items(
        self,
        db: Session,
        order_id: str,
        items: List[Mapping[str, object]],
    ) -> None:

        (
            db.query(OrderItem)
            .filter(OrderItem.order_id == order_id)
            .delete()
        )

        db.flush()

        self.create_items(db, order_id, items)

    def update(
        self,
        db: Session,
        order: Order,
        **fields,
    ) -> Order:

        for key, value in fields.items():
            setattr(order, key, value)

        db.flush()

        return order