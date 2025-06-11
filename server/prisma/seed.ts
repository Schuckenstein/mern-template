// server/prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { UserRole, AuthProvider } from '@shared/types'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  try {
    // Clean up existing data in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🧹 Cleaning up existing data...')
      
      await prisma.auditLog.deleteMany()
      await prisma.notification.deleteMany()
      await prisma.emailJob.deleteMany()
      await prisma.file.deleteMany()
      await prisma.refreshToken.deleteMany()
      await prisma.userProfile.deleteMany()
      await prisma.user.deleteMany()
      await prisma.emailTemplate.deleteMany()
      await prisma.systemSetting.deleteMany()
    }

    // Create admin user
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin123!'
    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com'
    
    const adminPasswordHash = await bcrypt.hash(adminPassword, 12)
    
    console.log('👑 Creating admin user...')
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        firstName: 'Admin',
        lastName: 'User',
        passwordHash: adminPasswordHash,
        isEmailVerified: true,
        role: UserRole.ADMIN,
        provider: AuthProvider.EMAIL,
        profile: {
          create: {
            bio: 'System administrator with full access to all features.',
            preferences: {
              theme: 'dark',
              language: 'en',
              timezone: 'UTC',
              emailNotifications: true,
              pushNotifications: true
            }
          }
        }
      }
    })

    // Create moderator user
    console.log('🛡️ Creating moderator user...')
    const moderatorPasswordHash = await bcrypt.hash('Moderator123!', 12)
    
    const moderatorUser = await prisma.user.create({
      data: {
        email: 'moderator@example.com',
        firstName: 'Moderator',
        lastName: 'User',
        username: 'moderator',
        passwordHash: moderatorPasswordHash,
        isEmailVerified: true,
        role: UserRole.MODERATOR,
        provider: AuthProvider.EMAIL,
        profile: {
          create: {
            bio: 'Content moderator helping to maintain community standards.',
            preferences: {
              theme: 'light',
              language: 'en',
              timezone: 'UTC',
              emailNotifications: true,
              pushNotifications: false
            }
          }
        }
      }
    })

    // Create demo users
    console.log('👥 Creating demo users...')
    const demoUsers = []
    
    for (let i = 1; i <= 5; i++) {
      const userPasswordHash = await bcrypt.hash('User123!', 12)
      
      const user = await prisma.user.create({
        data: {
          email: `user${i}@example.com`,
          firstName: `User`,
          lastName: `${i}`,
          username: `user${i}`,
          passwordHash: userPasswordHash,
          isEmailVerified: i <= 3, // First 3 users are verified
          role: UserRole.USER,
          provider: AuthProvider.EMAIL,
          lastLoginAt: i <= 2 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
          profile: {
            create: {
              bio: `Demo user account #${i} for testing purposes.`,
              phoneNumber: i <= 2 ? `+1555000000${i}` : undefined,
              preferences: {
                theme: i % 2 === 0 ? 'light' : 'dark',
                language: 'en',
                timezone: 'UTC',
                emailNotifications: true,
                pushNotifications: i % 2 === 0
              },
              socialLinks: i <= 2 ? {
                website: `https://user${i}.example.com`,
                github: `user${i}`,
                twitter: `@user${i}`
              } : undefined
            }
          }
        }
      })
      
      demoUsers.push(user)
    }

    // Create email templates
    console.log('📧 Creating email templates...')
    
    const emailTemplates = [
      {
        name: 'verification',
        subject: 'Verify your email address',
        htmlContent: `
          <h1>Welcome to MERN Template!</h1>
          <p>Please verify your email address by clicking the link below:</p>
          <a href="{{verificationUrl}}">Verify Email</a>
        `,
        textContent: 'Welcome to MERN Template! Please verify your email: {{verificationUrl}}',
        variables: ['verificationUrl']
      },
      {
        name: 'password-reset',
        subject: 'Reset your password',
        htmlContent: `
          <h1>Password Reset</h1>
          <p>Click the link below to reset your password:</p>
          <a href="{{resetUrl}}">Reset Password</a>
        `,
        textContent: 'Reset your password: {{resetUrl}}',
        variables: ['resetUrl']
      },
      {
        name: 'welcome',
        subject: 'Welcome to MERN Template!',
        htmlContent: `
          <h1>Welcome {{firstName}}!</h1>
          <p>Your account has been created successfully. Get started by visiting your dashboard:</p>
          <a href="{{dashboardUrl}}">Go to Dashboard</a>
        `,
        textContent: 'Welcome {{firstName}}! Visit your dashboard: {{dashboardUrl}}',
        variables: ['firstName', 'dashboardUrl']
      }
    ]

    for (const template of emailTemplates) {
      await prisma.emailTemplate.create({
        data: template
      })
    }

    // Create sample notifications
    console.log('🔔 Creating sample notifications...')
    
    const notifications = [
      {
        userId: demoUsers[0].id,
        type: 'INFO',
        title: 'Welcome to MERN Template!',
        message: 'Your account has been created successfully. Explore all the features available to you.'
      },
      {
        userId: demoUsers[0].id,
        type: 'SUCCESS',
        title: 'Email Verified',
        message: 'Your email address has been verified successfully.'
      },
      {
        userId: demoUsers[1].id,
        type: 'WARNING',
        title: 'Profile Incomplete',
        message: 'Please complete your profile to get the most out of MERN Template.'
      }
    ]

    for (const notification of notifications) {
      await prisma.notification.create({
        data: notification as any
      })
    }

    // Create sample email jobs
    console.log('📤 Creating sample email jobs...')
    
    const emailJobs = [
      {
        to: [adminEmail],
        subject: 'Welcome to MERN Template!',
        htmlContent: '<h1>Welcome!</h1><p>Your account is ready.</p>',
        status: 'SENT',
        sentAt: new Date(),
        userId: adminUser.id
      },
      {
        to: ['moderator@example.com'],
        subject: 'Moderator Access Granted',
        htmlContent: '<h1>Access Granted</h1><p>You now have moderator access.</p>',
        status: 'SENT',
        sentAt: new Date(),
        userId: moderatorUser.id
      }
    ]

    for (const emailJob of emailJobs) {
      await prisma.emailJob.create({
        data: emailJob as any
      })
    }

    // Create system settings
    console.log('⚙️ Creating system settings...')
    
    const systemSettings = [
      {
        key: 'site_name',
        value: 'MERN Template',
        description: 'The name of the application',
        isPublic: true
      },
      {
        key: 'site_description',
        value: 'A comprehensive MERN stack template with authentication and debugging tools',
        description: 'The description of the application',
        isPublic: true
      },
      {
        key: 'maintenance_mode',
        value: false,
        description: 'Whether the site is in maintenance mode',
        isPublic: false
      },
      {
        key: 'registration_enabled',
        value: true,
        description: 'Whether new user registration is enabled',
        isPublic: false
      },
      {
        key: 'email_verification_required',
        value: true,
        description: 'Whether email verification is required for new users',
        isPublic: false
      },
      {
        key: 'max_file_size',
        value: 10485760, // 10MB
        description: 'Maximum file upload size in bytes',
        isPublic: false
      }
    ]

    for (const setting of systemSettings) {
      await prisma.systemSetting.create({
        data: setting
      })
    }

    // Create audit logs for seeding activity
    console.log('📋 Creating audit logs...')
    
    const auditLogs = [
      {
        userId: adminUser.id,
        action: 'CREATE',
        resource: 'USER',
        resourceId: adminUser.id,
        newValues: { role: 'ADMIN', email: adminEmail },
        ipAddress: '127.0.0.1',
        userAgent: 'Database Seeder'
      },
      {
        action: 'SEED',
        resource: 'DATABASE',
        newValues: { tables: ['users', 'profiles', 'emailTemplates', 'systemSettings'] },
        ipAddress: '127.0.0.1',
        userAgent: 'Database Seeder'
      }
    ]

    for (const auditLog of auditLogs) {
      await prisma.auditLog.create({
        data: auditLog
      })
    }

    console.log('✅ Database seeding completed successfully!')
    
    // Print summary
    console.log('\n📊 Seeding Summary:')
    console.log(`👑 Admin user: ${adminEmail} (password: ${adminPassword})`)
    console.log(`🛡️ Moderator user: moderator@example.com (password: Moderator123!)`)
    console.log(`👥 Demo users: user1@example.com - user5@example.com (password: User123!)`)
    console.log(`📧 Email templates: ${emailTemplates.length} created`)
    console.log(`🔔 Notifications: ${notifications.length} created`)
    console.log(`⚙️ System settings: ${systemSettings.length} created`)
    
    if (process.env.NODE_ENV === 'development') {
      console.log('\n🛠️ Development Notes:')
      console.log('- All demo users have the password: User123!')
      console.log('- First 3 demo users are email verified')
      console.log('- Debug dashboard is available at /debug')
      console.log('- Use the admin account to access all features')
    }

  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('Fatal error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

// Export for use in tests
export { main as seedDatabase }