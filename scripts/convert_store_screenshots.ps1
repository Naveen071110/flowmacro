Add-Type -AssemblyName System.Drawing

$img1Path = "C:/Users/singh/.gemini/antigravity/brain/2145eeae-4c2e-4e8e-af1c-9fa07c3d6b47/.user_uploaded/media_1791659900741_247ed124.png"
$img2Path = "C:/Users/singh/.gemini/antigravity/brain/2145eeae-4c2e-4e8e-af1c-9fa07c3d6b47/.user_uploaded/media_1791659906573_dbd58def.png"

$outputDir = "C:/Users/singh/Downloads/Chrome Extensions/web-macro-automation/store_assets"
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

function Save-ImageOutputs {
    param(
        [string]$sourcePath,
        [string]$baseName
    )

    $src = [System.Drawing.Bitmap]::FromFile($sourcePath)
    Write-Host "Processing $baseName (Original: $($src.Width)x$($src.Height))..."

    # Targets: 1280x800 and 640x400
    $sizes = @(
        @{ Width = 1280; Height = 800; Suffix = "1280x800" },
        @{ Width = 640;  Height = 400; Suffix = "640x400" }
    )

    # JPEG Encoder with high quality (95)
    $jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
    $encoderParams = [System.Drawing.Imaging.EncoderParameters]::new(1)
    $encoderParams.Param[0] = [System.Drawing.Imaging.EncoderParameter]::new([System.Drawing.Imaging.Encoder]::Quality, 95L)

    foreach ($s in $sizes) {
        $w = $s.Width
        $h = $s.Height
        $suffix = $s.Suffix

        # --- VARIANT 1: Stretch to Full Canvas (Edge to Edge) ---
        $bmpFull = [System.Drawing.Bitmap]::new($w, $h, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
        $gFull = [System.Drawing.Graphics]::FromImage($bmpFull)
        $gFull.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $gFull.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $gFull.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $gFull.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $gFull.DrawImage($src, 0, 0, $w, $h)
        $gFull.Dispose()

        # Save JPEG (100% CWS compliant)
        $jpgPath = Join-Path $outputDir "${baseName}_${suffix}.jpg"
        $bmpFull.Save($jpgPath, $jpegCodec, $encoderParams)

        # Save 24-bit PNG (No alpha channel, 100% CWS compliant)
        $pngPath = Join-Path $outputDir "${baseName}_${suffix}.png"
        $bmpFull.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)
        $bmpFull.Dispose()

        Write-Host "  -> Created: ${baseName}_${suffix}.jpg & .png"

        # --- VARIANT 2: Proportional Aspect-Fit with Window Theme Background ---
        # Fits width, centers vertically with dark UI background padding
        $bmpFit = [System.Drawing.Bitmap]::new($w, $h, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
        $gFit = [System.Drawing.Graphics]::FromImage($bmpFit)
        $gFit.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $gFit.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $gFit.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $gFit.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

        # Fill background with exact window background (#0e0e0e / Color.FromArgb(14, 14, 14))
        $bgBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(14, 14, 14))
        $gFit.FillRectangle($bgBrush, 0, 0, $w, $h)
        $bgBrush.Dispose()

        # Calculate proportional dimensions
        $scale = [Math]::Min($w / $src.Width, $h / $src.Height)
        $destW = [int]($src.Width * $scale)
        $destH = [int]($src.Height * $scale)
        $destX = [int](($w - $destW) / 2)
        $destY = [int](($h - $destH) / 2)

        $gFit.DrawImage($src, $destX, $destY, $destW, $destH)
        $gFit.Dispose()

        $fitJpgPath = Join-Path $outputDir "${baseName}_fit_${suffix}.jpg"
        $bmpFit.Save($fitJpgPath, $jpegCodec, $encoderParams)

        $fitPngPath = Join-Path $outputDir "${baseName}_fit_${suffix}.png"
        $bmpFit.Save($fitPngPath, [System.Drawing.Imaging.ImageFormat]::Png)
        $bmpFit.Dispose()

        Write-Host "  -> Created: ${baseName}_fit_${suffix}.jpg & .png"
    }

    $src.Dispose()
}

Save-ImageOutputs -sourcePath $img1Path -baseName "screenshot_1_active_test"
Save-ImageOutputs -sourcePath $img2Path -baseName "screenshot_2_ready_suite"

Write-Host "All Chrome Web Store assets generated successfully!"
