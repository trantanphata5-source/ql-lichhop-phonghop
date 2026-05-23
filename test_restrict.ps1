$outlook = New-Object -ComObject Outlook.Application
$navPane = $outlook.ActiveExplorer().NavigationPane
$calModule = $navPane.Modules.GetNavigationModule(1)
$targetFolder = $null
foreach ($group in $calModule.NavigationGroups) {
    foreach ($navFolder in $group.NavigationFolders) {
        if ($navFolder.DisplayName -match "Vung Tau|Vũng Tàu") {
            $targetFolder = $navFolder.Folder
            break
        }
    }
    if ($targetFolder) { break }
}

$items = $targetFolder.Items
$items.IncludeRecurrences = $true
$items.Sort("[Start]")

$now = Get-Date
$startStr = $now.AddDays(-30).ToString("d", [System.Globalization.CultureInfo]::InvariantCulture) + " 00:00"
$endStr = $now.AddDays(30).ToString("d", [System.Globalization.CultureInfo]::InvariantCulture) + " 23:59"

$filter = "[Start] >= '$startStr' AND [Start] <= '$endStr'"
$restricted = $items.Restrict($filter)

$result = @()
foreach ($item in $restricted) {
    try {
        $result += [PSCustomObject]@{
            title = $item.Subject
            start = $item.Start.ToString()
        }
    } catch {}
}
$result.Count
