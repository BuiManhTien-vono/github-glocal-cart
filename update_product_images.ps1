
$connectionString = "Server=(localdb)\mssqllocaldb;Database=GlocalCartDb;Trusted_Connection=True;TrustServerCertificate=True"
$imageDir = "d:\Global_Cart_DA\Global_Cart\GlocalCart (1).API\wwwroot\images\products"

# Mapping: partial product name keyword -> image filename
$mappings = @(
    @{ keyword = "iPhone"; file = "iphone15pro.png" },
    @{ keyword = "AirPods"; file = "airpods_pro2.png" },
    @{ keyword = "MacBook"; file = "macbook_air_m2.png" },
    @{ keyword = "Silicone"; file = "op_lung_silicone.png" },
    @{ keyword = "mi nam"; file = "ao_so_mi_nam.png" },
    @{ keyword = "Jean"; file = "quan_jean_nam.png" },
    @{ keyword = "Sneaker"; file = "giay_sneaker.png" },
    @{ keyword = "Sony"; file = "tai_nghe_sony.png" },
    @{ keyword = "chien"; file = "noi_chien_khong_dau.png" },
    @{ keyword = "hong ngoai"; file = "bep_tu_doi.png" },
    @{ keyword = "phim co"; file = "ban_phim_co.png" },
    @{ keyword = "Logitech"; file = "chuot_logitech.png" },
    @{ keyword = "quan ao"; file = "tu_quan_ao_go.png" },
    @{ keyword = "Ergonomic"; file = "ghe_ergonomic.png" },
    @{ keyword = "Duong Da"; file = "tinh_chat_duong_da.png" },
    @{ keyword = "Cetaphil"; file = "sua_rua_mat_cetaphil.png" }
)

Add-Type -AssemblyName "System.Data"
$conn = New-Object System.Data.SqlClient.SqlConnection($connectionString)
$conn.Open()
Write-Host "Connected to SQL Server!" -ForegroundColor Green

# Get all products
$cmdAll = $conn.CreateCommand()
$cmdAll.CommandText = "SELECT p.Id as ProductId, p.Name, pi.Id as ImageId FROM Products p LEFT JOIN ProductImages pi ON pi.ProductId = p.Id AND pi.IsMain = 1"
$reader = $cmdAll.ExecuteReader()
$products = @()
while ($reader.Read()) {
    $products += @{
        ProductId = $reader["ProductId"]
        Name = $reader["Name"].ToString()
        ImageId = if ($reader["ImageId"] -is [DBNull]) { $null } else { $reader["ImageId"] }
    }
}
$reader.Close()

Write-Host "Found $($products.Count) products" -ForegroundColor Cyan

foreach ($product in $products) {
    $matched = $null
    foreach ($m in $mappings) {
        if ($product.Name -like "*$($m.keyword)*") {
            $matched = $m
            break
        }
    }

    if ($null -eq $matched) {
        Write-Host "  No mapping for: $($product.Name)" -ForegroundColor Yellow
        continue
    }

    $imgPath = Join-Path $imageDir $matched.file
    if (-not (Test-Path $imgPath)) {
        Write-Host "  File missing: $($matched.file)" -ForegroundColor Red
        continue
    }

    $imgData = [System.IO.File]::ReadAllBytes($imgPath)
    $sizeKB = [math]::Round($imgData.Length / 1024, 1)
    $imageId = $product.ImageId
    $productId = $product.ProductId

    if ($null -eq $imageId) {
        # Insert new image
        $cmdInsert = $conn.CreateCommand()
        $cmdInsert.CommandText = "INSERT INTO ProductImages (ProductId, ImageData, ContentType, ImageUrl, IsMain, DisplayOrder) OUTPUT INSERTED.Id VALUES (@pid, @data, 'image/png', '', 1, 0)"
        $p1 = $cmdInsert.Parameters.Add("@data", [System.Data.SqlDbType]::VarBinary, -1)
        $p1.Value = $imgData
        $cmdInsert.Parameters.AddWithValue("@pid", $productId) | Out-Null
        $imageId = $cmdInsert.ExecuteScalar()
    }

    $newUrl = "/api/products/images/$imageId/data"

    $cmdUpdate = $conn.CreateCommand()
    $cmdUpdate.CommandText = "UPDATE ProductImages SET ImageData=@data, ContentType='image/png', ImageUrl=@url WHERE Id=@imgId; UPDATE Products SET MediaUrl=@url WHERE Id=@pid"
    $p2 = $cmdUpdate.Parameters.Add("@data", [System.Data.SqlDbType]::VarBinary, -1)
    $p2.Value = $imgData
    $cmdUpdate.Parameters.AddWithValue("@url", $newUrl) | Out-Null
    $cmdUpdate.Parameters.AddWithValue("@imgId", $imageId) | Out-Null
    $cmdUpdate.Parameters.AddWithValue("@pid", $productId) | Out-Null
    $cmdUpdate.ExecuteNonQuery() | Out-Null

    Write-Host "  OK: $($product.Name) -> $($matched.file) ($sizeKB KB)" -ForegroundColor Green
}

$conn.Close()
Write-Host ""
Write-Host "Done! Reload http://localhost:3000" -ForegroundColor Cyan
