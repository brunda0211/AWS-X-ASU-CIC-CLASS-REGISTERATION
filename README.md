# Student Class Registration System

A comprehensive, secure class registration system built with Next.js 14, TypeScript, and AWS DynamoDB. This application demonstrates enterprise-level security practices and modern web development patterns.

## 🚀 Tech Stack

- **Frontend**: Next.js 14 with App Router, React 19, TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Authentication**: NextAuth.js with JWT strategy
- **Database**: AWS DynamoDB with AWS SDK v3
- **Security**: bcryptjs, Zod validation, comprehensive security headers
- **Development**: ESLint, TypeScript strict mode, Git hooks

## 🔒 Security Features Implemented

This application implements **14 comprehensive security practices**:

### 1. **Secure Password Management**
- bcryptjs hashing with 10 salt rounds
- Password strength validation
- Never logs passwords or hashes
- Constant-time password verification

### 2. **Authentication & Session Security**
- NextAuth.js with JWT strategy
- HttpOnly cookies (prevents XSS token theft)
- Secure cookies in production (HTTPS only)
- SameSite: 'lax' (CSRF protection)
- 30-day session expiration with 1-hour refresh

### 3. **Input Validation & Sanitization**
- Zod schemas for runtime type validation
- Server-side validation (client-side for UX only)
- HTML sanitization to prevent XSS
- Request size limits (1KB for registration, 512B for enrollment)

### 4. **Database Security**
- Parameterized queries with AWS SDK commands
- Environment variable validation on startup
- No hardcoded credentials
- Secure error handling without data exposure

### 5. **API Security**
- Rate limiting (5 auth attempts per 15 minutes, 100 API requests per minute)
- Content-Type validation
- CORS protection with allowed origins
- Generic error messages (prevent account enumeration)

### 6. **HTTP Security Headers**
- X-Frame-Options: DENY (clickjacking protection)
- X-Content-Type-Options: nosniff (MIME sniffing protection)
- X-XSS-Protection: 1; mode=block
- Content Security Policy (CSP)
- Strict-Transport-Security (HTTPS enforcement)
- Referrer-Policy: strict-origin-when-cross-origin

### 7. **Route Protection**
- Server-side authentication verification
- Middleware-based route protection
- Automatic redirects for unauthenticated users
- Session expiration handling

### 8. **Error Handling**
- Generic error messages for security
- No technical details exposed to users
- Comprehensive logging without sensitive data
- Graceful degradation on failures

### 9. **Environment Security**
- Environment variable validation
- No secrets in code or version control
- Separate development/production configurations
- Secure credential management

### 10. **Client-Side Security**
- No sensitive data in client state
- Secure logout functionality
- XSS prevention in UI components
- Safe HTML rendering

### 11. **Network Security**
- HTTPS enforcement in production
- Secure cookie transmission
- Protected API endpoints
- Request/response validation

### 12. **Access Control**
- Resource ownership verification
- Role-based access patterns
- Protected route middleware
- Session-based authorization

### 13. **Data Protection**
- Sensitive data redaction in logs
- Minimal data exposure in APIs
- Secure data transmission
- Privacy-focused design

### 14. **Production Hardening**
- Security headers on all responses
- Disabled debug information in production
- Optimized bundle security
- Comprehensive monitoring setup

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- AWS Account with DynamoDB access
- Git for version control

### 1. Clone and Install

```bash
git clone <repository-url>
cd student-class-registration
npm install
```

### 2. Environment Configuration

Create `.env.local` file (never commit this file):

```bash
cp .env.local.example .env.local
```

Fill in your actual values:

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here

# DynamoDB Tables
DYNAMODB_USERS_TABLE=StudentApp-Users
DYNAMODB_ENROLLMENTS_TABLE=StudentApp-Enrollments

