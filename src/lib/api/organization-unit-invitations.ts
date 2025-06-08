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

function parseAcceptInvitationError(err: unknown): { success: true } | never {
    const errorObj = err as { status?: number; message?: string; response?: { data?: { message?: string } } };
    if (errorObj?.status === 409) return { success: true };
    if (errorObj?.response?.data?.message) throw new Error(errorObj.response.data.message);
    if (errorObj?.message) throw new Error(errorObj.message);
    throw new Error('Failed to accept invitation.');
}

/**
 * Processes an OData response or array to ensure consistent format
 * @param response The response from the server (either an OData object or array)
 * @returns A properly formatted OData response
 */
function processODataResponse(response: unknown): { value: OrganizationInvitationResponse[]; '@odata.count'?: number } {
    // If it's already in OData format
    if (typeof response === 'object' && response !== null && 'value' in response) {
        return response as { value: OrganizationInvitationResponse[]; '@odata.count'?: number };
    }

    // If it's an array (non-OData format)
    if (Array.isArray(response)) {
        return { value: response as OrganizationInvitationResponse[], '@odata.count': response.length };
    }

    // If it has invitations property (old API format)
    if (typeof response === 'object' && response !== null && 'invitations' in response) {
        const typedResponse = response as { count: number; invitations: OrganizationInvitationResponse[] };
        return {
            value: typedResponse.invitations,
            '@odata.count': typedResponse.count
        };
    }

    // Default empty response
    return { value: [] };
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
            `${tenant}/api/organization-unit-invitation`,
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
                `${tenant}/api/organization-unit-invitation/accept`,
                { token }
            );
            if (!response) throw new Error('Empty response received');
            if (typeof response.success === 'undefined') return { success: true };
            return response;
        } catch (err) {
            return parseAcceptInvitationError(err);
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
            `${tenant}/api/organization-unit-invitation/check?email=${encodeURIComponent(email)}`
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
                `${tenant}/api/organization-unit-invitation/check-token?token=${encodeURIComponent(token)}`
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
    },

    /**
     * Get list invitation in OU (OData)
     * @param tenant The organization slug
     * @param odataOptions OData params (filter, top, skip, count)
     * @returns OData response { value: OrganizationInvitationResponse[], @odata.count: number }
     */
    listInvitations: async (
        tenant: string,
        odataOptions?: Record<string, any>
    ): Promise<{ value: OrganizationInvitationResponse[]; '@odata.count'?: number }> => {
        let url = `/${tenant}/odata/OrganizationUnitInvitations`;
        if (odataOptions) {
            const params = new URLSearchParams();
            Object.entries(odataOptions).forEach(([k, v]) => {
                if (v !== undefined) params.append(k, v as string);
            });
            url += `?${params.toString()}`;
        }
        const response = await api.get<unknown>(url);
        return processODataResponse(response);
    },
} 