#!/usr/bin/env python3
"""
GIF Compressor Script

This script allows you to select a GIF file and compress it to meet specific requirements:
- Maximum file size: 4MB
- Dimensions: 498x278 pixels
- Color depth: 8-bit (256 colors maximum)

Usage: Run this script and select a GIF file to compress.
"""

import os
import sys
from pathlib import Path
import tkinter as tk
from tkinter import filedialog, messagebox
from PIL import Image, ImageSequence
import tempfile
import shutil


def select_gif_files():
    """Open file dialog to select multiple GIF files."""
    root = tk.Tk()
    root.withdraw()  # Hide the main window
    
    file_paths = filedialog.askopenfilenames(
        title="Select GIF files to compress",
        filetypes=[("GIF files", "*.gif"), ("All files", "*.*")]
    )
    
    root.destroy()
    return file_paths


def ask_discord_optimization():
    """Ask user if they want Discord-specific optimization."""
    root = tk.Tk()
    root.withdraw()
    
    result = messagebox.askyesno(
        "Discord Optimization",
        "Do you want to optimize this GIF for Discord upload?\n\n"
        "This will:\n"
        "- Resize to Discord's recommended 400x300 limit\n"
        "- Reduce frame count for better compression\n"
        "- Optimize colors to minimize Discord's compression artifacts\n"
        "- Create a version suitable for external hosting (Imgur, etc.)"
    )
    
    root.destroy()
    return result


def get_output_folder():
    """Open directory dialog to select output folder."""
    root = tk.Tk()
    root.withdraw()
    
    folder_path = filedialog.askdirectory(
        title="Select output folder for compressed GIF"
    )
    
    root.destroy()
    return folder_path


def compress_gif(input_path, output_path, target_size_mb=4, target_width=498, target_height=278):
    """
    Compress a GIF file to meet size and dimension requirements.
    
    Args:
        input_path (str): Path to input GIF file
        output_path (str): Path to save compressed GIF
        target_size_mb (float): Maximum file size in MB
        target_width (int): Target width in pixels
        target_height (int): Target height in pixels
    """
    try:
        # Open the GIF file
        with Image.open(input_path) as img:
            # Get original info
            original_size = os.path.getsize(input_path)
            original_size_mb = original_size / (1024 * 1024)
            
            print(f"Original file size: {original_size_mb:.2f} MB")
            print(f"Original dimensions: {img.size}")
            
            # Create output directory if it doesn't exist
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            # Process frames with aggressive compression
            frames = []
            durations = []
            loop = img.info.get('loop', 0)
            
            # Get frame duration and make it slower
            try:
                original_duration = img.info['duration']
                # Multiply duration by 1.5 to make it 50% slower
                slow_duration = int(original_duration * 1.5)
                durations.append(slow_duration)
                print(f"Original frame duration: {original_duration}ms, Slowed to: {slow_duration}ms")
            except KeyError:
                # Default duration, make it slower
                slow_duration = 150  # 150ms instead of 100ms for slower playback
                durations.append(slow_duration)
                print(f"Using default slowed duration: {slow_duration}ms")
            
            # Process each frame with maximum compression
            frame_count = 0
            total_frames = img.n_frames
            
            # Skip every other frame to reduce file size significantly
            frame_skip = 1
            if total_frames > 50:
                frame_skip = 2
            elif total_frames > 100:
                frame_skip = 3
            
            for i, frame in enumerate(ImageSequence.Iterator(img)):
                # Skip frames to reduce file size
                if i % frame_skip != 0:
                    continue
                    
                # Convert to RGB first, then to palette
                frame_rgb = frame.convert('RGB')
                
                # Resize frame to target dimensions
                frame_resized = frame_rgb.resize((target_width, target_height), Image.Resampling.LANCZOS)
                
                # Convert to palette mode with better color preservation
                frame_palette = frame_resized.convert('P', palette=Image.ADAPTIVE, colors=256)
                
                frames.append(frame_palette)
                frame_count += 1
            
            print(f"Processed {frame_count} out of {total_frames} frames (skipped {frame_skip-1} out of every {frame_skip} frames)")
            
            # Save the compressed GIF with maximum optimization
            if frames:
                frames[0].save(
                    output_path,
                    save_all=True,
                    append_images=frames[1:],
                    duration=durations[0] if durations else 100,
                    loop=loop,
                    optimize=True,
                    quality=20  # Very low quality for maximum compression
                )
                
                # Check final size
                final_size = os.path.getsize(output_path)
                final_size_mb = final_size / (1024 * 1024)
                
                print(f"Compressed file size: {final_size_mb:.2f} MB")
                
                # If still too large, try additional compression techniques
                if final_size_mb > target_size_mb:
                    print("File still too large, applying additional compression...")
                    
                    # Try even more aggressive compression by reducing colors further
                    frames_reduced = []
                    for frame in frames:
                        # Convert to even fewer colors
                        frame_reduced = frame.convert('P', palette=Image.ADAPTIVE, colors=32)
                        frames_reduced.append(frame_reduced)
                    
                    frames_reduced[0].save(
                        output_path,
                        save_all=True,
                        append_images=frames_reduced[1:],
                        duration=durations[0] if durations else 100,
                        loop=loop,
                        optimize=True,
                        quality=10  # Extremely low quality
                    )
                    
                    final_size = os.path.getsize(output_path)
                    final_size_mb = final_size / (1024 * 1024)
                    print(f"Final compressed file size: {final_size_mb:.2f} MB")
                
                return final_size_mb <= target_size_mb, final_size_mb
                
    except Exception as e:
        print(f"Error compressing GIF: {e}")
        return False, 0


def main():
    """Main function to run the GIF compressor."""
    print("GIF Compressor")
    print("=" * 50)
    
    # Select input files
    input_files = select_gif_files()
    if not input_files:
        print("No files selected. Exiting.")
        return
    
    # Check if all selected files are GIFs
    for file_path in input_files:
        if not file_path.lower().endswith('.gif'):
            messagebox.showerror("Error", f"Please select only GIF files. '{file_path}' is not a GIF.")
            return
    
    # Select output folder
    output_folder = get_output_folder()
    if not output_folder:
        print("No output folder selected. Exiting.")
        return
    
    # Process each GIF file
    successful_count = 0
    total_count = len(input_files)
    
    for input_file in input_files:
        print(f"\nProcessing: {os.path.basename(input_file)}")
        
        # Generate output filename
        input_filename = os.path.basename(input_file)
        name, ext = os.path.splitext(input_filename)
        output_filename = f"{name}_compressed{ext}"
        output_path = os.path.join(output_folder, output_filename)
        
        print(f"Output path: {output_path}")
        print("Compressing...")
        
        # Compress the GIF
        success, final_size_mb = compress_gif(input_path=input_file, output_path=output_path)
        
        if success:
            print("✅ Compression successful!")
            print(f"Final file size: {final_size_mb:.2f} MB")
            print(f"Saved to: {output_path}")
            successful_count += 1
        else:
            print("❌ Compression failed or file still too large.")
    
    # Show summary
    print(f"\n{'='*50}")
    print(f"Compression Summary:")
    print(f"Total files: {total_count}")
    print(f"Successful: {successful_count}")
    print(f"Failed: {total_count - successful_count}")
    
    messagebox.showinfo(
        "Compression Complete", 
        f"Processed {total_count} GIF files.\n"
        f"Successfully compressed: {successful_count}\n"
        f"Failed: {total_count - successful_count}\n"
        f"All files saved to: {output_folder}"
    )


if __name__ == "__main__":
    main()