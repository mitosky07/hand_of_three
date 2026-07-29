param(
  [string]$OutputDirectory = "src/assets/ui"
)

Add-Type -AssemblyName System.Drawing

$pixel = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$smoothing = [System.Drawing.Drawing2D.SmoothingMode]::None
$palette = @{
  Ink = [System.Drawing.Color]::FromArgb(255, 14, 15, 14)
  Cabinet = [System.Drawing.Color]::FromArgb(255, 35, 33, 29)
  CabinetLight = [System.Drawing.Color]::FromArgb(255, 73, 65, 54)
  Screen = [System.Drawing.Color]::FromArgb(255, 9, 48, 36)
  ScreenLight = [System.Drawing.Color]::FromArgb(255, 19, 66, 50)
  Ivory = [System.Drawing.Color]::FromArgb(255, 224, 209, 170)
  Amber = [System.Drawing.Color]::FromArgb(255, 203, 157, 54)
  Rust = [System.Drawing.Color]::FromArgb(255, 126, 55, 49)
  Wood = [System.Drawing.Color]::FromArgb(255, 91, 57, 39)
  WoodLight = [System.Drawing.Color]::FromArgb(255, 139, 91, 57)
}

function New-Canvas([int]$width, [int]$height) {
  return [System.Drawing.Bitmap]::new($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
}

function New-Brush([System.Drawing.Color]$color) {
  return [System.Drawing.SolidBrush]::new($color)
}

function Fill-Rect($graphics, [System.Drawing.Color]$color, [int]$x, [int]$y, [int]$width, [int]$height) {
  $brush = New-Brush $color
  $graphics.FillRectangle($brush, $x, $y, $width, $height)
  $brush.Dispose()
}

function Fill-Polygon($graphics, [System.Drawing.Color]$color, [System.Drawing.Point[]]$points) {
  $brush = New-Brush $color
  $graphics.FillPolygon($brush, $points)
  $brush.Dispose()
}

function Save-Canvas($bitmap, [string]$path) {
  $absolute = [System.IO.Path]::GetFullPath($path)
  $directory = [System.IO.Path]::GetDirectoryName($absolute)
  [System.IO.Directory]::CreateDirectory($directory) | Out-Null
  $bitmap.Save($absolute, [System.Drawing.Imaging.ImageFormat]::Png)
}

function Make-ButtonAtlas([string]$path) {
  $bitmap = New-Canvas 288 240
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = $smoothing
  $tones = @(
    @([System.Drawing.Color]::FromArgb(255, 40, 78, 58), [System.Drawing.Color]::FromArgb(255, 65, 110, 78)),
    @([System.Drawing.Color]::FromArgb(255, 48, 77, 83), [System.Drawing.Color]::FromArgb(255, 68, 105, 112)),
    @([System.Drawing.Color]::FromArgb(255, 112, 77, 42), [System.Drawing.Color]::FromArgb(255, 145, 102, 54)),
    @([System.Drawing.Color]::FromArgb(255, 103, 49, 45), [System.Drawing.Color]::FromArgb(255, 139, 65, 56)),
    @([System.Drawing.Color]::FromArgb(255, 70, 55, 83), [System.Drawing.Color]::FromArgb(255, 96, 72, 111))
  )

  for ($toneIndex = 0; $toneIndex -lt $tones.Count; $toneIndex++) {
    for ($state = 0; $state -lt 3; $state++) {
      $x = $state * 96
      $y = $toneIndex * 48
      $press = if ($state -eq 2) { 3 } else { 0 }
      Fill-Rect $graphics $palette.Ink ($x + 4) ($y + 7) 88 38
      Fill-Rect $graphics $palette.CabinetLight ($x + 1) ($y + 1 + $press) 94 40
      Fill-Rect $graphics $palette.Ink ($x + 3) ($y + 3 + $press) 90 36
      $fill = if ($state -eq 1) { $tones[$toneIndex][1] } else { $tones[$toneIndex][0] }
      Fill-Rect $graphics $fill ($x + 5) ($y + 5 + $press) 86 30
      Fill-Rect $graphics $palette.Ivory ($x + 6) ($y + 6 + $press) 84 2
      Fill-Rect $graphics $palette.Ink ($x + 6) ($y + 32 + $press) 84 3
      if ($state -eq 1) {
        Fill-Rect $graphics $palette.Amber ($x + 9) ($y + 9) 78 2
      }
      if ($state -eq 2) {
        Fill-Rect $graphics $palette.Cabinet ($x + 7) ($y + 8) 82 2
      }
    }
  }

  Save-Canvas $bitmap $path
  $graphics.Dispose()
  $bitmap.Dispose()
}

function Make-Panel([string]$path) {
  $bitmap = New-Canvas 96 96
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = $smoothing
  Fill-Rect $graphics $palette.CabinetLight 0 0 96 96
  Fill-Rect $graphics $palette.Ivory 3 3 90 2
  Fill-Rect $graphics $palette.Ivory 3 3 2 90
  Fill-Rect $graphics $palette.Ink 3 91 90 2
  Fill-Rect $graphics $palette.Ink 91 3 2 90
  Fill-Rect $graphics $palette.Cabinet 6 6 84 84
  Fill-Rect $graphics $palette.Screen 10 10 76 76
  Fill-Rect $graphics $palette.ScreenLight 12 12 72 2
  Fill-Rect $graphics $palette.Amber 12 80 8 2
  Save-Canvas $bitmap $path
  $graphics.Dispose()
  $bitmap.Dispose()
}

function Make-Cabinet([string]$path) {
  $bitmap = New-Canvas 1280 720
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = $smoothing
  Fill-Rect $graphics $palette.Cabinet 0 0 1280 720
  Fill-Rect $graphics $palette.Ink 22 18 1236 684
  Fill-Rect $graphics $palette.CabinetLight 28 24 1224 672
  Fill-Rect $graphics $palette.Ink 36 32 1208 656
  Fill-Rect $graphics $palette.Screen 42 38 1196 644
  Fill-Rect $graphics $palette.ScreenLight 48 44 1184 2
  for ($y = 50; $y -lt 680; $y += 4) {
    Fill-Rect $graphics ([System.Drawing.Color]::FromArgb(18, 0, 0, 0)) 48 $y 1184 1
  }
  Fill-Rect $graphics $palette.Amber 58 52 120 3
  Fill-Rect $graphics $palette.Rust 1102 664 72 3
  Save-Canvas $bitmap $path
  $graphics.Dispose()
  $bitmap.Dispose()
}

function Make-Table([string]$path, [System.Drawing.Color]$felt) {
  $bitmap = New-Canvas 1120 510
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = $smoothing

  $shadow = [System.Drawing.Point[]]@(
    [System.Drawing.Point]::new(112, 16), [System.Drawing.Point]::new(1008, 16),
    [System.Drawing.Point]::new(1056, 24), [System.Drawing.Point]::new(1088, 48),
    [System.Drawing.Point]::new(1112, 88), [System.Drawing.Point]::new(1119, 128),
    [System.Drawing.Point]::new(1119, 414), [System.Drawing.Point]::new(1104, 454),
    [System.Drawing.Point]::new(1072, 486), [System.Drawing.Point]::new(1024, 509),
    [System.Drawing.Point]::new(96, 509), [System.Drawing.Point]::new(48, 486),
    [System.Drawing.Point]::new(16, 454), [System.Drawing.Point]::new(0, 414),
    [System.Drawing.Point]::new(0, 128), [System.Drawing.Point]::new(8, 88),
    [System.Drawing.Point]::new(32, 48), [System.Drawing.Point]::new(64, 24)
  )
  $outer = [System.Drawing.Point[]]@(
    [System.Drawing.Point]::new(112, 0), [System.Drawing.Point]::new(1008, 0),
    [System.Drawing.Point]::new(1056, 8), [System.Drawing.Point]::new(1088, 32),
    [System.Drawing.Point]::new(1112, 72), [System.Drawing.Point]::new(1119, 112),
    [System.Drawing.Point]::new(1119, 398), [System.Drawing.Point]::new(1104, 438),
    [System.Drawing.Point]::new(1072, 470), [System.Drawing.Point]::new(1024, 493),
    [System.Drawing.Point]::new(96, 493), [System.Drawing.Point]::new(48, 470),
    [System.Drawing.Point]::new(16, 438), [System.Drawing.Point]::new(0, 398),
    [System.Drawing.Point]::new(0, 112), [System.Drawing.Point]::new(8, 72),
    [System.Drawing.Point]::new(32, 32), [System.Drawing.Point]::new(64, 8)
  )
  $rail = [System.Drawing.Point[]]@(
    [System.Drawing.Point]::new(120, 12), [System.Drawing.Point]::new(1000, 12),
    [System.Drawing.Point]::new(1048, 20), [System.Drawing.Point]::new(1080, 44),
    [System.Drawing.Point]::new(1100, 80), [System.Drawing.Point]::new(1107, 120),
    [System.Drawing.Point]::new(1107, 390), [System.Drawing.Point]::new(1092, 428),
    [System.Drawing.Point]::new(1060, 458), [System.Drawing.Point]::new(1016, 479),
    [System.Drawing.Point]::new(104, 479), [System.Drawing.Point]::new(60, 458),
    [System.Drawing.Point]::new(28, 428), [System.Drawing.Point]::new(12, 390),
    [System.Drawing.Point]::new(12, 120), [System.Drawing.Point]::new(20, 80),
    [System.Drawing.Point]::new(40, 44), [System.Drawing.Point]::new(72, 20)
  )
  $bed = [System.Drawing.Point[]]@(
    [System.Drawing.Point]::new(128, 28), [System.Drawing.Point]::new(992, 28),
    [System.Drawing.Point]::new(1036, 36), [System.Drawing.Point]::new(1064, 58),
    [System.Drawing.Point]::new(1082, 90), [System.Drawing.Point]::new(1088, 128),
    [System.Drawing.Point]::new(1088, 378), [System.Drawing.Point]::new(1074, 412),
    [System.Drawing.Point]::new(1044, 440), [System.Drawing.Point]::new(1004, 460),
    [System.Drawing.Point]::new(116, 460), [System.Drawing.Point]::new(76, 440),
    [System.Drawing.Point]::new(46, 412), [System.Drawing.Point]::new(32, 378),
    [System.Drawing.Point]::new(32, 128), [System.Drawing.Point]::new(38, 90),
    [System.Drawing.Point]::new(56, 58), [System.Drawing.Point]::new(84, 36)
  )
  $line = [System.Drawing.Point[]]@(
    [System.Drawing.Point]::new(144, 44), [System.Drawing.Point]::new(976, 44),
    [System.Drawing.Point]::new(1016, 52), [System.Drawing.Point]::new(1044, 72),
    [System.Drawing.Point]::new(1060, 102), [System.Drawing.Point]::new(1066, 136),
    [System.Drawing.Point]::new(1066, 366), [System.Drawing.Point]::new(1052, 398),
    [System.Drawing.Point]::new(1024, 424), [System.Drawing.Point]::new(988, 442),
    [System.Drawing.Point]::new(132, 442), [System.Drawing.Point]::new(96, 424),
    [System.Drawing.Point]::new(68, 398), [System.Drawing.Point]::new(54, 366),
    [System.Drawing.Point]::new(54, 136), [System.Drawing.Point]::new(60, 102),
    [System.Drawing.Point]::new(76, 72), [System.Drawing.Point]::new(104, 52)
  )

  Fill-Polygon $graphics ([System.Drawing.Color]::FromArgb(190, 0, 0, 0)) $shadow
  Fill-Polygon $graphics $palette.Wood $outer
  Fill-Polygon $graphics $palette.WoodLight $rail
  Fill-Polygon $graphics $felt $bed
  $pen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(110, 224, 209, 170), 2)
  $graphics.DrawPolygon($pen, $line)
  $pen.Dispose()

  Fill-Rect $graphics $palette.Ink 464 25 192 26
  Fill-Rect $graphics $palette.WoodLight 472 29 176 18
  Fill-Rect $graphics $palette.Screen 480 33 160 14
  Fill-Rect $graphics $palette.Amber 488 36 144 2
  Fill-Rect $graphics $palette.Ivory 88 240 18 3
  Fill-Rect $graphics $palette.Ivory 1014 240 18 3
  Save-Canvas $bitmap $path
  $graphics.Dispose()
  $bitmap.Dispose()
}

