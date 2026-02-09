import sys
from PIL import Image
import numpy as np

def process_logo(input_path, output_path):
    print(f"Processing {input_path}...")
    
    # Open image
    img = Image.open(input_path).convert("RGBA")
    data = np.array(img)
    
    # Calculate transparency based on brightness
    # Assuming black background: deeper black = more transparent
    r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]
    
    # Calculate brightness
    brightness = (r.astype(int) + g.astype(int) + b.astype(int)) / 3
    
    # Create mask: keep pixels that are bright enough
    # Threshold: adjust as needed. 15 is a safe bet for pure black background.
    mask = (brightness > 20) | ((r > 30) | (g > 30) | (b > 30))
    
    # Update alpha channel: 0 if background, 255 if foreground
    # For a smoother edge, we could use the brightness itself, but hard cut is safer for logos
    # Let's try to be smart: if it's very dark, make it transparent.
    
    # Simple thresholding
    data[:,:,3] = np.where(mask, 255, 0)
    
    # Create new image from modified data
    new_img = Image.fromarray(data)
    
    # Crop to content (remove empty space)
    bbox = new_img.getbbox()
    if bbox:
        new_img = new_img.crop(bbox)
        
    # Resize canvas to 3:2
    width, height = new_img.size
    target_ratio = 3/2
    
    if width / height > target_ratio:
        # Width is the limiter
        new_width = width
        new_height = int(width / target_ratio)
    else:
        # Height is the limiter
        new_height = height
        new_width = int(height * target_ratio)
        
    # Create blank 3:2 canvas
    canvas = Image.new("RGBA", (new_width, new_height), (0, 0, 0, 0))
    
    # Center the logo
    x = (new_width - width) // 2
    y = (new_height - height) // 2
    canvas.paste(new_img, (x, y))
    
    # Save
    canvas.save(output_path, "PNG")
    print(f"Saved to {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python remove_bg.py <input> <output>")
        sys.exit(1)
        
    process_logo(sys.argv[1], sys.argv[2])
