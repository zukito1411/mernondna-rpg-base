Add-Type -AssemblyName System.Drawing
$output = Join-Path $PSScriptRoot '..\public\icons'
New-Item -ItemType Directory -Path $output -Force | Out-Null
foreach ($size in @(192, 512)) {
  $bitmap = [System.Drawing.Bitmap]::new($size, $size)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.ScaleTransform($size / 512, $size / 512)
  $background = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(23, 27, 24))
  $green = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(24, 40, 34))
  $gold = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(224, 184, 102))
  $light = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(250, 231, 174))
  $red = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(143, 61, 50))
  $dark = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(56, 40, 27))
  $ring = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(216, 174, 88), 13)
  $outer = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(113, 89, 53), 12)
  $inner = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(120, 166, 168, 123), 4)
  $graphics.FillRectangle($background, 0, 0, 512, 512)
  $graphics.DrawEllipse($outer, 68, 68, 376, 376)
  $graphics.FillEllipse($green, 99, 99, 314, 314)
  $graphics.DrawEllipse($ring, 99, 99, 314, 314)
  $graphics.DrawEllipse($inner, 129, 129, 254, 254)
  $point = { param($x, $y) [System.Drawing.PointF]::new([float]$x, [float]$y) }
  $graphics.FillPolygon($gold, @((& $point 256 93), (& $point 272 142), (& $point 256 166), (& $point 240 142)))
  $graphics.FillPolygon($gold, @((& $point 256 419), (& $point 272 370), (& $point 256 346), (& $point 240 370)))
  $graphics.FillPolygon($gold, @((& $point 93 256), (& $point 142 240), (& $point 166 256), (& $point 142 272)))
  $graphics.FillPolygon($gold, @((& $point 419 256), (& $point 370 240), (& $point 346 256), (& $point 370 272)))
  $graphics.FillPolygon($light, @((& $point 256 150), (& $point 307 256), (& $point 256 256)))
  $graphics.FillPolygon($gold, @((& $point 256 150), (& $point 205 256), (& $point 256 256)))
  $graphics.FillPolygon($red, @((& $point 256 362), (& $point 205 256), (& $point 256 256)))
  $graphics.FillPolygon($gold, @((& $point 256 362), (& $point 307 256), (& $point 256 256)))
  $graphics.FillEllipse($light, 233, 233, 46, 46)
  $graphics.FillEllipse($dark, 241, 241, 30, 30)
  $bitmap.Save((Join-Path $output "mernondna-$size.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  foreach ($item in @($background,$green,$gold,$light,$red,$dark,$ring,$outer,$inner)) { $item.Dispose() }
  $graphics.Dispose()
  $bitmap.Dispose()
}
