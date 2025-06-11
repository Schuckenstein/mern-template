// server/src/services/emailService.ts
import nodemailer from 'nodemailer'
import handlebars from 'handlebars'
import fs from 'fs/promises'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import { EmailStatus, EmailJob } from '@shared/types'
import { logger } from '../utils/logger'

const prisma = new PrismaClient()

interface EmailOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  template?: string
  variables?: Record<string, any>
}

class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = this.createTransporter()
  }

  private createTransporter(): nodemailer.Transporter {
    const config: any = {
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    }

    // Use SendGrid if API key is provided
    if (process.env.SENDGRID_API_KEY) {
      config.host = 'smtp.sendgrid.net'
      config.port = 587
      config.auth = {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    }

    return nodemailer.createTransporter(config)
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      let html = options.html
      let text = options.text

      // Use template if specified
      if (options.template) {
        const templateContent = await this.renderTemplate(options.template, options.variables || {})
        html = templateContent.html
        text = templateContent.text || text
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html,
        text
      }

      // Create email job record
      const emailJob = await prisma.emailJob.create({
        data: {
          to: Array.isArray(options.to) ? options.to : [options.to],
          subject: options.subject,
          htmlContent: html,
          textContent: text,
          status: EmailStatus.PENDING,
          variables: options.variables || null
        }
      })

      try {
        const result = await this.transporter.sendMail(mailOptions)
        
        // Update email job status
        await prisma.emailJob.update({
          where: { id: emailJob.id },
          data: {
            status: EmailStatus.SENT,
            sentAt: new Date()
          }
        })

        logger.info('Email sent successfully', {
          to: options.to,
          subject: options.subject,
          messageId: result.messageId
        })

        return true
      } catch (error) {
        // Update email job with error
        await prisma.emailJob.update({
          where: { id: emailJob.id },
          data: {
            status: EmailStatus.FAILED,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        })

        throw error
      }
    } catch (error) {
      logger.error('Failed to send email', error)
      return false
    }
  }

  async renderTemplate(templateName: string, variables: Record<string, any>): Promise<{ html: string; text?: string }> {
    try {
      const templatePath = path.join(__dirname, '..', 'templates', 'emails', `${templateName}.hbs`)
      const templateContent = await fs.readFile(templatePath, 'utf-8')
      
      const template = handlebars.compile(templateContent)
      const html = template(variables)

      // Try to load text version
      let text: string | undefined
      try {
        const textTemplatePath = path.join(__dirname, '..', 'templates', 'emails', `${templateName}.txt`)
        const textTemplateContent = await fs.readFile(textTemplatePath, 'utf-8')
        const textTemplate = handlebars.compile(textTemplateContent)
        text = textTemplate(variables)
      } catch {
        // Text template not found, use HTML to text conversion
        text = html.replace(/<[^>]*>/g, '')
      }

      return { html, text }
    } catch (error) {
      logger.error('Failed to render email template', error)
      throw new Error(`Email template '${templateName}' not found`)
    }
  }

  // Common email methods
  async sendVerificationEmail(email: string, token: string): Promise<boolean> {
    const verificationUrl = `${process.env.CLIENT_URL}/auth/verify-email?token=${token}`
    
    return this.sendEmail({
      to: email,
      subject: 'Verify your email address',
      template: 'verification',
      variables: {
        verificationUrl
      }
    })
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
    const resetUrl = `${process.env.CLIENT_URL}/auth/reset-password?token=${token}`
    
    return this.sendEmail({
      to: email,
      subject: 'Reset your password',
      template: 'password-reset',
      variables: {
        resetUrl
      }
    })
  }

  async sendWelcomeEmail(email: string, firstName?: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: 'Welcome to MERN Template!',
      template: 'welcome',
      variables: {
        firstName: firstName || 'there',
        dashboardUrl: `${process.env.CLIENT_URL}/dashboard`
      }
    })
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify()
      logger.info('Email service connection verified')
      return true
    } catch (error) {
      logger.error('Email service connection failed', error)
      return false
    }
  }
}

export const emailService = new EmailService()