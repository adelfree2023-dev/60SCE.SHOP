# =============================================================================
#  APEX PROJECT COLLECTOR - SECURE & OPTIMIZED EDITION 🛡️
#  Features: Split Map/Code, Deep Stats, Security Filters, Noise Reduction
# =============================================================================

# 1. إعداد المسارات
$CurrentScriptPath = $PSScriptRoot
# تنبيه: هذا السطر يفترض أن السكربت بداخل مجلد فرعي (مثل tools). 
# إذا كان السكربت في المجلد الرئيسي للمشروع، غير السطر التالي ليصبح: $ParentProjectDir = $CurrentScriptPath
$ParentProjectDir = Split-Path -Parent $CurrentScriptPath 

# أسماء الملفات الناتجة
$MapFileName = "Apex_2026_Structure_Map.txt"
$CodeFileName = "Apex_2026_Full_Codebase.txt"

$MapFilePath = Join-Path $CurrentScriptPath $MapFileName
$CodeFilePath = Join-Path $CurrentScriptPath $CodeFileName

# 2. إعداد الفلاتر (تحديثات لتقليل الحجم والحماية)

# أ- مجلدات لا قيمة لها للذكاء الاصطناعي
$ExcludedFolders = @(
    "node_modules", ".git", ".idea", ".vscode", 
    "dist", "build", "coverage", "update", "bin", "obj", 
    ".next", ".nest", "assets", "public" # تمت إضافة assets و public لتقليل الحشو
)

# ب- امتدادات مسموحة (تم حذف env منها)
$AllowedExtensions = "\.(ts|js|json|html|css|scss|md|txt|java|py|cs|cpp|h|sql|prisma|ps1|sh|yml|yaml|xml|razor)$"

# ج- [جديد] ملفات محظورة بالاسم (لتقليل الحجم والحماية)
$BlockedFileNames = @(
    "package-lock.json", "yarn.lock", "pnpm-lock.yaml", # ملفات ضخمة جداً وغير مفيدة للكود
    ".env", ".env.local", ".env.production",            # ملفات أمنية خطيرة
    "npm-debug.log", ".DS_Store"                        # ملفات نظام
)

# د- [جديد] أنماط حساسة (Regex) للحماية القصوى
$SensitivePatterns = @(
    "^\.env.*$",        # أي ملف يبدأ بـ .env
    ".*\.key$",         # مفاتيح خاصة
    ".*\.pem$",         # شهادات
    ".*secrets.*\.json$" # ملفات أسرار
)

# 3. دالة استخراج الوصف (كما هي)
function Get-FileDescription {
    param([string]$FilePath)
    try {
        $Lines = Get-Content -Path $FilePath -TotalCount 10 -ErrorAction SilentlyContinue
        foreach ($Line in $Lines) {
            $l = $Line.Trim()
            if ([string]::IsNullOrWhiteSpace($l)) { continue }
            if ($l -match "^(import|package|require|const|let|var|export|class|interface|type|async|function|return|namespace|using)") { 
                if ($l -notmatch "^@") { return "" }
            }
            if ($l.StartsWith("//") -or $l.StartsWith("/*") -or $l.StartsWith("*") -or $l.StartsWith("#")) {
                $clean = $l -replace "^/{2,}\s*", "" -replace "^\/\*+\s*", "" -replace "^\*\s*", "" -replace "\*\/$", "" -replace "^#\s*", ""
                if ($clean.Length -gt 4 -and $clean -notmatch "^eslint") { 
                    if ($clean.Length -gt 50) { $clean = $clean.Substring(0, 47) + "..." }
                    return " ➤ $clean" 
                }
            }
            if ($l -match "@Controller") { return " ➤ [API Endpoint]" }
            if ($l -match "@Injectable") { return " ➤ [Service Logic]" }
            if ($l -match "@Entity") { return " ➤ [Database Entity]" }
        }
    } catch {}
    return ""
}

# 4. تنظيف القديم
if (Test-Path $MapFilePath) { Remove-Item $MapFilePath -Force -ErrorAction SilentlyContinue }
if (Test-Path $CodeFilePath) { Remove-Item $CodeFilePath -Force -ErrorAction SilentlyContinue }

# 5. جمع الملفات (مع تطبيق الفلاتر الجديدة)
Write-Host "🔍 Scanning Directory: $ParentProjectDir" -ForegroundColor Cyan

$AllFiles = Get-ChildItem -Path $ParentProjectDir -Recurse -File | 
    Where-Object { 
        $File = $_
        $RelPath = $File.FullName.Substring($ParentProjectDir.Length)
        
        # 1. فلتر المجلدات
        $IsExcludedFolder = ($ExcludedFolders | Where-Object { $RelPath -match [regex]::Escape($_) })
        if ($IsExcludedFolder) { return $false }

        # 2. فلتر الامتداد
        if ($File.Extension -notmatch $AllowedExtensions) { return $false }

        # 3. [حماية] فلتر الأسماء المحظورة (Lockfiles + .env)
        if ($BlockedFileNames -contains $File.Name) { return $false }

        # 4. [حماية] فلتر الأنماط الحساسة
        foreach ($Pattern in $SensitivePatterns) {
            if ($File.Name -match $Pattern) { 
                Write-Warning "🚫 Security Block: Skipped sensitive file [$($File.Name)]"
                return $false 
            }
        }

        return $true
    }

# =============================================================================
# مرحلة 1: الحساب المسبق للإحصائيات
# =============================================================================
Write-Host "🧮 Calculating Deep Stats (Chars, Words, Tokens)..." -ForegroundColor Yellow

$Stats = @{
    Files = $AllFiles.Count
    Lines = 0
    Words = 0
    Chars = 0
    Tokens = 0
}

