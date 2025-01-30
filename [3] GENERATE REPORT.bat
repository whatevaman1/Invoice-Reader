@echo off
:: Navigate to the 'core' folder
cd Core

:: Install npm dependencies
echo Generating Report...
node genrate.js

:: Confirm completion
echo Press any key to exit.
pause
