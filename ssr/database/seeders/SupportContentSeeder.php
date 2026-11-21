<?php

namespace Database\Seeders;

use App\Models\SupportArticle;
use App\Models\SupportCategory;
use Illuminate\Database\Seeder;

class SupportContentSeeder extends Seeder
{
    public function run(): void
    {
        $content = [
            ['getting-started', 'Getting started', 'Set up your school workspace and invite the right people.', 'rocket', [
                ['first-steps', 'Your first five minutes in eRPH Pro', 'Start with the school address, sign in with Google Workspace, then ask your school administrator to confirm your role. Once access is approved, your workspace shows your teacher record, lesson plans and review status.'],
                ['invite-teachers', 'How school administrators invite teachers', 'Open School administration, add the teacher’s school email and choose the correct role. The teacher can then sign in with that same Google Workspace account.'],
            ]],
            ['accounts-access', 'Accounts & access', 'Login, roles, school membership and identity questions.', 'lock', [
                ['google-login', 'Why can I sign in but not see my school?', 'eRPH Pro keeps identity separate from school membership. Ask a school administrator to add your Google Workspace email to the school, then sign out and sign in again.'],
                ['temporary-access', 'How temporary access works', 'School administrators can grant time-limited access for inspections or support. The reason, expiry and activity are recorded for accountability.'],
            ]],
            ['lesson-plans', 'Lesson plans & review', 'Create, submit and improve RPH records.', 'document', [
                ['save-submit-rph', 'Save and submit an RPH', 'A teacher can save a draft first, return to edit it, and submit it when ready. Submission creates a versioned record for school review; it does not replace earlier versions.'],
                ['review-status', 'What do draft, submitted and approved mean?', 'Draft is still editable by the teacher. Submitted is waiting for school review. Approved means school management has recorded a decision and comment.'],
            ]],
            ['email-notifications', 'Email & notifications', 'Mailbox, delivery and support communication.', 'mail', [
                ['support-email', 'Which email addresses should I use?', 'Use hello@erphpro.com for general enquiries, admin@erphpro.com for account and administrator matters, and noreply@erphpro.com for system-generated messages.'],
            ]],
            ['faq', 'Frequently asked questions', 'Short answers to common questions.', 'question', [
                ['school-address', 'Where is my school workspace?', 'Your administrator will provide a school address such as yourschool.erphpro.com. The public site is for product information; school work stays inside the school workspace.'],
                ['human-support', 'When will a human handle my ticket?', 'Security, billing, identity, access, data deletion, legal questions, urgent issues and low-confidence AI suggestions always go to a human.'],
            ]],
        ];

        foreach ($content as [$slug, $name, $description, $icon, $articles]) {
            $category = SupportCategory::query()->updateOrCreate(
                ['slug' => $slug],
                ['name' => $name, 'description' => $description, 'icon' => $icon, 'sort_order' => array_search($slug, array_column($content, 0), true), 'is_active' => true]
            );

            foreach ($articles as $sort => [$articleSlug, $title, $body]) {
                SupportArticle::query()->updateOrCreate(
                    ['slug' => $articleSlug],
                    ['support_category_id' => $category->id, 'title' => $title, 'excerpt' => $body, 'body' => $body, 'is_published' => true, 'sort_order' => $sort]
                );
            }
        }
    }
}
