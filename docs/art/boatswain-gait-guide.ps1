# Authoring diagram only: this is not game artwork or a gameplay test.
Add-Type -AssemblyName System.Drawing
$guide = [System.Drawing.Bitmap]::new(1536,1024)
$drawing = [System.Drawing.Graphics]::FromImage($guide)
$drawing.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$drawing.Clear([System.Drawing.Color]::White)
$nearInk = [System.Drawing.Pen]::new([System.Drawing.Color]::DarkOrange,22)
$farInk = [System.Drawing.Pen]::new([System.Drawing.Color]::SteelBlue,18)
$bodyInk = [System.Drawing.Pen]::new([System.Drawing.Color]::DimGray,28)
$headInk = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::DimGray)
$font = [System.Drawing.Font]::new('Arial',18)
$poses = @(
  @{name='1 NEAR contact'; near=@(284,358,330,435); far=@(204,360,150,435)},
  @{name='2 NEAR support'; near=@(246,356,245,435); far=@(188,360,180,403)},
  @{name='3 FAR passing'; near=@(226,361,216,435); far=@(279,355,265,407)},
  @{name='4 FAR contact'; near=@(204,360,150,435); far=@(284,358,330,435)},
  @{name='5 FAR support'; near=@(188,360,180,403); far=@(246,356,245,435)},
  @{name='6 NEAR passing'; near=@(279,355,265,407); far=@(226,361,216,435)}
)
for ($index=0; $index -lt $poses.Count; $index++) {
  $originX = ($index % 3)*512
  $originY = [Math]::Floor($index/3)*512
  $drawing.TranslateTransform($originX,$originY)
  $drawing.DrawString($poses[$index].name,$font,[System.Drawing.Brushes]::Black,140,475)
  $drawing.FillEllipse($headInk,215,50,85,85)
  $drawing.DrawLine($bodyInk,240,145,240,290)
  $drawing.DrawLine($bodyInk,240,175,295,230)
  foreach ($leg in @('far','near')) {
    $joints = $poses[$index][$leg]
    $ink = if ($leg -eq 'near') {$nearInk} else {$farInk}
    $drawing.DrawLine($ink,240,290,$joints[0],$joints[1])
    $drawing.DrawLine($ink,$joints[0],$joints[1],$joints[2],$joints[3]-10)
    $drawing.DrawLine($ink,$joints[2]-8,$joints[3],$joints[2]+31,$joints[3])
  }
  $drawing.ResetTransform()
}
$guidePath = Join-Path $PSScriptRoot 'boatswain-gait-guide.png'
$guide.Save($guidePath,[System.Drawing.Imaging.ImageFormat]::Png)
$drawing.Dispose(); $guide.Dispose(); $nearInk.Dispose(); $farInk.Dispose(); $bodyInk.Dispose(); $headInk.Dispose(); $font.Dispose()
