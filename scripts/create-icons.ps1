Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\muham\.gemini\antigravity-ide\brain\eef363ee-232d-485c-a73c-6124a390a8c5\.user_uploaded\media_1792395666620.png"
if (-not (Test-Path $srcPath)) {
    Write-Error "Source image not found: $srcPath"
    exit 1
}

$src = [System.Drawing.Bitmap]::FromFile($srcPath)

# 1. Save cropped full horizontal logo to assets/logo.png
$cropW = 996 - 16 + 1
$cropH = 245 - 98 + 1
$logoBmp = New-Object System.Drawing.Bitmap $cropW, $cropH, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gLogo = [System.Drawing.Graphics]::FromImage($logoBmp)
$gLogo.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gLogo.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$gLogo.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$gLogo.Clear([System.Drawing.Color]::Transparent)
$gLogo.DrawImage($src, (New-Object System.Drawing.Rectangle 0, 0, $cropW, $cropH), (New-Object System.Drawing.Rectangle 16, 98, $cropW, $cropH), [System.Drawing.GraphicsUnit]::Pixel)
$gLogo.Dispose()

$logoBmp.Save("d:\PROJECT\XPROJECT\assets\logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$logoBmp.Dispose()
Write-Output "Saved assets/logo.png"

# 2. Extract pure X symbol (x=16..272, y=98..245, excluding hyphen at x>=246 and y between 155..185)
$xW = 272 - 16 + 1
$xH = 245 - 98 + 1
$xCropRed = New-Object System.Drawing.Bitmap $xW, $xH, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

for ($x = 0; $x -lt $xW; $x++) {
    $srcX = $x + 16
    for ($y = 0; $y -lt $xH; $y++) {
        $srcY = $y + 98
        # Skip hyphen area
        if ($srcX -ge 246 -and $srcY -ge 155 -and $srcY -le 185) {
            $xCropRed.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
            $c = $src.GetPixel($srcX, $srcY)
            $xCropRed.SetPixel($x, $y, $c)
        }
    }
}

# Create white version of X symbol for red background
$xCropWhite = New-Object System.Drawing.Bitmap $xW, $xH, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
for ($x = 0; $x -lt $xW; $x++) {
    for ($y = 0; $y -lt $xH; $y++) {
        $c = $xCropRed.GetPixel($x, $y)
        if ($c.A -gt 0) {
            $xCropWhite.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($c.A, 255, 255, 255))
        }
    }
}

# Function to render icon on a canvas of given size
function Render-SquareIcon($size, $badgeStyle) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    # Pad 2% edge for antialiasing
    $pad = [math]::Max(2, [int]($size * 0.02))
    $circleSize = $size - ($pad * 2)

    if ($badgeStyle -eq "red_badge") {
        # Vibrant red circle badge matching brand color
        $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush (
            (New-Object System.Drawing.Point 0, 0),
            (New-Object System.Drawing.Point 0, $size),
            [System.Drawing.Color]::FromArgb(255, 230, 25, 35),
            [System.Drawing.Color]::FromArgb(255, 185, 12, 20)
        )
        $g.FillEllipse($brush, $pad, $pad, $circleSize, $circleSize)
        $brush.Dispose()

        # Place white X in center (safe area inside circle)
        $targetW = [int]($size * 0.72)
        $targetH = [int](($xH / $xW) * $targetW)
        $posX = [int](($size - $targetW) / 2)
        $posY = [int](($size - $targetH) / 2)

        $g.DrawImage($xCropWhite, (New-Object System.Drawing.Rectangle $posX, $posY, $targetW, $targetH), 0, 0, $xW, $xH, [System.Drawing.GraphicsUnit]::Pixel)
    } elseif ($badgeStyle -eq "dark_badge") {
        # Luxury dark circle
        $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush (
            (New-Object System.Drawing.Point 0, 0),
            (New-Object System.Drawing.Point 0, $size),
            [System.Drawing.Color]::FromArgb(255, 24, 24, 28),
            [System.Drawing.Color]::FromArgb(255, 10, 10, 12)
        )
        $g.FillEllipse($brush, $pad, $pad, $circleSize, $circleSize)
        $brush.Dispose()

        # Subtle red rim
        $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(180, 220, 30, 40), [math]::Max(1, [int]($size * 0.02)))
        $g.DrawEllipse($pen, $pad, $pad, $circleSize, $circleSize)
        $pen.Dispose()

        # Place red X in center
        $targetW = [int]($size * 0.72)
        $targetH = [int](($xH / $xW) * $targetW)
        $posX = [int](($size - $targetW) / 2)
        $posY = [int](($size - $targetH) / 2)

        $g.DrawImage($xCropRed, (New-Object System.Drawing.Rectangle $posX, $posY, $targetW, $targetH), 0, 0, $xW, $xH, [System.Drawing.GraphicsUnit]::Pixel)
    }

    $g.Dispose()
    return $bmp
}

# Generate preview images to artifacts folder
$artifactDir = "C:\Users\muham\.gemini\antigravity-ide\brain\eef363ee-232d-485c-a73c-6124a390a8c5"
$prevRed = Render-SquareIcon 512 "red_badge"
$prevRed.Save("$artifactDir\badge_red.png", [System.Drawing.Imaging.ImageFormat]::Png)
$prevRed.Dispose()

$prevDark = Render-SquareIcon 512 "dark_badge"
$prevDark.Save("$artifactDir\badge_dark.png", [System.Drawing.Imaging.ImageFormat]::Png)
$prevDark.Dispose()

Write-Output "Successfully updated preview badges in artifacts folder"