function Make-CardBase([string]$path, [string]$symbolPath, [System.Drawing.Color]$face) {
  $bitmap = New-Canvas 132 184
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = $smoothing
  $graphics.InterpolationMode = $pixel
  Fill-Rect $graphics $palette.Ink 4 6 128 178
  Fill-Rect $graphics $palette.CabinetLight 0 0 128 178
  Fill-Rect $graphics $palette.Ivory 3 3 122 2
  Fill-Rect $graphics $palette.Ink 3 173 122 3
  Fill-Rect $graphics $face 6 8 116 162
  Fill-Rect $graphics $palette.Ink 10 12 108 22
  Fill-Rect $graphics $palette.Amber 14 37 100 2
  Fill-Rect $graphics $palette.Ink 38 142 52 28
  Fill-Rect $graphics $palette.Amber 40 144 48 2
  $symbol = [System.Drawing.Image]::FromFile([System.IO.Path]::GetFullPath($symbolPath))
  $graphics.DrawImage($symbol, 25, 44, 78, 78)
  $symbol.Dispose()
  Save-Canvas $bitmap $path
  $graphics.Dispose()
  $bitmap.Dispose()
}

$output = [System.IO.Path]::GetFullPath($OutputDirectory)
[System.IO.Directory]::CreateDirectory($output) | Out-Null

