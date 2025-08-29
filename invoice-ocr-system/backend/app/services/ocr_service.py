import pytesseract
import cv2
import numpy as np
from PIL import Image
from openai import OpenAI  # Updated import
import json
from typing import Dict, Any, Optional
import os
from dotenv import load_dotenv

load_dotenv()


class OCRService:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))  # Updated initialization

    def preprocess_image(self, image_path: str) -> np.ndarray:
        """Enhance image quality for better OCR results"""
        image = cv2.imread(image_path)

        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Apply denoising
        denoised = cv2.fastNlMeansDenoising(gray)

        # Apply adaptive threshold
        thresh = cv2.adaptiveThreshold(
            denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY, 11, 2
        )

        return thresh

    def extract_text_tesseract(self, image_path: str) -> str:
        """Extract text using Tesseract OCR"""
        try:
            # Preprocess image
            processed_image = self.preprocess_image(image_path)

            # Configure Tesseract
            custom_config = r'--oem 3 --psm 6'

            # Extract text
            text = pytesseract.image_to_string(processed_image, config=custom_config)
            return text.strip()

        except Exception as e:
            print(f"Tesseract OCR error: {e}")
            return ""

    async def extract_text_openai_vision(self, image_path: str) -> str:
        """Extract text using OpenAI Vision API"""
        try:
            with open(image_path, "rb") as image_file:
                # Convert image to base64
                import base64
                base64_image = base64.b64encode(image_file.read()).decode('utf-8')

            response = self.client.chat.completions.create(  # Updated API call
                model="gpt-4-vision-preview",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Extract all text from this invoice image. Maintain the original structure and formatting."
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=1000
            )

            return response.choices[0].message.content

        except Exception as e:
            print(f"OpenAI Vision error: {e}")
            return ""

    async def process_invoice_data(self, raw_text: str) -> Dict[str, Any]:
        """Use OpenAI to structure and validate extracted text"""

        prompt = f"""
        Analyze the following invoice text and extract structured information. 
        Return ONLY a valid JSON object with these exact fields:

        {{
            "vendor_name": "string",
            "invoice_number": "string", 
            "invoice_date": "YYYY-MM-DD",
            "due_date": "YYYY-MM-DD",
            "total_amount": number,
            "tax_amount": number,
            "currency": "string",
            "line_items": [
                {{
                    "description": "string",
                    "quantity": number,
                    "unit_price": number,
                    "total_price": number
                }}
            ],
            "confidence_score": 0.95,
            "validation_notes": "string"
        }}

        Invoice text:
        {raw_text}

        Important: Return ONLY the JSON object, no other text or explanation.
        If any information is unclear or missing, set the value to null.
        """

        try:
            response = self.client.chat.completions.create(  # Updated API call
                model="gpt-4",
                messages=[
                    {"role": "system",
                     "content": "You are an expert invoice processing AI. Always return valid JSON only, no additional text."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1
            )

            # Get the response content
            content = response.choices[0].message.content.strip()

            # Try to parse the JSON
            result = json.loads(content)
            return result

        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            print(f"Response content: {content}")
            return {
                "error": f"Failed to parse JSON response: {str(e)}",
                "raw_response": content
            }
        except Exception as e:
            print(f"OpenAI processing error: {e}")
            return {"error": str(e)}