from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List
import os
import shutil
from datetime import datetime
import json

from ..services.ocr_service import OCRService
from ..models.invoice import Invoice, LineItem
from ..database import get_db, engine
from ..models.invoice import Base

# Create tables
Base.metadata.create_all(bind=engine)

router = APIRouter()
ocr_service = OCRService()


@router.post("/upload-invoice")
async def upload_invoice(
        file: UploadFile = File(...),
        db: Session = Depends(get_db)
):
    """Upload and process invoice"""

    # Validate file type
    if not file.content_type.startswith('image/') and file.content_type != 'application/pdf':
        raise HTTPException(status_code=400, detail="Only image and PDF files are allowed")

    # Save uploaded file
    upload_dir = os.getenv("UPLOAD_DIR", "./uploads")
    os.makedirs(upload_dir, exist_ok=True)

    file_path = os.path.join(upload_dir, file.filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Extract text using both methods
        tesseract_text = ocr_service.extract_text_tesseract(file_path)
        openai_text = await ocr_service.extract_text_openai_vision(file_path)

        # Use the better result (or combine them)
        raw_text = openai_text if len(openai_text) > len(tesseract_text) else tesseract_text

        # Process with OpenAI
        processed_data = await ocr_service.process_invoice_data(raw_text)

        # Save to database
        invoice = Invoice(
            filename=file.filename,
            vendor_name=processed_data.get("vendor_name"),
            invoice_number=processed_data.get("invoice_number"),
            invoice_date=datetime.strptime(processed_data.get("invoice_date"), "%Y-%m-%d") if processed_data.get(
                "invoice_date") else None,
            due_date=datetime.strptime(processed_data.get("due_date"), "%Y-%m-%d") if processed_data.get(
                "due_date") else None,
            total_amount=processed_data.get("total_amount"),
            tax_amount=processed_data.get("tax_amount"),
            currency=processed_data.get("currency", "USD"),
            raw_text=raw_text,
            processed_data=json.dumps(processed_data),
            confidence_score=processed_data.get("confidence_score", 0.0)
        )

        db.add(invoice)
        db.commit()
        db.refresh(invoice)

        # Save line items
        for item_data in processed_data.get("line_items", []):
            line_item = LineItem(
                invoice_id=invoice.id,
                description=item_data.get("description"),
                quantity=item_data.get("quantity"),
                unit_price=item_data.get("unit_price"),
                total_price=item_data.get("total_price")
            )
            db.add(line_item)

        db.commit()

        return JSONResponse(content={
            "message": "Invoice processed successfully",
            "invoice_id": invoice.id,
            "processed_data": processed_data
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

    finally:
        # Clean up uploaded file
        if os.path.exists(file_path):
            os.remove(file_path)


@router.get("/invoices")
async def get_invoices(db: Session = Depends(get_db)):
    """Get all invoices"""
    invoices = db.query(Invoice).all()
    return invoices


@router.get("/invoices/{invoice_id}")
async def get_invoice(invoice_id: int, db: Session = Depends(get_db)):
    """Get specific invoice with line items"""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    line_items = db.query(LineItem).filter(LineItem.invoice_id == invoice_id).all()

    return {
        "invoice": invoice,
        "line_items": line_items
    }


@router.put("/invoices/{invoice_id}/approve")
async def approve_invoice(invoice_id: int, db: Session = Depends(get_db)):
    """Approve an invoice"""
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    invoice.status = "approved"
    invoice.updated_at = datetime.utcnow()
    db.commit()

    return {"message": "Invoice approved successfully"}