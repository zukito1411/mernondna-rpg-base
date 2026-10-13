Add-Type -AssemblyName System.Drawing
$spiderGuide = [System.Drawing.Bitmap]::new(1024, 1024)
$spiderCanvas = [System.Drawing.Graphics]::FromImage($spiderGuide)
$spiderCanvas.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$spiderCanvas.Clear([System.Drawing.Color]::White)
$spiderPen = [System.Drawing.Pen]::new([System.Drawing.Color]::DarkSlateGray, 16)
$spiderBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::SaddleBrown)
$spiderFont = [System.Drawing.Font]::new('Arial', 28)
$spiderText = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::Black)
$spiderCanvas.FillEllipse($spiderBrush, 400, 240, 224, 300)
$spiderCanvas.FillEllipse($spiderBrush, 437, 490, 150, 150)
foreach ($spiderSide in @(-1, 1)) {
  for ($spiderLeg = 0; $spiderLeg -lt 4; $spiderLeg++) {
    $spiderAttachX = 512 + $spiderSide * 65
    $spiderAttachY = 490 + $spiderLeg * 32
    $spiderJointX = 512 + $spiderSide * (190 + (3 - $spiderLeg) * 22)
    $spiderJointY = 230 + $spiderLeg * 155
    $spiderTipX = 512 + $spiderSide * (310 - $spiderLeg * 18)
    $spiderTipY = 180 + $spiderLeg * 220
    $spiderCanvas.DrawLine($spiderPen, $spiderAttachX, $spiderAttachY, $spiderJointX, $spiderJointY)
    $spiderCanvas.DrawLine($spiderPen, $spiderJointX, $spiderJointY, $spiderTipX, $spiderTipY)
    $spiderCanvas.DrawString("$($spiderLeg + 1)", $spiderFont, $spiderText, $spiderTipX - 12, $spiderTipY - 55)
  }
}
$spiderCanvas.DrawString('ANATOMY REFERENCE ONLY: FOUR LEGS EACH SIDE', [System.Drawing.Font]::new('Arial', 20), $spiderText, 80, 940)
$spiderGuide.Save((Join-Path $PSScriptRoot 'spider-anatomy-guide.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$spiderCanvas.Dispose()
$spiderGuide.Dispose()
$spiderPen.Dispose()
$spiderBrush.Dispose()
$spiderFont.Dispose()
$spiderText.Dispose()
