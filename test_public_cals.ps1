$outlook = New-Object -ComObject Outlook.Application
$namespace = $outlook.GetNamespace("MAPI")

$result = @()
$publicStore = $namespace.Stores | Where-Object { $_.DisplayName -match "Public Folders" }
if ($publicStore) {
    $root = $publicStore.GetRootFolder()
    function FindCals($folder) {
        try {
            if ($folder.DefaultItemType -eq 1) {
                $result += [PSCustomObject]@{
                    Path = $folder.FolderPath
                    Name = $folder.Name
                    Items = $folder.Items.Count
                }
            }
            foreach ($sub in $folder.Folders) {
                FindCals $sub
            }
        } catch {}
    }
    FindCals $root
}
$result | ConvertTo-Json
