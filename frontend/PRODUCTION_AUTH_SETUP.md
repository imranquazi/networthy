# Production Authentication Setup

## Overview
This guide explains how to configure authentication for production deployment with proper security measures.

## Security Improvements for Production

### 1. **HTTP-Only Cookies (Recommended)**
- **Why**: More secure than localStorage (protected from XSS attacks)
- **How**: Set `NEXT_PUBLIC_AUTH_USE_HTTPONLY_COOKIES=true` in production
- **Backend**: Ensure your backend sets `httpOnly: true` on authentication cookies

### 2. **Environment Variables**
Set these environment variables in your production environment:

```bash
# Production API URL
NEXT_PUBLIC_API_URL=https://your-api-domain.com

# Security settings
NEXT_PUBLIC_AUTH_USE_HTTPONLY_COOKIES=true
NEXT_PUBLIC_AUTH_DEBUG=false
```

### 3. **Backend Cookie Configuration**
Ensure your backend sets secure cookies:

```javascript
// Example backend cookie configuration
res.cookie('authToken', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
});
```

## Authentication Flow

### Development Mode
1. Uses localStorage tokens (for easier debugging)
2. Falls back to session-based auth if localStorage fails
3. Debug logging enabled

### Production Mode
1. **Primary**: HTTP-only cookies (most secure)
2. **Fallback**: localStorage tokens (if cookies fail)
3. No debug logging
4. Automatic redirects to login

## Testing Production Authentication

### 1. **Test HTTP-Only Cookies**
```bash
# Check if cookies are being set
curl -I -c cookies.txt https://your-domain.com/api/auth/login

# Verify cookies are httpOnly
cat cookies.txt
```

### 2. **Test Authentication Flow**
1. Visit `/dashboard` without authentication
2. Should redirect to `/login`
3. Login should set httpOnly cookies
4. Dashboard should be accessible after login

### 3. **Test Logout**
1. Login to dashboard
2. Click logout
3. Should clear cookies and redirect to login
4. Dashboard should be inaccessible

## Security Best Practices

### ✅ **Do's**
- Use HTTP-only cookies in production
- Set `secure: true` for HTTPS-only cookies
- Use `sameSite: 'strict'` to prevent CSRF
- Implement proper token expiration
- Use environment variables for configuration

### ❌ **Don'ts**
- Don't store sensitive data in localStorage in production
- Don't expose authentication tokens in URLs
- Don't use `httpOnly: false` in production
- Don't disable HTTPS in production

## Troubleshooting

### Common Issues

1. **Cookies not being set**
   - Check backend cookie configuration
   - Verify domain and path settings
   - Ensure HTTPS in production

2. **Authentication not working**
   - Check environment variables
   - Verify API endpoints
   - Check browser console for errors

3. **Redirect loops**
   - Check authentication status endpoint
   - Verify cookie domain settings
   - Check for CORS issues

## Monitoring

### Production Monitoring
- Monitor authentication failures
- Track session timeouts
- Log security events
- Monitor API response times

### Health Checks
```bash
# Test authentication endpoint
curl -I https://your-api-domain.com/api/auth/me

# Test with cookies
curl -I -b cookies.txt https://your-api-domain.com/api/auth/me
```

## Migration from Development

1. **Update environment variables**
2. **Test authentication flow**
3. **Verify cookie settings**
4. **Monitor for issues**
5. **Update documentation**

## Support

For authentication issues in production:
1. Check browser developer tools
2. Verify environment variables
3. Test API endpoints directly
4. Check server logs
5. Review this documentation

