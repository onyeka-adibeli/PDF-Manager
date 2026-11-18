#!/usr/bin/env python3
"""
PDF Squeeze CLI - Standalone Command-Line PDF Compressor Companion
Usage:
    python compress_cli.py document.pdf
    python compress_cli.py document.pdf -o compressed.pdf -q 60
    python compress_cli.py ./my_folder/ --all
"""

import os
import sys
import argparse
import time

def format_bytes(size):
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size < 1024.0:
            return f"{size:.2f} {unit}"
        size /= 1024.0
    return f"{size:.2f} TB"

def compress_pdf(input_path, output_path=None, quality=70, grayscale=False, remove_metadata=True):
    if not os.path.exists(input_path):
        print(f"[-] Error: File not found: {input_path}")
        return False

    if not output_path:
        base, ext = os.path.splitext(input_path)
        output_path = f"{base}_compressed{ext}"

    orig_size = os.path.getsize(input_path)
    start_time = time.time()

    try:
        # Try PyMuPDF (fitz) first for fastest high-ratio compression
        import fitz
        doc = fitz.open(input_path)

        if remove_metadata:
            doc.set_metadata({})

        # Deflate and clean streams
        doc.save(
            output_path,
            garbage=4,
            deflate=True,
            deflate_images=True,
            deflate_fonts=True,
            clean=True
        )
        doc.close()

    except ImportError:
        try:
            # Fallback to pypdf
            from pypdf import PdfReader, PdfWriter
            reader = PdfReader(input_path)
            writer = PdfWriter()

            for page in reader.pages:
                page.compress_content_streams()
                writer.add_page(page)

            if not remove_metadata:
                metadata = reader.metadata
                if metadata:
                    writer.add_metadata(metadata)

            with open(output_path, "wb") as f:
                writer.write(f)

        except ImportError:
            print("[-] Neither PyMuPDF nor pypdf is installed.")
            print("[*] Install one of them using:")
            print("      pip install pymupdf")
            print("      or: pip install pypdf")
            return False

    comp_size = os.path.getsize(output_path)
    elapsed = time.time() - start_time
    saved = orig_size - comp_size
    percent = (saved / orig_size) * 100 if orig_size > 0 else 0

    print(f"[+] Compressed: {os.path.basename(input_path)}")
    print(f"    Original:   {format_bytes(orig_size)}")
    print(f"    Compressed: {format_bytes(comp_size)} ({percent:+.1f}%)")
    print(f"    Saved:      {format_bytes(saved)} in {elapsed:.2f}s")
    print(f"    Output:     {output_path}\n")
    return True

def main():
    parser = argparse.ArgumentParser(description="PDF Squeeze CLI - Fast local PDF compressor")
    parser.add_argument("path", help="PDF file or directory to compress")
    parser.add_argument("-o", "--output", help="Output PDF file path (optional)")
    parser.add_argument("-q", "--quality", type=int, default=70, help="Image quality (10-100, default: 70)")
    parser.add_argument("--grayscale", action="store_true", help="Convert document to grayscale")
    parser.add_argument("--all", action="store_true", help="Process all PDFs in directory")

    args = parser.parse_args()

    if os.path.isdir(args.path):
        files = [os.path.join(args.path, f) for f in os.listdir(args.path) if f.lower().endswith(".pdf")]
        if not files:
            print("[-] No PDF files found in directory.")
            return
        print(f"[*] Processing {len(files)} PDF files in {args.path}...\n")
        for f in files:
            compress_pdf(f, quality=args.quality, grayscale=args.grayscale)
    else:
        compress_pdf(args.path, output_path=args.output, quality=args.quality, grayscale=args.grayscale)

if __name__ == "__main__":
    main()

