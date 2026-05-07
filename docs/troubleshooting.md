# SMB Payroll — Troubleshooting Guide

## Login Issues

### Cannot log in
1. Verify your email and password are correct
2. Check if Caps Lock is on
3. Use "Forgot Password" to reset if needed
4. Contact your administrator if your account may be inactive

### "Account not found"
- The email may not be registered in the system
- Contact your administrator to create an account

### "Too many login attempts"
- Wait a few minutes before trying again
- The system has rate limiting (5 attempts per minute)

### Session keeps expiring
- Sessions expire after 30 minutes of inactivity
- This is a security feature; simply log in again
- If this happens too frequently, your admin may have configured a shorter timeout

## Payroll Processing

### Cannot edit payroll data
- Check if the payroll is locked (status must be "Draft" for edits)
- If locked, click "Unlock" (requires edit permission)
- If published, it cannot be unlocked — clone the payroll instead

### Auto-calculations not updating
- Try refreshing the page
- Click the "Recalculate" button in the Summary stage
- Verify DTR data is entered before checking Salary/Summary

### Employee missing from payroll
- The employee may not be in the selected groups
- Check the employee's Group, Position, and Area assignments
- Add the employee manually in the Employee Selection step

### "Cannot publish" validation error
- Review validation messages in the Summary stage
- Common issues:
  - Missing DTR data for one or more employees
  - Zero or negative salary amounts
  - Unbalanced earnings/deductions
- Fix the flagged issues and try again

## Data Loading

### Page is stuck on loading
1. Check your internet connection
2. Refresh the page
3. Clear browser cache and reload
4. Check Firebase Console for service status

### Tables show no data
1. Verify you have data in the system
2. Check your permission level (you may not have view access)
3. Try adjusting filters
4. Check the current company selection in the header

### Data not saving
1. Check if you're offline (yellow banner at top)
2. If offline, changes are queued and will sync automatically
3. If online, try saving again
4. Check Firebase Console for Firestore errors

### "Insufficient permissions" error
- You don't have the required permission level
- Contact your administrator to update your access rights
- The system will log this as a permission denied audit event

## DTR Issues

### Cannot find an employee in DTR
- The employee may not be active
- Verify the employee exists in the Employee Registry
- Check if the employee is assigned to your current company

### Leave application not showing
- Check the leave balance for the current year
- Verify the leave type is configured as a benefit
- Ensure the dates do not overlap with existing leave

### Overtime not counting
- Overtime must be approved (approved: true)
- Check the DTR entry for the specific date
- Verify hours are entered correctly

## Export Issues

### XLS export fails
- Try exporting with fewer columns
- Ensure all data is valid (no NaN or Infinity values)
- Try CSV export as an alternative

### CSV export has wrong delimiter
- The system uses comma as default delimiter
- If your locale uses semicolons, import the CSV and specify the delimiter

### Print preview is blank
- Check print-optimized CSS is loaded
- Try previewing in a different browser
- Verify the payroll has data in output views

## Multi-Company

### Wrong company data showing
- Check the company selector in the header
- The selected company determines which data you see
- Switch to the correct company

### Cannot see all companies
- Your account may not be assigned to those companies
- Contact your administrator to add company access

## Offline Mode

### "You are currently offline" banner
- The yellow banner indicates your internet connection is lost
- The app will queue your changes locally
- When connection is restored, changes sync automatically
- You can dismiss the banner, but changes will still queue

### Queued changes not syncing
- Ensure you have an active internet connection
- Refresh the page to trigger sync
- Check the IndexedDB storage in browser DevTools (Application > IndexedDB)

## Performance

### Slow page loads
- Try reducing Items Per Page in Settings
- Use search/filters to narrow results
- Check internet connection speed
- Try clearing browser cache

### Browser crashes or runs out of memory
- Reduce Items Per Page to 25 or 10
- Close other tabs
- Use Chrome or Edge (better memory management)
- Try the CSV export for large data analysis

## Browser Compatibility

The application supports:
- Google Chrome (latest 2 versions)
- Mozilla Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Microsoft Edge (latest 2 versions)

### Known issues
- **Safari**: Some animations may not work; reduced-motion preference is recommended
- **Mobile browsers**: Some complex tables may need horizontal scrolling
- **Internet Explorer**: Not supported

## Getting Help

### Contact Administrator
For account issues, permission changes, and system configuration:
- Contact your system administrator
- They can check the Audit Log for error details

### Error Reporting
If you encounter a technical error:
1. Note the error message and time
2. Check if the issue is listed above
3. Report to your administrator with the details
4. Error details are automatically captured by Sentry (if configured)

### System Health
Administrators can check:
- System > Health Check for service status
- Firebase Console for infrastructure issues
- Sentry dashboard for application errors
