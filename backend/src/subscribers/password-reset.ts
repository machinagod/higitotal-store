import { INotificationModuleService } from '@medusajs/framework/types'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework'
import { BACKEND_URL } from '../lib/constants'
import { passwordResetEmail, PasswordResetEvent } from '../lib/password-reset'
import { EmailTemplates } from '../modules/email-notifications/templates'

/**
 * Sends the reset e-mail when someone uses "Esqueceu a palavra-passe?" in the
 * admin (Medusa emits `auth.password_reset`; without a subscriber nothing is
 * sent). Customer resets are not e-mailed: the storefront has no reset page.
 */
export default async function passwordResetHandler({
  event: { data },
  container,
}: SubscriberArgs<PasswordResetEvent>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const mail = passwordResetEmail(data, BACKEND_URL)
  if (!mail) {
    logger.warn(
      `password reset: not e-mailed (actor_type=${String(data?.actor_type)}; only admin users have a reset page)`
    )
    return
  }

  const notificationModuleService: INotificationModuleService = container.resolve(
    Modules.NOTIFICATION
  )
  try {
    await notificationModuleService.createNotifications({
      to: mail.to,
      channel: 'email',
      template: EmailTemplates.RESET_PASSWORD,
      data: {
        emailOptions: {
          subject: 'Redefinir a palavra-passe — painel Higitotal',
        },
        resetLink: mail.resetLink,
        email: mail.to,
        preview: 'Redefinir a palavra-passe da sua conta Higitotal',
      },
    })
  } catch (error) {
    logger.error(`password reset: e-mail failed: ${(error as Error)?.message ?? error}`)
  }
}

export const config: SubscriberConfig = {
  event: 'auth.password_reset',
}
