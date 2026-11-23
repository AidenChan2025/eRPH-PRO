<?php

namespace App\Notifications;

use App\Models\School;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SchoolInvitationNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly School $school, private readonly string $role)
    {
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $host = $this->school->subdomain.'.'.config('app.school_base_domain', 'erphpro.com');

        return (new MailMessage)
            ->subject('You have been invited to eRPH Pro')
            ->greeting('You have been invited to '.$this->school->name)
            ->line('Your assigned school role: '.$this->role.'.')
            ->line('Sign in with this email address from the school workspace to accept the invitation.')
            ->action('Open school sign-in', 'https://'.$host.'/login')
            ->line('If you did not expect this invitation, you can ignore this message.');
    }
}
