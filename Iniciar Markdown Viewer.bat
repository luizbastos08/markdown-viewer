@echo off
echo ==========================================
echo   Markdown Viewer - Iniciando...
echo ==========================================
cd /d "%~dp0app"

if not exist "node_modules" (
    echo.
    echo Dependencias nao encontradas. Instalando...
    echo Isso pode levar alguns minutos na primeira vez.
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo ERRO: Falha ao instalar dependencias.
        echo Certifique-se de que o Node.js esta instalado.
        pause
        exit /b 1
    )
)

echo.
echo Iniciando servidor...
start "Markdown Viewer Server" cmd /c "npm run dev"

echo.
echo Aguardando servidor iniciar...
timeout /t 4 /nobreak >nul

echo Abrindo navegador...
start http://localhost:3000

echo.
echo ==========================================
echo   Pronto! O navegador sera aberto.
echo   NAO FECHE esta janela enquanto usar.
echo ==========================================
pause