Make-ButtonAtlas (Join-Path $output "video-poker-buttons.png")
Make-Panel (Join-Path $output "video-poker-panel.png")
Make-Cabinet (Join-Path $output "video-poker-cabinet.png")
Make-Table (Join-Path $output "table-classic.png") ([System.Drawing.Color]::FromArgb(255, 35, 78, 57))
Make-Table (Join-Path $output "table-midnight.png") ([System.Drawing.Color]::FromArgb(255, 37, 59, 69))
Make-Table (Join-Path $output "table-crimson.png") ([System.Drawing.Color]::FromArgb(255, 82, 48, 45))
Make-Table (Join-Path $output "table-violet.png") ([System.Drawing.Color]::FromArgb(255, 61, 49, 70))
Make-CardBase (Join-Path $output "card-rock.png") "src/assets/cards/rock-card-simple.png" ([System.Drawing.Color]::FromArgb(255, 101, 49, 45))
Make-CardBase (Join-Path $output "card-paper.png") "src/assets/cards/paper-card-simple.png" ([System.Drawing.Color]::FromArgb(255, 42, 75, 79))
Make-CardBase (Join-Path $output "card-scissors.png") "src/assets/cards/scissors-card-simple.png" ([System.Drawing.Color]::FromArgb(255, 67, 52, 77))

Get-ChildItem $output -File | Select-Object Name, Length
