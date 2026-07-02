@echo off
REM Usage: run-test.bat [env] [headless] [args...]
REM Example: run-test.bat uat true --project=admin
REM          run-test.bat test false --project=customer

setlocal enabledelayedexpansion

if "%1"=="" (
  echo Usage: run-test.bat [env] [headless] [test-args...]
  echo Example: run-test.bat uat true --project=admin tests/admin/tc01-onboarding-goldloan.spec.ts
  echo Example: run-test.bat test false --project=customer
  exit /b 1
)

set TARGET_ENV=%1
set HEADLESS=%2
shift
shift

echo Running tests with TARGET_ENV=%TARGET_ENV% HEADLESS=%HEADLESS%
npx playwright test %*

endlocal
