param(
    [Parameter(Mandatory = $true)][string]$InputDocx,
    [Parameter(Mandatory = $true)][string]$OutputPdf,
    [switch]$SkipFieldUpdate
)

$inputPath = (Resolve-Path -LiteralPath $InputDocx).Path
$outputPath = [System.IO.Path]::GetFullPath($OutputPdf)
$word = $null
$document = $null

try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0
    $document = $word.Documents.Open($inputPath, $false, $false)

    if (-not $SkipFieldUpdate) {
        foreach ($toc in $document.TablesOfContents) {
            $toc.Update()
        }
        $document.Fields.Update() | Out-Null
        foreach ($section in $document.Sections) {
            $section.Headers.Item(1).Range.Fields.Update() | Out-Null
            $section.Footers.Item(1).Range.Fields.Update() | Out-Null
        }
    }

    $document.Save()
    $document.ExportAsFixedFormat($outputPath, 17)
}
finally {
    if ($null -ne $document) {
        $document.Close($false)
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($document) | Out-Null
    }
    if ($null -ne $word) {
        $word.Quit()
        [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
    }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}
