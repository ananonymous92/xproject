param(
    [string]$Style = "red_badge" # "red_badge" or "dark_badge"
)

Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\muham\.gemini\antigravity-ide\brain\eef363ee-232d-485c-a73c-6124a390a8c5\.user_uploaded\media_1792395666620.png"
if (-not (Test-Path $srcPath)) {
    Write-Error "Source image not found: $srcPath"
    exit 1
}

$src = [System.Drawing.Bitmap]::FromFile($srcPath)
$assetsDir = "d:\PROJECT\XPROJECT\assets"
$rootDir = "d:\PROJECT\XPROJECT"

# 1. Save cropped horizontal logo
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

$logoBmp.Save("$assetsDir\logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$logoBmp.Dispose()
Write-Output "Generated assets/logo.png"

# 2. Extract X symbol (excluding hyphen at x>=246 and y between 155..185)
$xW = 272 - 16 + 1
$xH = 245 - 98 + 1
$xCropRed = New-Object System.Drawing.Bitmap $xW, $xH, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

for ($x = 0; $x -lt $xW; $x++) {
    $srcX = $x + 16
    for ($y = 0; $y -lt $xH; $y++) {
        $srcY = $y + 98
        if ($srcX -ge 246 -and $srcY -ge 155 -and $srcY -le 185) {
            $xCropRed.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
            $c = $src.GetPixel($srcX, $srcY)
            $xCropRed.SetPixel($x, $y, $c)
        }
    }
}

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

    $pad = [math]::Max(1, [int]($size * 0.02))
    $circleSize = $size - ($pad * 2)

    if ($badgeStyle -eq "red_badge") {
        $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush (
            (New-Object System.Drawing.Point 0, 0),
            (New-Object System.Drawing.Point 0, $size),
            [System.Drawing.Color]::FromArgb(255, 230, 25, 35),
            [System.Drawing.Color]::FromArgb(255, 185, 12, 20)
        )
        $g.FillEllipse($brush, $pad, $pad, $circleSize, $circleSize)
        $brush.Dispose()

        $targetW = [int]($size * 0.72)
        $targetH = [int](($xH / $xW) * $targetW)
        $posX = [int](($size - $targetW) / 2)
        $posY = [int](($size - $targetH) / 2)

        $g.DrawImage($xCropWhite, (New-Object System.Drawing.Rectangle $posX, $posY, $targetW, $targetH), 0, 0, $xW, $xH, [System.Drawing.GraphicsUnit]::Pixel)
    } elseif ($badgeStyle -eq "dark_badge") {
        $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush (
            (New-Object System.Drawing.Point 0, 0),
            (New-Object System.Drawing.Point 0, $size),
            [System.Drawing.Color]::FromArgb(255, 24, 24, 28),
            [System.Drawing.Color]::FromArgb(255, 10, 10, 12)
        )
        $g.FillEllipse($brush, $pad, $pad, $circleSize, $circleSize)
        $brush.Dispose()

        $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(180, 220, 30, 40), [math]::Max(1, [int]($size * 0.02)))
        $g.DrawEllipse($pen, $pad, $pad, $circleSize, $circleSize)
        $pen.Dispose()

        $targetW = [int]($size * 0.72)
        $targetH = [int](($xH / $xW) * $targetW)
        $posX = [int](($size - $targetW) / 2)
        $posY = [int](($size - $targetH) / 2)

        $g.DrawImage($xCropRed, (New-Object System.Drawing.Rectangle $posX, $posY, $targetW, $targetH), 0, 0, $xW, $xH, [System.Drawing.GraphicsUnit]::Pixel)
    }

    $g.Dispose()
    return $bmp
}

# 3. Generate standard Favicon sizes
$sizes = @(48, 96, 192, 512)
foreach ($s in $sizes) {
    $iconBmp = Render-SquareIcon $s $Style
    $iconBmp.Save("$assetsDir\favicon-$($s)x$($s).png", [System.Drawing.Imaging.ImageFormat]::Png)
    $iconBmp.Dispose()
    Write-Output "Generated assets/favicon-$($s)x$($s).png"
}

# 4. Generate Apple Touch Icon (180x180)
$appleBmp = Render-SquareIcon 180 $Style
$appleBmp.Save("$assetsDir\apple-touch-icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$appleBmp.Dispose()
Write-Output "Generated assets/apple-touch-icon.png"

# 5. Generate root & assets favicon.ico (48x48)
$icoBmp = Render-SquareIcon 48 $Style
$hIcon = $icoBmp.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)

$fs1 = New-Object System.IO.FileStream "$rootDir\favicon.ico", ([System.IO.FileMode]::Create)
$icon.Save($fs1)
$fs1.Close()

$fs2 = New-Object System.IO.FileStream "$assetsDir\favicon.ico", ([System.IO.FileMode]::Create)
$icon.Save($fs2)
$fs2.Close()

$icon.Dispose()
$icoBmp.Dispose()
Write-Output "Generated root favicon.ico and assets/favicon.ico"

$xCropRed.Dispose()
$xCropWhite.Dispose()
$src.Dispose()

Write-Output "All icons successfully created with style: $Style"
