@ECHO OFF
REM Ovaj projekat treba Node >=20.9 (Next 16); sistemski Node je 20.5.0.
REM Dok se sistemski Node ne podigne, koristimo lokalni Node 24 postavljen
REM samo za ovaj projekat, bez diranja sistemskog PATH-a.
SET "PATH=C:\Users\Pufi\AppData\Local\nodejs-lts-v24\node-v24.19.0-win-x64;%PATH%"
CD /D "%~dp0.."
CALL npm run dev
