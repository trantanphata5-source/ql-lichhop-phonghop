$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
try {
    $outlook = New-Object -ComObject Outlook.Application
    $namespace = $outlook.GetNamespace("MAPI")
    
    $calendarsToFetch = @()
    
    # 1. Lấy lịch mặc định (Calendar) - ĐÃ TẮT ĐỂ CHỈ ĐỌC LỊCH CÔNG TY
    # try {
    #     $defaultCal = $namespace.GetDefaultFolder(9)
    #     if ($defaultCal) { $calendarsToFetch += $defaultCal }
    # } catch {}

    # 2. Lấy lịch Công Ty Điện Lực Vũng Tàu qua EntryID
    try {
        $vungTauCal = $namespace.GetFolderFromID("00000000D57E49FD0E10B049AE240DF2782E0F4A01007A34EEF7D1450C4FB7006319AEA94E7E00000000010D0000")
        if ($vungTauCal) { $calendarsToFetch += $vungTauCal }
    } catch {}

    $result = @()
    $now = Get-Date
    $startStr = $now.AddDays(-30).ToString("g")
    $endStr = $now.AddDays(30).ToString("g")
    $filter = "[Start] >= '$startStr' AND [Start] <= '$endStr'"

    foreach ($cal in $calendarsToFetch) {
        try {
            $items = $cal.Items
            $items.IncludeRecurrences = $true
            $items.Sort("[Start]")
            $restricted = $items.Restrict($filter)

            foreach ($item in $restricted) {
                try {
                    $result += [PSCustomObject]@{
                        title = $item.Subject
                        start = $item.Start.ToString("yyyy-MM-ddTHH:mm:ss")
                        end = $item.End.ToString("yyyy-MM-ddTHH:mm:ss")
                        location = $item.Location
                    }
                } catch {}
            }
        } catch {}
    }
    
    $json = $result | ConvertTo-Json -Depth 2 -Compress
    Write-Output $json
} catch {
    Write-Error $_.Exception.Message
}