foreach ($File in $AllFiles) {
    try {
        $Text = [System.IO.File]::ReadAllText($File.FullName)
        $Stats.Chars += $Text.Length
        $FileLines = $Text.Split("`n").Count
        $Stats.Lines += $FileLines
        $FileWords = $Text.Split([char[]]@(' ', "`t", "`n", "`r"), [StringSplitOptions]::RemoveEmptyEntries).Count
        $Stats.Words += $FileWords
    } catch { 
        Write-Warning "Could not read stats for $($File.Name)" 
    }
}

$Stats.Tokens = [Math]::Round($Stats.Chars / 4)
$FmtLines  = "{0:N0}" -f $Stats.Lines
$FmtWords  = "{0:N0}" -f $Stats.Words
$FmtChars  = "{0:N0}" -f $Stats.Chars
$FmtTokens = "{0:N0}" -f $Stats.Tokens

# =============================================================================
# مرحلة 2: إنشاء ملف خريطة المشروع
# =============================================================================
Write-Host "🗺️  Generating Structure Map..." -ForegroundColor Green

$MapStream = [System.IO.StreamWriter]::new($MapFilePath, $false, [System.Text.Encoding]::UTF8)

try {
    $MapStream.WriteLine("========================================================")
    $MapStream.WriteLine("🗺️  PROJECT STRUCTURE MAP")
    $MapStream.WriteLine("========================================================")
    $MapStream.WriteLine("📅 Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm')")
    $MapStream.WriteLine("📂 Files Included: $($Stats.Files)")
    $MapStream.WriteLine("🚫 Noise Filtered: Lockfiles, Logs, Assets")
    $MapStream.WriteLine("🔒 Security Filter: ACTIVE")
    $MapStream.WriteLine("========================================================`n")

    function Write-DirTree {
        param([string]$Path, [string]$Indent)
        # تطبيق نفس الفلاتر هنا للعرض في الخريطة
        $Items = Get-ChildItem -Path $Path | Where-Object {
            $n = $_.Name
            $n -notin $ExcludedFolders -and 
            $n -notin $BlockedFileNames -and
            ($_.PSIsContainer -or ($_.Extension -match $AllowedExtensions -and $n -notmatch "^\.env"))
        }
        $Count = $Items.Count; $i = 0
        foreach ($Item in $Items) {
            $i++; $IsLast = ($i -eq $Count)
            $Prefix = if ($IsLast) { "└── " } else { "├── " }
            $ChildIndent = if ($IsLast) { "    " } else { "│   " }
            
            if ($Item.PSIsContainer) {
                $MapStream.WriteLine("$Indent$Prefix📂 $($Item.Name)")
                Write-DirTree -Path $Item.FullName -Indent "$Indent$ChildIndent"
            } else {
                $Desc = Get-FileDescription -FilePath $Item.FullName
                $MapStream.WriteLine("$Indent$Prefix📄 $($Item.Name)$Desc")
            }
        }
    }
    Write-DirTree -Path $ParentProjectDir -Indent ""
}
finally { $MapStream.Close(); $MapStream.Dispose() }

# =============================================================================
# مرحلة 3: إنشاء ملف الأكواد الكامل
# =============================================================================
Write-Host "📦 Archiving Code Content..." -ForegroundColor Green

$CodeStream = [System.IO.StreamWriter]::new($CodeFilePath, $false, [System.Text.Encoding]::UTF8)

try {
    $CodeStream.WriteLine("################################################################################")
    $CodeStream.WriteLine("#  APEX PROJECT CODEBASE ARCHIVE")
    $CodeStream.WriteLine("################################################################################")
    $CodeStream.WriteLine("#")
    $CodeStream.WriteLine("#  📊 STATISTICS SUMMARY:")
    $CodeStream.WriteLine("#  ---------------------")
    $CodeStream.WriteLine("#  📂 Total Files : $($Stats.Files)")
    $CodeStream.WriteLine("#  📝 Total Lines : $FmtLines")
    $CodeStream.WriteLine("#  🔤 Total Words : $FmtWords")
    $CodeStream.WriteLine("#  🧮 Total Chars : $FmtChars")
    $CodeStream.WriteLine("#  🪙 Est. Tokens : $FmtTokens (Approx. for LLM Context)")
    $CodeStream.WriteLine("#")
    $CodeStream.WriteLine("################################################################################`n")

    $Counter = 0
    foreach ($File in $AllFiles) {
        $Counter++
        $Percent = [math]::Round(($Counter / $Stats.Files) * 100)
        Write-Progress -Activity "Writing Code File..." -Status "$($File.Name)" -PercentComplete $Percent

        # إخفاء المسار الكامل في الملف الناتج لحماية الخصوصية
        $SafePath = $File.FullName.Replace($ParentProjectDir, "")

        $CodeStream.WriteLine("`n/*******************************************************************************")
        $CodeStream.WriteLine(" * FILE: $($File.Name)")
        $CodeStream.WriteLine(" * PATH: .$SafePath")
        $CodeStream.WriteLine(" *******************************************************************************/")
        
        try {
            $Content = [System.IO.File]::ReadAllText($File.FullName)
            $CodeStream.WriteLine($Content)
        } catch { 
            $CodeStream.WriteLine("[ERROR READING FILE CONTENT]") 
        }
    }
}
finally { $CodeStream.Close(); $CodeStream.Dispose() }

Write-Host "`n✅ SUCCESS!" -ForegroundColor Green
Write-Host "   1️⃣  Map File  : $MapFileName"
Write-Host "   2️⃣  Code File : $CodeFileName (Tokens: $FmtTokens)"