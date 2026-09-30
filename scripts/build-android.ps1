param(
    [string]$SdkRoot = $env:ANDROID_SDK_ROOT,
    [string]$JavaHome = $env:JAVA_HOME
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
if (!$SdkRoot) { $SdkRoot = 'F:\AI\tools\android-sdk' }
if (!$JavaHome) { $JavaHome = Split-Path -Parent (Split-Path -Parent (Get-Command javac).Source) }
$platformJar = Get-ChildItem -LiteralPath $SdkRoot -Recurse -Filter android.jar | Sort-Object FullName -Descending | Select-Object -First 1
$aapt = Get-ChildItem -LiteralPath $SdkRoot -Recurse -Filter aapt2.exe | Sort-Object FullName -Descending | Select-Object -First 1
if (!$platformJar -or !$aapt) { throw '请先安装 Android SDK Platform 35 和 Build Tools 35，并设置 ANDROID_SDK_ROOT。' }
$toolsDir = $aapt.Directory.FullName
$buildDir = Join-Path $projectRoot 'android\build'
$outputDir = Join-Path $projectRoot 'android\output'
$signDir = Join-Path $projectRoot 'android\.signing'
New-Item -ItemType Directory -Force $buildDir,$outputDir,$signDir,(Join-Path $buildDir 'classes'),(Join-Path $buildDir 'dex') | Out-Null
function Run-Tool([string]$Executable, [string[]]$Arguments) {
    & $Executable @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Executable 执行失败：$LASTEXITCODE" }
}
Push-Location $projectRoot
try {
    Run-Tool 'node' @('scripts/build.mjs')
    Run-Tool $aapt.FullName @('compile','--dir','android/res','-o',"$buildDir/resources.zip")
    Run-Tool $aapt.FullName @('link','-I',$platformJar.FullName,'--manifest','android/AndroidManifest.xml','-R',"$buildDir/resources.zip",'-o',"$buildDir/unsigned.apk",'--auto-add-overlay')
    $assetDir = Join-Path $buildDir 'assets'
    if (Test-Path $assetDir) {
        if ([IO.Path]::GetFullPath($assetDir) -ne (Join-Path ([IO.Path]::GetFullPath($projectRoot)) 'android\build\assets')) { throw 'Invalid assets directory' }
        Remove-Item -LiteralPath $assetDir -Recurse -Force
    }
    Copy-Item -LiteralPath (Join-Path $projectRoot 'dist') -Destination $assetDir -Recurse
    Run-Tool "$JavaHome/bin/jar.exe" @('uf',"$buildDir/unsigned.apk",'-C',$buildDir,'assets')
    Run-Tool "$JavaHome/bin/javac.exe" @('-encoding','UTF-8','--release','8','-classpath',$platformJar.FullName,'-d',"$buildDir/classes",'android/src/com/studypinyin/app/MainActivity.java')
    $classFiles = @(Get-ChildItem "$buildDir/classes" -Recurse -Filter '*.class' | ForEach-Object FullName)
    # Invoke D8 directly so the chosen JDK is also used by Android Build Tools.
    Run-Tool "$JavaHome/bin/java.exe" (@('-cp',"$toolsDir/lib/d8.jar",'com.android.tools.r8.D8','--lib',$platformJar.FullName,'--min-api','26','--output',"$buildDir/dex") + $classFiles)
    Push-Location "$buildDir/dex"
    try { Run-Tool "$JavaHome/bin/jar.exe" @('uf',"$buildDir/unsigned.apk",'classes.dex') } finally { Pop-Location }
    Run-Tool "$toolsDir/zipalign.exe" @('-f','-p','4',"$buildDir/unsigned.apk", "$buildDir/aligned.apk")
    $keyStore = Join-Path $signDir 'pinyin-local.p12'
    $passwordFile = Join-Path $signDir 'password.txt'
    if (!(Test-Path $keyStore)) {
        $randomBytes = New-Object byte[] 32
        $random = [System.Security.Cryptography.RandomNumberGenerator]::Create()
        $random.GetBytes($randomBytes)
        $random.Dispose()
        [IO.File]::WriteAllText($passwordFile, [Convert]::ToBase64String($randomBytes))
        Run-Tool "$JavaHome/bin/keytool.exe" @('-genkeypair','-keystore',$keyStore,'-storetype','PKCS12','-storepass:file',$passwordFile,'-alias','pinyin-local','-keyalg','RSA','-keysize','2048','-validity','10000','-dname','CN=Pinyin Planet Local, OU=Learning, O=StudyPinyin, C=CN')
    }
    if (!(Test-Path $passwordFile)) { throw '缺少签名密码文件，请恢复 android/.signing 的备份。' }
    $apk = Join-Path $outputDir 'pinyin-planet-1.0.0.apk'
    Run-Tool "$JavaHome/bin/java.exe" @('-jar',"$toolsDir/lib/apksigner.jar",'sign','--ks',$keyStore,'--ks-key-alias','pinyin-local','--ks-pass',"file:$passwordFile",'--out',$apk,"$buildDir/aligned.apk")
    Run-Tool "$JavaHome/bin/java.exe" @('-jar',"$toolsDir/lib/apksigner.jar",'verify','--verbose',$apk)
    Run-Tool "$toolsDir/zipalign.exe" @('-c','4',$apk)
    Write-Host "APK 已生成：$apk"
} finally { Pop-Location }
