# EMS Production Troubleshooting Guide

Quick reference guide for troubleshooting common issues in production environment.

## Table of Contents
1. [Connectivity Issues](#connectivity-issues)
2. [Authentication Issues](#authentication-issues)
3. [Performance Issues](#performance-issues)
4. [Database Issues](#database-issues)
5. [Frontend Issues](#frontend-issues)
6. [Notification Issues](#notification-issues)
7. [Emergency Procedures](#emergency-procedures)

---

## Connectivity Issues

### Issue: "Unable to connect to API"

**Symptoms**:
- Frontend shows connection error
- Network tab shows 0 bytes response
- CORS errors in browser console

**Diagnosis**:
```powershell
# Check if API is running
curl https://your-api-domain.com/api/health

# Check API logs
Get-Content -Path "C:\path\to\logs\*.txt" -Tail 50

# Check network connectivity
Test-NetConnection -ComputerName your-api-domain.com -Port 443
```

**Solutions**:
1. **API not responding**:
   - SSH/RDP into server
   - Check if API process is running: `Get-Process | grep dotnet`
   - Restart API service: `Restart-Service ems-api` or `sudo systemctl restart ems-api`
   - Check logs for startup errors

2. **Firewall/Network issue**:
   - Verify firewall allows port 443 (HTTPS) and 5000 (internal)
   - Check DNS resolution: `nslookup your-api-domain.com`
   - Verify routing to API server

3. **SSL/TLS certificate issue**:
   - Check certificate validity: `openssl s_client -connect your-api-domain.com:443`
   - If expired, renew immediately: `sudo certbot renew`

4. **CORS misconfiguration**:
   - Verify frontend origin is in `AllowedOrigins` in `appsettings.json`
   - Check `Program.cs` for CORS policy
   - Restart API after making changes

---

## Authentication Issues

### Issue: "Login fails with 401 Unauthorized"

**Symptoms**:
- Login form submission fails
- Console shows 401 response
- No JWT token in localStorage

**Diagnosis**:
```csharp
// Check in API logs
grep -i "authentication\|401\|unauthorized" logs/*.txt

// Test authentication endpoint directly
curl -X POST https://your-api-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin@ems.com","password":"admin123"}'
```

**Solutions**:
1. **Invalid credentials**:
   - Verify user exists in database: Check `Users` table
   - Verify password is correct (note: passwords are hashed)
   - If user doesn't exist, create new user or restore from backup

2. **JWT configuration issue**:
   - Verify JWT secret key in `appsettings.Production.json`
   - Ensure minimum 32 characters
   - Must be same across all API instances
   - Restart API after changes

3. **Token expiration**:
   - Check token expiration time in JWT settings
   - Verify server time is synchronized (NTP)
   - Increase expiration if needed: `"ExpirationMinutes": "120"`

4. **Database connectivity**:
   - Verify database connection string
   - Test connection manually using SQL tool
   - Check database credentials and permissions

### Issue: "JWT token validation fails"

**Symptoms**:
- Successfully logged in but actions return 401
- "Invalid token" error in logs
- Works for some users but not others

**Solutions**:
1. Clear localStorage and re-login:
   ```javascript
   localStorage.clear();
   location.reload();
   ```

2. Verify JWT settings are correct:
   - Check Issuer: `"EMS.API"`
   - Check Audience: `"EMS.Client"`
   - Check expiration time

3. Check user roles:
   - Verify user has assigned role (Admin, Manager, Employee)
   - Check role-based authorization attributes on controllers

4. Sync server clocks:
   ```bash
   # On Windows
   w32tm /resync
   
   # On Linux
   sudo ntpdate -s time.nist.gov
   ```

---

## Performance Issues

### Issue: "Slow API response times (>2s)"

**Symptoms**:
- Dashboard loads slowly
- List pages take long to load
- Timeouts on some requests

**Diagnosis**:
```powershell
# Check server resources
Get-Process -Name "dotnet" | Select-Object Name, CPU, Memory

# Check database query performance
# In SQL Server Management Studio, enable query statistics

# Check Application Insights
# Navigate to: Analytics > Custom query for slow operations
```

**Solutions**:

1. **Database query optimization**:
   ```sql
   -- Check for missing indexes
   SELECT * FROM sys.dm_db_missing_index_details
   
   -- Check slow queries
   SELECT * FROM sys.dm_exec_query_stats
   ORDER BY total_elapsed_time DESC
   ```

2. **Enable response caching**:
   ```csharp
   // In Program.cs
   services.AddResponseCaching();
   app.UseResponseCaching();
   
   // On controller action
   [ResponseCache(Duration = 300)] // 5 minutes
   public async Task<IActionResult> GetEmployees() { ... }
   ```

3. **Implement pagination**:
   ```csharp
   // Ensure all list endpoints use pagination
   public async Task<IActionResult> GetEmployees(int page = 1, int pageSize = 20)
   {
       var result = await _employeeService.GetEmployeesPagedAsync(page, pageSize);
       return Ok(result);
   }
   ```

4. **Scale resources**:
   - Increase server CPU if maxed
   - Increase server RAM if memory pressure
   - Add database read replicas for heavy queries
   - Enable caching layer (Redis)

### Issue: "High memory usage (>80%)"

**Symptoms**:
- Server becomes unresponsive
- OOM (Out of Memory) errors in logs
- Process crashes occasionally

**Diagnosis**:
```powershell
# Check memory usage by process
Get-Process -Name "dotnet" | Format-Table Name, @{Name="Memory (MB)";Expression={[math]::Round($_.WorkingSet/1MB)}}

# Check for memory leaks
# Review garbage collection logs in Application Insights
```

**Solutions**:

1. **Check for notification table growth**:
   ```sql
   SELECT COUNT(*) FROM Notifications; -- If > 1M, archive old records
   
   -- Archive old notifications
   DELETE FROM Notifications WHERE CreatedAt < DATEADD(MONTH, -3, GETDATE());
   ```

2. **Optimize data loading**:
   ```csharp
   // Use AsNoTracking for read-only queries
   var employees = await _context.Employees
       .AsNoTracking()
       .Where(e => e.DepartmentId == deptId)
       .ToListAsync();
   ```

3. **Implement garbage collection**
   ```csharp
   // In Program.cs
   GCSettings.IsServerGC = true;
   GCSettings.LargeObjectHeapCompactionMode = GCLargeObjectHeapCompactionMode.CompactOnce;
   ```

4. **Restart application**:
   ```powershell
   Restart-Service ems-api
   ```

---

## Database Issues

### Issue: "Database connection timeout"

**Symptoms**:
- API returns connection timeout
- "Connection timeout expired" in logs
- Application becomes unresponsive

**Diagnosis**:
```sql
-- Check if database is running
SELECT @@VERSION; -- Should return SQL Server version

-- Check connection pool
SELECT COUNT(*) FROM sys.dm_exec_connections;

-- Check wait stats
SELECT * FROM sys.dm_os_wait_stats ORDER BY wait_time_ms DESC;
```

**Solutions**:

1. **Verify database server is running**:
   ```powershell
   # SQL Server
   Get-Service | Where-Object {$_.Name -like "*SQL*"} | Select-Object Status
   
   # PostgreSQL
   sudo systemctl status postgresql
   ```

2. **Check connection string**:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Server=YOUR_SERVER;Database=EMS_Production;User Id=ems_user;Password=YOUR_PASSWORD;Connection Timeout=30;"
   }
   ```

3. **Increase connection pool size**:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "...;Max Pool Size=100;Min Pool Size=5;"
   }
   ```

4. **Check firewall/network**:
   ```powershell
   Test-NetConnection -ComputerName your-db-server -Port 1433 # SQL Server
   Test-NetConnection -ComputerName your-db-server -Port 5432 # PostgreSQL
   ```

### Issue: "Database disk space full"

**Symptoms**:
- Writes fail with "disk full" error
- API returns 500 errors
- Database stops accepting connections

**Diagnosis**:
```sql
-- Check database size
EXEC sp_helpdb 'EMS_Production';

-- Check largest tables
SELECT 
    s.Name, 
    t.Name, 
    SUM(p.rows) AS [RowCount],
    SUM(a.total_pages) * 8 AS [Total KB]
FROM sys.tables t
INNER JOIN sys.indexes i ON t.object_id = i.object_id
INNER JOIN sys.partitions p ON i.object_id = p.object_id
INNER JOIN sys.allocation_units a ON p.partition_id = a.container_id
INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
GROUP BY s.Name, t.Name
ORDER BY SUM(a.total_pages) DESC;
```

**Solutions**:

1. **Archive old data**:
   ```sql
   -- Archive notifications older than 90 days
   DELETE FROM Notifications WHERE CreatedAt < DATEADD(DAY, -90, GETDATE());
   
   -- Rebuild indexes to reclaim space
   ALTER INDEX ALL ON Notifications REBUILD;
   ```

2. **Expand disk space**:
   - Azure SQL: Scale up database tier
   - AWS RDS: Modify allocated storage
   - On-premise: Add disk space or migrate to larger disk

3. **Check log file growth**:
   ```sql
   -- Shrink log file if it's too large
   USE EMS_Production;
   DBCC SHRINKFILE(2, 100); -- 100 MB
   ```

### Issue: "Deadlock in database"

**Symptoms**:
- Random requests fail with "deadlock detected"
- Specific operations fail consistently
- Performance degrades under load

**Diagnosis**:
```sql
-- Enable deadlock tracing
DBCC TRACEON (1222, -1); -- Enable deadlock info to error log

-- Check recent deadlock info
SELECT * FROM sys.dm_exec_requests WHERE wait_type = 'LCK_M_X';
```

**Solutions**:

1. **Review transaction logic**:
   - Keep transactions short
   - Access resources in consistent order
   - Use appropriate isolation levels

2. **Add appropriate indexes**:
   ```sql
   CREATE INDEX idx_employee_department ON Employees(DepartmentId);
   CREATE INDEX idx_notification_user ON Notifications(UserId, IsRead);
   ```

3. **Update statistics**:
   ```sql
   EXEC sp_updatestats;
   ```

---

## Frontend Issues

### Issue: "Blank white page on production"

**Symptoms**:
- Page loads but nothing displays
- No errors in network tab
- Console shows errors

**Diagnosis**:
```javascript
// Check browser console for errors
// Common issues:
// - VITE_API_URL not set
// - API unreachable
// - JavaScript errors in app
```

**Solutions**:

1. **Verify API URL**:
   ```bash
   # Check in browser dev tools: Application → Environment
   # Should show: VITE_API_URL=https://your-api-domain.com
   ```

2. **Clear cache and reload**:
   ```
   Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
   Clear browsing data → Clear cache
   Reload page
   ```

3. **Check API connectivity**:
   ```javascript
   // In browser console
   fetch('https://your-api-domain.com/api/health')
     .then(r => r.json())
     .then(console.log)
     .catch(console.error);
   ```

4. **Verify build deployment**:
   - Check files exist in deployment directory
   - Verify index.html is present
   - Check file permissions (readable by web server)

### Issue: "API requests return 404"

**Symptoms**:
- Frontend loads but API calls fail with 404
- Specific endpoints not found
- Network tab shows 404 responses

**Solutions**:

1. **Verify API is running**:
   ```bash
   curl https://your-api-domain.com/api/health
   ```

2. **Check VITE_API_URL is correct**:
   - Should be: `https://your-api-domain.com` (no `/api` at end)
   - Frontend appends `/api` automatically

3. **Verify CORS policy includes frontend domain**:
   ```json
   "Cors": {
     "AllowedOrigins": ["https://yourdomain.com"]
   }
   ```

---

## Notification Issues

### Issue: "Notifications not appearing"

**Symptoms**:
- Send notification succeeds but doesn't show
- Notification dropdown shows wrong count
- WebSocket not connecting (if real-time notifications)

**Diagnosis**:
```sql
-- Check if notifications are created in database
SELECT TOP 10 * FROM Notifications ORDER BY CreatedAt DESC;

-- Check target users
SELECT * FROM Notifications WHERE UserId = 'USER_ID' ORDER BY CreatedAt DESC;
```

**Solutions**:

1. **Verify notification creation endpoint**:
   ```powershell
   $headers = @{
       "Authorization" = "Bearer YOUR_JWT_TOKEN"
       "Content-Type" = "application/json"
   }
   
   $body = @{
       title = "Test"
       message = "Test notification"
       type = "Info"
       priority = "Normal"
       targetUserId = "USER_ID"
   } | ConvertTo-Json
   
   Invoke-RestMethod -Uri "https://your-api-domain.com/api/notifications" `
       -Method Post -Headers $headers -Body $body
   ```

2. **Check notification service is initialized**:
   - Verify `INotificationService` registered in DI
   - Check `NotificationsController` exists
   - Verify endpoints are accessible

3. **Check frontend notification service**:
   ```typescript
   // In browser console
   import { notificationService } from './services/notificationService';
   notificationService.getUserNotifications()
     .then(console.log)
     .catch(console.error);
   ```

4. **Verify user can read own notifications**:
   - Check `CurrentUserService` returns correct user
   - Verify role-based access allows user to read notifications

---

## Emergency Procedures

### Full System Down

**Step 1: Assess Situation** (0-5 min)
```powershell
# Check if API is running
Test-NetConnection -ComputerName your-api-domain.com -Port 443

# Check if database is accessible
# Try connecting with SQL Server Management Studio

# Check server status
# Login to cloud provider console
```

**Step 2: Attempt Recovery** (5-15 min)
1. Restart API service: `Restart-Service ems-api`
2. Restart database service (if applicable)
3. Clear application cache
4. Restart web server

**Step 3: Rollback if Necessary** (15-30 min)
1. Restore database from last backup
2. Deploy previous API version
3. Deploy previous frontend version
4. Test all critical functions

**Step 4: Communication** (Ongoing)
- Update status page
- Notify users via email
- Post on social media if applicable
- Provide regular updates

### Database Corruption

**Immediate Actions**:
```sql
-- Integrity check
DBCC CHECKDB ('EMS_Production', REPAIR_REBUILD);

-- If corruption found and not fixed:
-- 1. Restore from most recent backup
-- 2. Rerun migrations if schema changed
```

### Memory Leak

**Diagnosis**:
```powershell
# Monitor memory over time
while($true) {
    Get-Process -Name "dotnet" | Select-Object Name, @{N="Memory MB";E={[math]::Round($_.WorkingSet/1MB)}} | Out-Host
    Start-Sleep -Seconds 10
}
```

**Recovery**:
1. Identify memory leak source in code
2. Deploy hotfix
3. Monitor memory usage
4. If leak persists, restart service during off-peak hours

### DDoS Attack

**Symptoms**:
- Sudden traffic spike
- High error rate (5xx errors)
- Server becomes unresponsive

**Immediate Actions**:
1. Enable rate limiting
2. Block suspicious IP addresses
3. Enable WAF (Web Application Firewall)
4. Contact CDN provider if using CloudFlare or similar
5. Scale up resources if needed

---

## Support & Escalation

### When to Escalate
- Multiple users unable to access system
- Data corruption suspected
- Security breach suspected
- Database requires professional intervention
- System down > 15 minutes

### Escalation Path
1. **Tier 1 Support** → Check logs and restart services
2. **Tier 2 (Dev Team)** → Code debugging and fixes
3. **Tier 3 (Infrastructure)** → Server/database administration
4. **Management** → Business decision on rollback, etc.

### Emergency Contacts
- **Development Lead**: +1-XXX-XXX-XXXX
- **DevOps Lead**: +1-XXX-XXX-XXXX
- **Database Admin**: +1-XXX-XXX-XXXX
- **Infrastructure Manager**: +1-XXX-XXX-XXXX

---

## Useful Commands

### API Health Check
```bash
curl https://your-api-domain.com/api/health -v
```

### Clear Browser Cache
```javascript
// In browser console
Object.keys(localStorage).forEach(key => localStorage.removeItem(key));
sessionStorage.clear();
location.reload();
```

### Database Backup
```sql
-- SQL Server
BACKUP DATABASE EMS_Production TO DISK = 'C:\Backups\EMS_Production.bak';

-- PostgreSQL
pg_dump -U ems_user EMS_Production > /backups/ems_production.sql
```

### View Recent Logs
```powershell
# Get last 100 lines of log file
Get-Content -Path "C:\path\to\logs\ems-.txt" -Tail 100
```

---

**Last Updated**: 2024
**Version**: 1.0
**For Critical Issues**: Contact your DevOps or Infrastructure team immediately
