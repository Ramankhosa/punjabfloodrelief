# Punjab Flood Relief App - Environment Variables

Copy and paste this entire content into your .env file:

```
# Database Connection
DATABASE_URL=postgresql://postgres:123@localhost:5432/pfr

# JWT Secrets (generate strong random strings)
JWT_ACCESS_SECRET="plr-access-secret-key-2024-change-this-in-production"
JWT_REFRESH_SECRET="plr-refresh-secret-key-2024-change-this-in-production"

# OTP Configuration
OTP_TTL_MINUTES=5
OTP_RATE_LIMIT_REQUESTS=3
OTP_RATE_LIMIT_WINDOW_MINUTES=60

# Email Configuration (for password reset)
EMAIL_FROM="noreply@plr.com"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# SMS Configuration (MSG91 for OTP)
MSG91_API_KEY="467217A7RB5BC768b6c1f7P1"
MSG91_SENDER_ID="PLRAPP"
MSG91_ROUTE="4"  # Transactional route for OTP
MSG91_COUNTRY_CODE="91"

# File Upload Configuration
MAX_FILE_SIZE_KB=300
UPLOAD_BUCKET="plr-uploads"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="ap-south-1"

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000

# NextAuth Configuration (if using NextAuth)
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Redis Configuration (for session storage and rate limiting)
REDIS_URL="redis://localhost:6379"

# Test SMS Endpoint (for development only - remove in production)
# POST /api/test/sms with { "phoneNumber": "+91XXXXXXXXXX" }
# This will send a test OTP to verify MSG91 integration
```
