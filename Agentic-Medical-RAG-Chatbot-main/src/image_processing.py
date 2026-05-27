"""
MediScan - Image Processing Module
==================================
Image compression and optimization for faster processing.

Features:
- Automatic image compression
- Format conversion
- Size validation
- Quality optimization
"""

import os
import io
from pathlib import Path
from typing import Optional, Tuple
import logging

from PIL import Image

logger = logging.getLogger(__name__)

# ============================================================================
# CONFIGURATION
# ============================================================================

# Maximum dimensions (will resize if larger)
MAX_WIDTH = 2000
MAX_HEIGHT = 2000

# Maximum file size in bytes (5MB)
MAX_FILE_SIZE = 5 * 1024 * 1024

# Compression quality (1-100)
JPEG_QUALITY = 85
PNG_COMPRESSION = 6

# Target formats
PREFERRED_FORMAT = "JPEG"

# ============================================================================
# IMAGE PROCESSOR CLASS
# ============================================================================

class ImageProcessor:
    """Process and optimize images for medical analysis."""
    
    def __init__(
        self,
        max_width: int = MAX_WIDTH,
        max_height: int = MAX_HEIGHT,
        max_file_size: int = MAX_FILE_SIZE,
        jpeg_quality: int = JPEG_QUALITY
    ):
        self.max_width = max_width
        self.max_height = max_height
        self.max_file_size = max_file_size
        self.jpeg_quality = jpeg_quality
    
    def get_image_info(self, image_path: str) -> dict:
        """Get information about an image."""
        try:
            path = Path(image_path)
            file_size = path.stat().st_size
            
            with Image.open(image_path) as img:
                return {
                    "path": str(path),
                    "format": img.format,
                    "mode": img.mode,
                    "width": img.width,
                    "height": img.height,
                    "file_size": file_size,
                    "file_size_mb": round(file_size / (1024 * 1024), 2)
                }
        except Exception as e:
            logger.error(f"Error getting image info: {e}")
            return {"error": str(e)}
    
    def needs_compression(self, image_path: str) -> Tuple[bool, dict]:
        """
        Check if image needs compression.
        
        Returns:
            (needs_compression: bool, reason: dict)
        """
        info = self.get_image_info(image_path)
        
        if "error" in info:
            return False, info
        
        reasons = []
        
        # Check file size
        if info["file_size"] > self.max_file_size:
            reasons.append(f"File size ({info['file_size_mb']}MB) exceeds {self.max_file_size / (1024*1024)}MB")
        
        # Check dimensions
        if info["width"] > self.max_width:
            reasons.append(f"Width ({info['width']}px) exceeds {self.max_width}px")
        
        if info["height"] > self.max_height:
            reasons.append(f"Height ({info['height']}px) exceeds {self.max_height}px")
        
        return len(reasons) > 0, {
            "needs_compression": len(reasons) > 0,
            "reasons": reasons,
            "original_info": info
        }
    
    def compress_image(
        self,
        image_path: str,
        output_path: Optional[str] = None,
        quality: Optional[int] = None,
        max_width: Optional[int] = None,
        max_height: Optional[int] = None
    ) -> dict:
        """
        Compress and optimize an image.
        
        Args:
            image_path: Path to input image
            output_path: Path for output (defaults to overwriting input)
            quality: JPEG quality (1-100)
            max_width: Maximum width in pixels
            max_height: Maximum height in pixels
        
        Returns:
            dict with original and new file info
        """
        try:
            input_path = Path(image_path)
            output_path = Path(output_path) if output_path else input_path
            
            quality = quality or self.jpeg_quality
            max_width = max_width or self.max_width
            max_height = max_height or self.max_height
            
            # Get original info
            original_size = input_path.stat().st_size
            
            with Image.open(input_path) as img:
                original_width = img.width
                original_height = img.height
                original_format = img.format or "UNKNOWN"
                
                # Convert RGBA to RGB if saving as JPEG
                if img.mode in ('RGBA', 'LA', 'P'):
                    # Create white background
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = background
                elif img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Resize if needed
                resized = False
                if img.width > max_width or img.height > max_height:
                    # Calculate new size maintaining aspect ratio
                    ratio = min(max_width / img.width, max_height / img.height)
                    new_size = (int(img.width * ratio), int(img.height * ratio))
                    img = img.resize(new_size, Image.Resampling.LANCZOS)
                    resized = True
                
                # Determine output format
                output_ext = output_path.suffix.lower()
                if output_ext in ['.jpg', '.jpeg']:
                    save_format = 'JPEG'
                    save_params = {'quality': quality, 'optimize': True}
                elif output_ext == '.png':
                    save_format = 'PNG'
                    save_params = {'compress_level': PNG_COMPRESSION, 'optimize': True}
                elif output_ext == '.webp':
                    save_format = 'WEBP'
                    save_params = {'quality': quality, 'method': 4}
                else:
                    # Default to JPEG
                    output_path = output_path.with_suffix('.jpg')
                    save_format = 'JPEG'
                    save_params = {'quality': quality, 'optimize': True}
                
                # Save compressed image
                img.save(output_path, save_format, **save_params)
            
            # Get new file info
            new_size = output_path.stat().st_size
            
            with Image.open(output_path) as new_img:
                new_width = new_img.width
                new_height = new_img.height
            
            # Calculate savings
            size_reduction = original_size - new_size
            size_reduction_pct = (size_reduction / original_size * 100) if original_size > 0 else 0
            
            result = {
                "status": "success",
                "original": {
                    "path": str(input_path),
                    "format": original_format,
                    "size": original_size,
                    "size_mb": round(original_size / (1024 * 1024), 2),
                    "dimensions": f"{original_width}x{original_height}"
                },
                "compressed": {
                    "path": str(output_path),
                    "format": save_format,
                    "size": new_size,
                    "size_mb": round(new_size / (1024 * 1024), 2),
                    "dimensions": f"{new_width}x{new_height}"
                },
                "savings": {
                    "bytes": size_reduction,
                    "mb": round(size_reduction / (1024 * 1024), 2),
                    "percentage": round(size_reduction_pct, 1)
                },
                "resized": resized,
                "quality": quality
            }
            
            logger.info(f"✅ Compressed {input_path.name}: {result['savings']['percentage']}% smaller")
            return result
            
        except Exception as e:
            logger.error(f"❌ Compression error: {e}")
            return {
                "status": "error",
                "error": str(e),
                "path": str(image_path)
            }
    
    def auto_compress(self, image_path: str) -> dict:
        """
        Automatically compress image if needed.
        
        Returns original path if no compression needed,
        otherwise returns path to compressed image.
        """
        needs, info = self.needs_compression(image_path)
        
        if not needs:
            return {
                "status": "no_change",
                "path": image_path,
                "reason": "Image does not need compression"
            }
        
        # Create compressed version with suffix
        input_path = Path(image_path)
        output_path = input_path.parent / f"{input_path.stem}_compressed.jpg"
        
        result = self.compress_image(image_path, str(output_path))
        
        if result["status"] == "success":
            return {
                "status": "compressed",
                "original_path": image_path,
                "compressed_path": str(output_path),
                "savings": result["savings"]
            }
        
        return result
    
    def compress_to_bytes(self, image_path: str, quality: int = None) -> bytes:
        """
        Compress image and return as bytes.
        Useful for API responses.
        """
        try:
            quality = quality or self.jpeg_quality
            
            with Image.open(image_path) as img:
                # Convert mode if needed
                if img.mode in ('RGBA', 'LA', 'P'):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = background
                elif img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Resize if too large
                if img.width > self.max_width or img.height > self.max_height:
                    ratio = min(self.max_width / img.width, self.max_height / img.height)
                    new_size = (int(img.width * ratio), int(img.height * ratio))
                    img = img.resize(new_size, Image.Resampling.LANCZOS)
                
                # Save to bytes
                buffer = io.BytesIO()
                img.save(buffer, 'JPEG', quality=quality, optimize=True)
                buffer.seek(0)
                
                return buffer.getvalue()
                
        except Exception as e:
            logger.error(f"Error compressing to bytes: {e}")
            raise


# ============================================================================
# SINGLETON INSTANCE
# ============================================================================

_image_processor = None

def get_image_processor() -> ImageProcessor:
    """Get or create the image processor instance."""
    global _image_processor
    if _image_processor is None:
        _image_processor = ImageProcessor()
    return _image_processor

# ============================================================================
# CONVENIENCE FUNCTIONS
# ============================================================================

def compress_image(image_path: str, output_path: str = None) -> dict:
    """Compress an image."""
    processor = get_image_processor()
    return processor.compress_image(image_path, output_path)

def auto_compress(image_path: str) -> dict:
    """Auto-compress image if needed."""
    processor = get_image_processor()
    return processor.auto_compress(image_path)

def get_image_info(image_path: str) -> dict:
    """Get image information."""
    processor = get_image_processor()
    return processor.get_image_info(image_path)

def auto_compress_if_needed(image_path: str) -> dict:
    """Alias for auto_compress - auto-compress image if needed."""
    return auto_compress(image_path)

logger.info("✅ Image Processing module loaded")
