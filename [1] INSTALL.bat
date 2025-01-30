@echo off
:: Navigate to the 'core' folder
cd Core

:: Install npm dependencies
echo Installing npm packages in the 'core' folder...
npm install

:: Confirm completion
echo All packages installed. Press any key to exit.
pause
