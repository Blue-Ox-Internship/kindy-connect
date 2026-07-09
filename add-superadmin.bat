@echo off
echo Adding superadmin user 'admin' to database...
echo.

psql "postgresql://postgres.zgkjvkchapfwbqdsmsdt:gEen6Gefr63OcvLz@aws-1-eu-west-2.pooler.supabase.com:5432/postgres" -f database\add-quick-superadmin.sql

echo.
echo Done! You can now login with:
echo ID: admin
echo Password: admin123
echo.
pause
