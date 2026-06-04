import type { Metadata } from 'next';
import './globals.css';
import GuestBanner from '@/components/GuestBanner';

export const metadata: Metadata = {
    title: {
        default: 'ResumeAI — AI-Powered Resume Builder',
        template: '%s | ResumeAI',
    },
    description:
        'Create ATS-optimized, job-tailored resumes in seconds with AI. The smartest resume builder on the planet.',
    keywords: ['AI resume builder', 'ATS resume', 'resume maker', 'job application'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                {children}
                <GuestBanner />
            </body>
        </html>
    );
}
