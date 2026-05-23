$outlook = New-Object -ComObject Outlook.Application
$navPane = $outlook.ActiveExplorer().NavigationPane
$calModule = $navPane.Modules.GetNavigationModule(1) # olModuleCalendar

$result = @()
foreach ($group in $calModule.NavigationGroups) {
    foreach ($navFolder in $group.NavigationFolders) {
        try {
            $folder = $navFolder.Folder
            $result += [PSCustomObject]@{
                Group = $group.Name
                Name = $navFolder.DisplayName
                FolderPath = $folder.FolderPath
                ItemCount = $folder.Items.Count
                EntryID = $folder.EntryID
            }
        } catch {}
    }
}
$result | ConvertTo-Json
