# Console Logging Guide 🚀

## 📊 **Comprehensive Logging Added!**

Your ForwarDefi authentication system now includes detailed console logging to monitor every step of the login and signup process.

## 🔍 **What to Monitor in Console:**

### 🚀 **App Initialization**
- `🚀 [AUTH CONTEXT] Initializing authentication...`
- `🎫 [AUTH CONTEXT] Found existing token, validating...` (if token exists)
- `🔍 [AUTH CONTEXT] No existing token found` (if no token)

### 📝 **Sign Up Process**
1. **Form Submission:**
   - `📋 [SIGNUP FORM] Form submitted for email: user@example.com`
   - `📋 [SIGNUP FORM] User details: { firstName, lastName, email, phoneNumber }`

2. **Validation:**
   - `✅ [SIGNUP FORM] Form validation passed, calling signUp...`
   - `⚠️ [SIGNUP FORM] Validation failed - [reason]` (if validation fails)

3. **Context Processing:**
   - `📝 [AUTH CONTEXT] Starting sign up process for: user@example.com`
   - `⏳ [AUTH CONTEXT] Setting loading state and clearing errors`

4. **API Calls:**
   - `🔐 [AUTH] Starting signup process for user: { user details }`
   - `🌐 [API] POST https://66mz5dpp-7002.inc1.devtunnels.ms/users/signup`
   - `📤 [API] Request config: { method, headers, body }`
   - `📡 [API] Response status: 201 Created`
   - `✅ [API] Success response: { backend response }`
   - `✅ [AUTH] Signup successful for user: user@example.com`

5. **Auto Sign-In:**
   - `✅ [AUTH CONTEXT] Sign up API call successful, now signing in...`
   - *(Then follows the sign-in process logs)*

### 🔐 **Sign In Process**
1. **Form Submission:**
   - `📋 [SIGNIN FORM] Form submitted for email: user@example.com`
   - `✅ [SIGNIN FORM] Form validation passed, calling signIn...`

2. **Context Processing:**
   - `🔐 [AUTH CONTEXT] Starting sign in process for: user@example.com`
   - `⏳ [AUTH CONTEXT] Setting loading state and clearing errors`

3. **API Calls:**
   - `🔐 [AUTH] Starting signin process for user: user@example.com`
   - `🌐 [API] POST https://66mz5dpp-7002.inc1.devtunnels.ms/users/login`
   - `📤 [API] Request config: { credentials }`
   - `📡 [API] Response status: 200 OK`
   - `✅ [AUTH] Signin successful for user: user@example.com`
   - `🎫 [AUTH] JWT token received (length: XXX)`

4. **Token & User Storage:**
   - `🎫 [AUTH CONTEXT] Storing JWT token in localStorage`
   - `👤 [AUTH CONTEXT] Converting and storing user data`
   - `✅ [AUTH CONTEXT] Sign in completed successfully for: user@example.com`
   - `👤 [AUTH CONTEXT] User authenticated: { id, email, name, walletAddress }`

### 🔗 **Wallet Integration**
- `🔗 [AUTH CONTEXT] Wallet connected for user user@example.com: 0x1234...`
- `💾 [AUTH CONTEXT] Updated user data with wallet address`
- `🚫 [AUTH CONTEXT] Wallet connected but user not authenticated - auto-disconnecting`

### 🚪 **Sign Out Process**
- `🚪 [AUTH CONTEXT] Starting sign out process`
- `👋 [AUTH CONTEXT] Signing out user: user@example.com`
- `🧹 [AUTH CONTEXT] Cleared user data and tokens from localStorage`
- `🔌 [AUTH CONTEXT] Disconnecting wallet`
- `✅ [AUTH CONTEXT] Sign out completed successfully`

### ❌ **Error Scenarios**
1. **Network Errors:**
   - `🌐 [API] Network error: TypeError`
   - `❌ [AUTH] Signup/Signin failed for user: error details`

2. **API Errors:**
   - `❌ [API] Error response: { statusCode, message, error }`
   - `💥 [AUTH CONTEXT] Sign in/up failed for user: error message`

3. **Token Validation Errors:**
   - `❌ [AUTH CONTEXT] Token validation failed: error`
   - `🧹 [AUTH CONTEXT] Clearing invalid tokens and user data`

## 🎯 **How to Use the Logs:**

### 1. **Open Browser Dev Tools**
- Press `F12` or `Ctrl+Shift+I`
- Go to **Console** tab

### 2. **Test Sign Up Flow**
```
📋 [SIGNUP FORM] Form submitted for email: test@example.com
📋 [SIGNUP FORM] User details: {...}
✅ [SIGNUP FORM] Form validation passed, calling signUp...
📝 [AUTH CONTEXT] Starting sign up process for: test@example.com
🔐 [AUTH] Starting signup process for user: {...}
🌐 [API] POST https://66mz5dpp-7002.inc1.devtunnels.ms/users/signup
✅ [AUTH] Signup successful for user: test@example.com
🔐 [AUTH CONTEXT] Starting sign in process for: test@example.com
🎫 [AUTH] JWT token received (length: 234)
✅ [AUTH CONTEXT] Sign in completed successfully
🎉 [SIGNUP FORM] Sign up successful, closing modal
```

### 3. **Test Sign In Flow**
```
📋 [SIGNIN FORM] Form submitted for email: test@example.com
🔐 [AUTH CONTEXT] Starting sign in process for: test@example.com
🌐 [API] POST https://66mz5dpp-7002.inc1.devtunnels.ms/users/login
✅ [AUTH] Signin successful for user: test@example.com
🎫 [AUTH CONTEXT] Storing JWT token in localStorage
👤 [AUTH CONTEXT] User authenticated: {...}
🎉 [SIGNIN FORM] Sign in successful, closing modal
```

### 4. **Debug Issues**
- **Backend Connection**: Look for `🌐 [API]` logs to see if requests are reaching the backend
- **Authentication**: Check `🔐 [AUTH]` logs for API response details
- **Token Management**: Monitor `🎫` logs for JWT token handling
- **Validation**: Look for `⚠️` logs to identify form validation issues

## 🔧 **Log Categories:**

| Icon | Category | Description |
|------|----------|-------------|
| 🚀 | Initialization | App startup and auth restoration |
| 📋 | Form | Form submissions and validation |
| 🔐 | Authentication | Auth API calls and responses |
| 🌐 | Network | HTTP requests and responses |
| 👤 | User Management | User data handling |
| 🎫 | Token | JWT token operations |
| 🔗 | Wallet | Wallet connection events |
| 🚪 | Logout | Sign out process |
| ❌ | Errors | Error conditions |
| ✅ | Success | Successful operations |

## 💡 **Tips:**

1. **Filter Logs**: In console, type `[AUTH]` to filter authentication-related logs
2. **Network Tab**: Use Network tab in dev tools to see actual HTTP requests
3. **Application Tab**: Check Application → Local Storage to see stored tokens
4. **Clear Logs**: Right-click console → Clear console for fresh start

The logging system provides complete visibility into the authentication flow, making it easy to debug issues and monitor the process during development and testing!
