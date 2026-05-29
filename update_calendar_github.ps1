$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "Äang láº¥y dá»¯ liá»‡u lá»‹ch tá»« Outlook..."
$scriptPath = Join-Path $PSScriptRoot "fetch_outlook.ps1"
$outputPath = Join-Path $PSScriptRoot "public\debug_events.json"

try {
    # Cháº¡y script láº¥y lá»‹ch trong cÃ¹ng tiáº¿n trÃ¬nh Ä‘á»ƒ giá»¯ nguyÃªn Encoding
    $json = . $scriptPath
    
    # Kiá»ƒm tra tÃ­nh há»£p lá»‡ cá»§a JSON trÆ°á»›c khi ghi Ä‘Ã¨
    $testParse = $json | ConvertFrom-Json
    
    # Ghi Ä‘Ã¨ file JSON báº±ng UTF-8 chuáº©n (khÃ´ng BOM)
    [System.IO.File]::WriteAllText($outputPath, $json, [System.Text.Encoding]::UTF8)
    Write-Host "ÄÃ£ cáº­p nháº­t dá»¯ liá»‡u má»›i vÃ o: $outputPath"
    
    # Kiá»ƒm tra vÃ  tá»± Ä‘á»™ng Ä‘áº©y lÃªn GitHub náº¿u cÃ³ Git
    if (git rev-parse --is-inside-work-tree 2>$null) {
        Write-Host "Äang kiá»ƒm tra tráº¡ng thÃ¡i Git..."
        git add public/debug_events.json
        $status = git status --porcelain public/debug_events.json
        if ($status) {
            $currentTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            git commit -m "Cáº­p nháº­t dá»¯ liá»‡u lá»‹ch: $currentTime"
            git push
            Write-Host "ÄÃ£ Ä‘áº©y dá»¯ liá»‡u má»›i lÃªn GitHub thÃ nh cÃ´ng!"
        } else {
            Write-Host "KhÃ´ng cÃ³ dá»¯ liá»‡u má»›i thay Ä‘á»•i."
        }
    } else {
        Write-Host "LÆ°u Ã½: ThÆ° má»¥c chÆ°a Ä‘Æ°á»£c khá»Ÿi táº¡o Git hoáº·c chÆ°a liÃªn káº¿t GitHub."
    }
} catch {
    Write-Error "Lá»—i xáº£y ra trong quÃ¡ trÃ¬nh cáº­p nháº­t: $_"
}
