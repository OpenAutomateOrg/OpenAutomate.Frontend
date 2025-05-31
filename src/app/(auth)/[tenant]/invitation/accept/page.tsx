"use client"

import Link from 'next/link'
import { useRouter, useSearchParams, useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { organizationInvitationsApi } from '@/lib/api/organization-invitations'
import { useAuth } from '@/hooks/use-auth'

function getAcceptErrorMessage(err: unknown): { status: string, msg: string } | null {
    if (typeof err === 'object' && err !== null) {
        const errorObj = err as { message?: string; response?: { data?: { message?: string } }; status?: string };
        if (errorObj.message?.includes('not invited') || errorObj.message?.includes('You are not invited to this OU')) {
            return {
                status: 'wrong_email',
                msg: 'You are not invited to this organization with your current email address.'
            }
        }
        if (errorObj.response?.data?.message) {
            return { status: 'error', msg: errorObj.response.data.message }
        }
        if (errorObj.message) {
            return { status: 'error', msg: errorObj.message }
        }
        if (errorObj.status && errorObj.message) {
            return { status: 'error', msg: errorObj.message }
        }
    }
    return null
}

interface AcceptPreconditionsContext {
    token: string | null;
    tenant: string;
    isAuthenticated: boolean;
    invitedEmail: string | null;
    user: any;
    setStatus: (s: any) => void;
    setErrorMsg: (m: string) => void;
    router: any;
}

function validateAcceptPreconditions(ctx: AcceptPreconditionsContext): boolean {
    const { token, tenant, isAuthenticated, invitedEmail, user, setStatus, setErrorMsg, router } = ctx;
    if (!token || !tenant) {
        setStatus('error');
        setErrorMsg('Invalid invitation link.');
        return false;
    }
    if (!isAuthenticated) {
        router.replace(`/login?returnUrl=/${tenant}/invitation/accept?token=${token}`);
        return false;
    }
    if (invitedEmail && user?.email?.toLowerCase() !== invitedEmail.toLowerCase()) {
        setStatus('wrong_email');
        setErrorMsg(`You are currently logged in as ${user?.email}, but this invitation was sent to ${invitedEmail}.`);
        return false;
    }
    return true;
}

function handleAcceptApiResult(res: any, user: any, setStatus: (s: any) => void, setInvitedEmail: (e: string) => void, setErrorMsg: (m: string) => void): boolean {
    if (res?.success === true) {
        if (!res.invitedEmail || user?.email?.toLowerCase() === res.invitedEmail.toLowerCase()) {
            setStatus('success');
        } else {
            setStatus('wrong_email');
            setInvitedEmail(res.invitedEmail);
            setErrorMsg(`You are currently logged in as ${user?.email}, but this invitation was sent to ${res.invitedEmail}.`);
        }
        return true;
    }
    return false;
}

function handleAcceptError(err: unknown, setStatus: (s: any) => void, setErrorMsg: (m: string) => void, setRetryCount: (cb: (prev: number) => number) => void) {
    if (err instanceof Response) {
        err.json().then((data) => {
            if (data?.message) setErrorMsg(data.message);
        }).catch(() => { });
        setRetryCount(prev => prev + 1);
        setStatus('error');
        return;
    }
    const errorResult = getAcceptErrorMessage(err);
    if (errorResult) {
        setStatus(errorResult.status as 'idle' | 'loading' | 'accepting' | 'success' | 'error' | 'wrong_email' | 'already_accepted');
        setErrorMsg(errorResult.msg);
        if (errorResult.status === 'wrong_email') return;
    } else {
        setStatus('error');
        setErrorMsg('Failed to accept invitation.');
    }
    setRetryCount(prev => prev + 1);
}

export default function AcceptInvitationPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const params = useParams()
    const tenant = params.tenant as string
    const token = searchParams.get('token')
    const { isAuthenticated, user, logout } = useAuth()
    const [status, setStatus] = useState<'idle' | 'loading' | 'accepting' | 'success' | 'error' | 'wrong_email' | 'already_accepted'>('loading')
    const [errorMsg, setErrorMsg] = useState('')
    const [retryCount, setRetryCount] = useState(0)
    const [invitedEmail, setInvitedEmail] = useState<string | null>(null)

    // Check invitation status when component loads
    useEffect(() => {
        const checkInvitationStatus = async () => {
            if (!token || !tenant) {
                setStatus('error');
                setErrorMsg('Invalid invitation link.');
                return;
            }

            // If not authenticated, don't check invitation yet
            if (!isAuthenticated) {
                setStatus('idle');
                return;
            }

            try {
                // Check if invitation exists and its status using the API
                const data = await organizationInvitationsApi.checkInvitationToken(tenant, token);

                // Save invited email for later comparison
                if (data.recipientEmail) {
                    setInvitedEmail(data.recipientEmail);
                }

                // If invitation is already accepted, update status
                if (data.status === 'Accepted') {
                    setStatus('already_accepted');
                    return;
                }

                // If invitation is expired or invalid
                if (data.status === 'Expired' || data.status === 'Invalid') {
                    setStatus('error');
                    setErrorMsg(`Invitation is ${data.status.toLowerCase()}.`);
                    return;
                }

                // If we're authenticated, check if the current user email matches the invited email
                if (isAuthenticated && user?.email && data.recipientEmail &&
                    user.email.toLowerCase() !== data.recipientEmail.toLowerCase()) {
                    setStatus('wrong_email');
                    setErrorMsg(`You are currently logged in as ${user.email}, but this invitation was sent to ${data.recipientEmail}.`);
                    return;
                }

                // If we've reached here, the invitation is valid and pending
                setStatus('idle');
            } catch (err) {
                console.error('Error checking invitation status:', err);
                setStatus('error');
                setErrorMsg('Failed to verify invitation. Please try again later.');
            }
        };

        checkInvitationStatus();
    }, [token, tenant, isAuthenticated, user, retryCount]);

    const handleAccept = async () => {
        if (!validateAcceptPreconditions({ token, tenant, isAuthenticated, invitedEmail, user, setStatus, setErrorMsg, router })) return;
        setStatus('accepting');
        try {
            const res = await organizationInvitationsApi.acceptInvitation(tenant, token as string);
            if (handleAcceptApiResult(res, user, setStatus, setInvitedEmail, setErrorMsg)) return;
            setRetryCount(prev => prev + 1);
            setStatus('error');
            setErrorMsg('Failed to accept invitation. Please try again.');
        } catch (err) {
            handleAcceptError(err, setStatus, setErrorMsg, setRetryCount);
        }
    };

    // Function to handle logout and redirect to login with the same token
    const handleLogoutAndLogin = async () => {
        await logout();
        router.replace(`/login?returnUrl=/${tenant}/invitation/accept?token=${token}`);
    };

    // Function to try checking the status again
    const handleRetry = () => {
        setStatus('loading');
        setRetryCount(prev => prev + 1);
    };

    // Function to go to tenant selector page
    const goToTenantSelector = () => {
        router.push('/tenant-selector');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-2xl p-8 flex flex-col items-center space-y-6 transition-colors">
                <h1 className="text-2xl font-bold text-orange-600 text-center">Organization Invitation</h1>

                {status === 'loading' && (
                    <div className="flex items-center justify-center py-2 text-zinc-500 dark:text-zinc-300">
                        <svg className="animate-spin h-5 w-5 text-orange-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                        Verifying invitation...
                    </div>
                )}

                {status === 'idle' && (
                    <>
                        <p className="text-sm text-zinc-600 dark:text-zinc-300 text-center">
                            You have been invited to join this Organization Unit (OU).
                            {!isAuthenticated && (
                                <><br />Please sign in or register with the invited email address first.</>
                            )}
                            {isAuthenticated && (
                                <><br />Click <b>Accept</b> to join.</>
                            )}
                        </p>

                        {isAuthenticated && (
                            <button
                                className="w-full px-8 py-2 bg-orange-600 text-white rounded font-semibold hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-800 transition-colors"
                                onClick={handleAccept}
                            >
                                Accept
                            </button>
                        )}
                    </>
                )}

                {status === 'accepting' && (
                    <div className="flex items-center justify-center py-2 text-zinc-500 dark:text-zinc-300">
                        <svg className="animate-spin h-5 w-5 text-orange-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
                        Accepting invitation...
                    </div>
                )}

                {status === 'success' && (
                    <>
                        <div className="text-green-600 dark:text-green-400 text-center font-medium">
                            Successfully joined the organization!
                        </div>
                        <button
                            className="w-full px-8 py-2 bg-orange-600 text-white rounded font-semibold hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-800 transition-colors"
                            onClick={goToTenantSelector}
                        >
                            Go to My Organizations
                        </button>
                    </>
                )}

                {status === 'already_accepted' && (
                    <>
                        <div className="text-green-600 dark:text-green-400 text-center font-medium">
                            You have already joined this organization.
                        </div>
                        <button
                            className="w-full px-8 py-2 bg-orange-600 text-white rounded font-semibold hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-800 transition-colors"
                            onClick={goToTenantSelector}
                        >
                            Go to My Organizations
                        </button>
                    </>
                )}

                {status === 'wrong_email' && (
                    <div className="flex flex-col items-center space-y-4">
                        <div className="text-red-600 dark:text-red-400 text-center">
                            {errorMsg}
                        </div>

                        <div className="text-sm text-zinc-600 dark:text-zinc-300 text-center">
                            Please sign in with the email address that was invited or ask for a new invitation to your current email.
                        </div>

                        <div className="flex flex-col w-full space-y-3">
                            <button
                                className="w-full px-8 py-2 bg-orange-600 text-white rounded font-semibold hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-800 transition-colors"
                                onClick={handleLogoutAndLogin}
                            >
                                Sign in with different account
                            </button>

                            <div className="flex justify-center items-center space-x-2">
                                <span className="text-xs text-zinc-500">or</span>
                            </div>

                            <Link
                                href={`/register?returnUrl=/${tenant}/invitation/accept?token=${token}`}
                                className="w-full px-8 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded font-semibold hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors text-center"
                            >
                                Register new account
                            </Link>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center space-y-4">
                        <div className="text-red-600 dark:text-red-400 text-center">
                            {errorMsg}
                        </div>

                        <div className="flex space-x-4">
                            <button
                                className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded font-medium hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                                onClick={handleRetry}
                            >
                                Retry
                            </button>

                            <button
                                className="px-4 py-2 bg-orange-600 text-white rounded font-medium hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-800 transition-colors"
                                onClick={goToTenantSelector}
                            >
                                Go to Organizations
                            </button>
                        </div>
                    </div>
                )}

                {(!isAuthenticated && status !== 'loading') && (
                    <p className="text-center text-xs text-zinc-400 dark:text-zinc-500">
                        Already have an account?{' '}
                        <Link
                            href={`/login?returnUrl=/${tenant}/invitation/accept?token=${token}`}
                            className="text-orange-600 underline underline-offset-4 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium transition-all duration-300 hover:underline-offset-8"
                        >
                            Sign in
                        </Link>
                        {' '} or {' '}
                        <Link
                            href={`/register?returnUrl=/${tenant}/invitation/accept?token=${token}`}
                            className="text-orange-600 underline underline-offset-4 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium transition-all duration-300 hover:underline-offset-8"
                        >
                            Register
                        </Link>
                    </p>
                )}
            </div>
        </div>
    )
} 