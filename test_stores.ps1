$outlook = New-Object -ComObject Outlook.Application
$namespace = $outlook.GetNamespace("MAPI")

$result = @()
foreach ($store in $namespace.Stores) {
    try {
        $root = $store.GetRootFolder()
        foreach ($folder in $root.Folders) {
            if ($folder.DefaultItemType -eq 1 -or $folder.Name -match "Lịch|Calendar|Vũng Tàu") {
                $result += [PSCustomObject]@{
                    Store = $store.DisplayName
                    Folder = $folder.Name
                    Items = $folder.Items.Count
                }
            }
        }
    } catch {}
}
$result | ConvertTo-Json