# NextAuth Configuration
NEXTAUTH_SECRET=your_32_character_random_secret_here
NEXTAUTH_URL=http://localhost:3000
```

### 3. AWS DynamoDB Setup

Create the required DynamoDB tables:

```bash
npm run db:init
```

Or create manually in AWS Console:
- **Users Table**: Primary key `email` (String)
- **Enrollments Table**: Primary key `id` (String), GSI on `email`

### 4. Generate NextAuth Secret

```bash
openssl rand -base64 32
```

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## 🚦 How to Run

### Development
```bash
npm run dev          # Start development server
npm run lint         # Run ESLint
npm run build        # Build for production
npm run start        # Start production server
```

### Database Operations
```bash
npm run db:init      # Initialize DynamoDB tables
```

## 🧪 Security Testing Checklist

Before deploying to production, verify:

- [ ] All environment variables are set correctly
- [ ] AWS credentials have minimal required permissions
- [ ] NEXTAUTH_SECRET is 32+ characters and random
- [ ] HTTPS is enforced in production
- [ ] Security headers are present in responses
- [ ] Rate limiting is working on auth endpoints
- [ ] Input validation prevents malicious data
- [ ] Error messages don't reveal sensitive information
- [ ] Session cookies are HttpOnly and Secure
- [ ] Database queries use parameterized inputs
- [ ] No sensitive data in client-side code
- [ ] CORS is configured for production domains
- [ ] CSP headers allow only necessary resources
- [ ] Authentication redirects work correctly
- [ ] Password hashing is working properly

## ⚠️ Important Security Notes

### 🚨 NEVER COMMIT THESE FILES:
- `.env.local` - Contains sensitive credentials
- `.env.production` - Production secrets
- `aws-credentials.json` - AWS keys
- Any file with real passwords or API keys

### 🚨 NEVER SHARE WITH AI:
- Real AWS credentials
- Production database connection strings
- Actual NextAuth secrets
- Real user passwords or hashes
- Production environment variables

### ✅ SAFE TO SHARE:
- `.env.local.example` - Template with placeholders
- Source code without credentials
- Configuration files
- Documentation and setup instructions

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/[...nextauth]/   # NextAuth.js configuration
│   │   ├── register/             # User registration
│   │   ├── classes/              # Classes API
│   │   └── enrollments/          # Enrollment management
│   ├── dashboard/                # Protected dashboard
│   ├── login/                    # Login page
│   ├── register/                 # Registration page
│   └── layout.tsx                # Root layout with providers
├── components/                   # React components
│   ├── providers/                # Context providers
│   └── DashboardClient.tsx       # Main dashboard component
├── lib/                          # Utility libraries
│   ├── auth.ts                   # Password hashing utilities
│   ├── db.ts                     # Database client and operations
│   ├── validations.ts            # Zod validation schemas
│   ├── api-utils.ts              # API helper functions
│   ├── constants.ts              # Application constants
│   └── session.ts                # Session management utilities
├── types/                        # TypeScript type definitions
└── middleware.ts                 # Route protection middleware
```

## 🔧 Configuration Files

- `next.config.ts` - Next.js configuration with security headers
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `eslint.config.mjs` - ESLint configuration
- `package.json` - Dependencies and scripts

## 🐛 Troubleshooting

### Common Issues

**1. Authentication not working**
- Check NEXTAUTH_SECRET is set and 32+ characters
- Verify NEXTAUTH_URL matches your domain
- Ensure cookies are enabled in browser

**2. Database connection errors**
- Verify AWS credentials are correct
- Check DynamoDB table names match environment variables
- Ensure AWS region is correct
- Verify IAM permissions for DynamoDB access

**3. Registration/Login failures**
- Check network connectivity
- Verify API endpoints are accessible
- Check browser console for errors
- Ensure input validation is passing

**4. Environment variable issues**
- Restart development server after changing .env.local
- Check for typos in variable names
- Ensure no spaces around = in .env files
- Verify all required variables are set

### Debug Mode

Enable debug logging in development:

```env
NEXTAUTH_DEBUG=true
```

### Production Deployment

1. Set NODE_ENV=production
2. Configure production database
3. Set up HTTPS/SSL certificates
4. Configure production NEXTAUTH_URL
5. Set up monitoring and logging
6. Test all security headers
7. Verify rate limiting works
8. Test authentication flows

## 📊 Performance Considerations

- Server Components for initial page loads
- Client Components only where needed
- Optimized images with next/image
- Automatic code splitting
- Efficient database queries with GSI
- Caching strategies for static data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow security best practices
4. Add tests for new features
5. Update documentation
6. Submit a pull request

## 📄 License

This project is for educational purposes and demonstrates security best practices in modern web applications.

## 🔗 Additional Resources

- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [AWS DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)
- [Web Security Headers](https://securityheaders.com/)

---

**Built with security, accessibility, and performance in mind** 🛡️✨