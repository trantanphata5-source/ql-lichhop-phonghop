$outlook = New-Object -ComObject Outlook.Application
$namespace = $outlook.GetNamespace("MAPI")
$folder = $namespace.GetFolderFromID("00000000D57E49FD0E10B049AE240DF2782E0F4A01007A34EEF7D1450C4FB7006319AEA94E7E00000000010D0000")
$folder.Items.Count
