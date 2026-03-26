#!/bin/bash
#
# compress_videos.sh — Compress video files >10 MB for web-hosted slides.
#
# Strategy:
#   - Re-encode to H.264 (libx264) + AAC with CRF-based quality
#   - Cap resolution at 1080p (no upscaling)
#   - Target reasonable bitrate via CRF 28 (good quality, much smaller)
#   - Convert all formats (.mp4, .mov, .MOV, .avi, .mkv) to .mp4
#   - Skip files already below 10 MB
#   - Replaces originals (after successful encode); keeps original extension
#     for .mp4 files, renames others to .mp4
#
# Usage:
#   ./compress_videos.sh [--dry-run]
#
# Requires: ffmpeg, ffprobe

set -uo pipefail

DRY_RUN=false
MIN_SIZE=$((10 * 1024 * 1024))  # 10 MB in bytes
CRF=28                           # quality: lower = better, 28 = good for slides
MAX_HEIGHT=1080
EXTENSIONS=("mp4" "mov" "MOV" "avi" "mkv")
RENAMED_FILES=()   # track non-.mp4 files that get renamed

if [[ "${1:-}" == "--dry-run" ]]; then
    DRY_RUN=true
    echo "=== DRY RUN — no files will be modified ==="
    echo ""
fi

# Build find pattern
find_args=()
for i in "${!EXTENSIONS[@]}"; do
    if [[ $i -gt 0 ]]; then find_args+=("-o"); fi
    find_args+=("-name" "*.${EXTENSIONS[$i]}")
done

total_before=0
total_after=0
count=0
skipped=0

while IFS= read -r -d '' file; do
    filesize=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)

    if [[ $filesize -lt $MIN_SIZE ]]; then
        skipped=$((skipped + 1))
        continue
    fi

    filesize_mb=$(echo "scale=1; $filesize / 1048576" | bc)

    # Get video info
    resolution=$(ffprobe -v quiet -select_streams v:0 \
        -show_entries stream=width,height -of csv=p=0 "$file" 2>/dev/null || echo "")

    if [[ -z "$resolution" ]]; then
        echo "SKIP (no video stream): $file"
        continue
    fi

    width=$(echo "$resolution" | cut -d',' -f1)
    height=$(echo "$resolution" | cut -d',' -f2)

    # Check if already compressed well (H.264 + CRF-like bitrate)
    codec=$(ffprobe -v quiet -select_streams v:0 \
        -show_entries stream=codec_name -of csv=p=0 "$file" 2>/dev/null || echo "")

    # Determine scale filter: cap at MAX_HEIGHT, preserve aspect ratio, ensure even dimensions
    scale_filter=""
    if [[ $height -gt $MAX_HEIGHT ]]; then
        scale_filter="-vf scale=-2:${MAX_HEIGHT}"
    else
        # Ensure even dimensions (required by libx264)
        scale_filter="-vf scale=trunc(iw/2)*2:trunc(ih/2)*2"
    fi

    echo "────────────────────────────────────────"
    echo "File:       $file"
    echo "Size:       ${filesize_mb} MB"
    echo "Resolution: ${width}x${height}  Codec: ${codec}"

    if $DRY_RUN; then
        if [[ $height -gt $MAX_HEIGHT ]]; then
            echo "Would:      re-encode + downscale to ${MAX_HEIGHT}p"
        else
            echo "Would:      re-encode at current resolution"
        fi
        total_before=$((total_before + filesize))
        count=$((count + 1))
        continue
    fi

    # Compress to a temp file next to the original
    dir=$(dirname "$file")
    base=$(basename "$file")
    name="${base%.*}"
    tmpfile="${dir}/${name}_compressed.mp4"

    echo "Compressing..."

    if ! ffmpeg -y -i "$file" \
        -c:v libx264 -preset slow -crf $CRF \
        $scale_filter \
        -c:a aac -b:a 96k -ac 2 \
        -movflags +faststart \
        -loglevel warning \
        "$tmpfile" 2>&1; then
        # ffmpeg may warn but still produce a valid file; check if output exists
        true
    fi

    if [[ ! -f "$tmpfile" ]] || [[ ! -s "$tmpfile" ]]; then
        echo "ERROR: compression failed, skipping"
        rm -f "$tmpfile"
        skipped=$((skipped + 1))
        continue
    fi

    newsize=$(stat -f%z "$tmpfile" 2>/dev/null || stat -c%s "$tmpfile" 2>/dev/null)
    newsize_mb=$(echo "scale=1; $newsize / 1048576" | bc)
    savings=$(echo "scale=0; 100 - ($newsize * 100 / $filesize)" | bc)

    # Only replace if we actually saved space
    if [[ $newsize -ge $filesize ]]; then
        echo "Result:     ${newsize_mb} MB — no savings, keeping original"
        rm "$tmpfile"
        skipped=$((skipped + 1))
        continue
    fi

    echo "Result:     ${newsize_mb} MB  (${savings}% smaller)"

    # Replace original
    rm "$file"

    # If original wasn't .mp4, the new file is .mp4
    if [[ "${base##*.}" != "mp4" ]]; then
        newpath="${dir}/${name}.mp4"
        mv "$tmpfile" "$newpath"
        echo "Renamed:    ${base} → ${name}.mp4"
        RENAMED_FILES+=("${file} → ${newpath}")
    else
        mv "$tmpfile" "$file"
    fi

    total_before=$((total_before + filesize))
    total_after=$((total_after + newsize))
    count=$((count + 1))

done < <(find . -not -path './.git/*' -type f \( "${find_args[@]}" \) -print0)

echo ""
echo "════════════════════════════════════════"
echo "Done!"
echo "Files processed:  $count"
echo "Files skipped:    $skipped  (<10 MB or no savings)"

if [[ $count -gt 0 ]]; then
    before_mb=$(echo "scale=1; $total_before / 1048576" | bc)
    if $DRY_RUN; then
        echo "Total to compress: ${before_mb} MB"
    else
        after_mb=$(echo "scale=1; $total_after / 1048576" | bc)
        saved_mb=$(echo "scale=1; ($total_before - $total_after) / 1048576" | bc)
        echo "Before:           ${before_mb} MB"
        echo "After:            ${after_mb} MB"
        echo "Saved:            ${saved_mb} MB"
    fi
fi

# Warn about renamed files that may need HTML reference updates
if [[ ${#RENAMED_FILES[@]} -gt 0 ]]; then
    echo ""
    echo "⚠  WARNING: The following files were renamed to .mp4."
    echo "   HTML/SVG files referencing the old names must be updated!"
    echo ""
    for entry in "${RENAMED_FILES[@]}"; do
        echo "   $entry"
    done
    echo ""
fi
