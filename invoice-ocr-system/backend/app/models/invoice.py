from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    vendor_name = Column(String)
    invoice_number = Column(String, index=True)
    invoice_date = Column(DateTime)
    due_date = Column(DateTime)
    total_amount = Column(Float)
    tax_amount = Column(Float)
    currency = Column(String, default="USD")
    status = Column(String, default="pending")  # pending, approved, rejected
    raw_text = Column(Text)
    processed_data = Column(Text)  # JSON string
    confidence_score = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)


class LineItem(Base):
    __tablename__ = "line_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer)
    description = Column(String)
    quantity = Column(Float)
    unit_price = Column(Float)
    total_price = Column(Float)
    tax_rate = Column(Float)