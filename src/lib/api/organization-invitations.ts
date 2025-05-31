/**
 * API functions for organization invitations
 */

import { api } from './client'

export interface InviteUserRequest {
    email: string
}

export interface OrganizationInvitationResponse {
    id: string
    recipientEmail: string
    status: string
    expiresAt: string
    inviterId: string
    organizationUnitId: string
}

export interface AcceptInvitationRequest {
    token: string
}

export interface AcceptInvitationResponse {
    success: boolean
    invitedEmail?: string
}

/**
 * Response interface for token check
 */
export interface CheckTokenResponse {
    status: string
    recipientEmail: string
    expiresAt: string
    organizationUnitId: string
}

/**
 * Organization invitations API
 */
export const organizationInvitationsApi = {
    /**
     * Invite a user to an organization
     * 
     * @param tenant The organization slug
     * @param email The email address to invite
     * @returns The created invitation
     */
    inviteUser: async (tenant: string, email: string): Promise<OrganizationInvitationResponse> => {
        return api.post<OrganizationInvitationResponse>(
            `${tenant}/api/organization-invitations`,
            { email }
        )
    },

    /**
     * Accept an invitation
     * 
     * @param tenant The organization slug
     * @param token The invitation token
     * @returns Success response
     */
    acceptInvitation: async (tenant: string, token: string): Promise<AcceptInvitationResponse> => {
        try {
            const response = await api.post<AcceptInvitationResponse>(
                `${tenant}/api/organization-invitations/accept`,
                { token }
            );
            if (!response) {
                throw new Error('Empty response received');
            }
            if (typeof response.success === 'undefined') {
                return { success: true };
            }
            return response;
        } catch (err: unknown) {
            console.error('Invitation accept error:', err);
            const errorObj = err as { status?: number; message?: string; response?: { data?: { message?: string } } };
            if (errorObj?.status === 409) {
                return { success: true };
            }
            if (errorObj && typeof errorObj === 'object' && errorObj.message) {
                if (typeof errorObj.message === 'string') {
                    throw new Error(errorObj.message);
                }
            }
            if (errorObj?.response?.data?.message) {
                throw new Error(errorObj.response.data.message);
            }
            if (err instanceof Response) {
                try {
                    const data = await err.json();
                    if (data?.message) throw new Error(data.message);
                } catch { }
            }
            throw new Error(errorObj?.message ?? 'Failed to accept invitation.');
        }
    },

    /**
     * Check if an email has already been invited
     * @param tenant The organization slug
     * @param email The email address to check
     * @returns { invited: boolean, status?: string }
     */
    checkInvitation: async (tenant: string, email: string): Promise<{ invited: boolean, status?: string }> => {
        return api.get<{ invited: boolean, status?: string }>(
            `${tenant}/api/organization-invitations/check?email=${encodeURIComponent(email)}`
        )
    },

    /**
     * Check the status of an invitation token
     * 
     * @param tenant The organization slug
     * @param token The invitation token
     * @returns The invitation status and details
     */
    checkInvitationToken: async (tenant: string, token: string): Promise<CheckTokenResponse> => {
        try {
            return await api.get<CheckTokenResponse>(
                `${tenant}/api/organization-invitations/check-token?token=${encodeURIComponent(token)}`
            );
        } catch (err: unknown) {
            console.error('Error checking invitation token:', err);
            const errorObj = err as { status?: number; message?: string };
            if (errorObj?.status === 404) {
                return {
                    status: 'Invalid',
                    recipientEmail: '',
                    expiresAt: '',
                    organizationUnitId: ''
                };
            }
            throw err;
        }
    }
} 