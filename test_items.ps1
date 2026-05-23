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
$result = @()
for ($i = 1; $i -le 5; $i++) {
    try {
        $item = $items.Item($i)
        $result += [PSCustomObject]@{
            title = $item.Subject
            start = $item.Start.ToString()
        }
    } catch {}
}
$result | ConvertTo-Json
