import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_CONFIG } from '../../utils/constants';

const baseQuery = fetchBaseQuery({
  baseUrl: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('content-type', 'application/json');
    return headers;
  },
});

// Base query avec gestion des erreurs d'auth
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Token expiré, déconnecter l'utilisateur
    api.dispatch({ type: 'auth/logout' });
  }

  return result;
};

export const footballApi = createApi({
  reducerPath: 'footballApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'User',
    'Team',
    'Match',
    'Invitation',
    'PlayerInvitation',
    'Notification',
  ],
  endpoints: builder => ({
    // Auth endpoints
    login: builder.mutation({
      query: credentials => ({
        url: API_CONFIG.ENDPOINTS.LOGIN,
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation({
      query: userData => ({
        url: API_CONFIG.ENDPOINTS.REGISTER,
        method: 'POST',
        body: userData,
      }),
    }),

    // User endpoints
    getProfile: builder.query({
      query: () => API_CONFIG.ENDPOINTS.PROFILE,
      providesTags: ['User'],
    }),
    updateProfile: builder.mutation({
      query: userData => ({
        url: API_CONFIG.ENDPOINTS.UPDATE_PROFILE,
        method: 'PATCH',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),

    // Teams endpoints
    getMyTeams: builder.query({
      query: () => API_CONFIG.ENDPOINTS.MY_TEAMS,
      providesTags: ['Team'],
    }),
    getTeams: builder.query({
      query: params => ({
        url: API_CONFIG.ENDPOINTS.TEAMS,
        params,
      }),
      providesTags: ['Team'],
    }),
    createTeam: builder.mutation({
      query: teamData => ({
        url: API_CONFIG.ENDPOINTS.TEAMS,
        method: 'POST',
        body: teamData,
      }),
      invalidatesTags: ['Team'],
    }),
    updateTeam: builder.mutation({
      query: ({ id, ...teamData }) => ({
        url: `${API_CONFIG.ENDPOINTS.TEAMS}/${id}`,
        method: 'PATCH',
        body: teamData,
      }),
      invalidatesTags: ['Team'],
    }),
    deleteTeam: builder.mutation({
      query: id => ({
        url: `${API_CONFIG.ENDPOINTS.TEAMS}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Team'],
    }),

    // Matches endpoints
    getMatches: builder.query({
      query: params => ({
        url: API_CONFIG.ENDPOINTS.MATCHES,
        params,
      }),
      providesTags: ['Match'],
    }),
    createMatch: builder.mutation({
      query: matchData => ({
        url: API_CONFIG.ENDPOINTS.MATCHES,
        method: 'POST',
        body: matchData,
      }),
      invalidatesTags: ['Match'],
    }),

    // Match Invitations
    getMatchInvitations: builder.query({
      query: params => ({
        url: API_CONFIG.ENDPOINTS.MATCH_INVITATIONS,
        params,
      }),
      providesTags: ['Invitation'],
    }),
    respondToInvitation: builder.mutation({
      query: ({ id, response, message }) => ({
        url: API_CONFIG.ENDPOINTS.RESPOND_INVITATION.replace(':id', id),
        method: 'PATCH',
        body: { response, message },
      }),
      invalidatesTags: ['Invitation', 'Match'],
    }),

    // Player Invitations
    getPlayerInvitations: builder.query({
      query: params => ({
        url: API_CONFIG.ENDPOINTS.PLAYER_INVITATIONS,
        params,
      }),
      providesTags: ['PlayerInvitation'],
    }),
    sendPlayerInvitation: builder.mutation({
      query: invitationData => ({
        url: API_CONFIG.ENDPOINTS.PLAYER_INVITATIONS,
        method: 'POST',
        body: invitationData,
      }),
      invalidatesTags: ['PlayerInvitation'],
    }),
    respondToPlayerInvitation: builder.mutation({
      query: ({ id, response, message }) => ({
        url: `${API_CONFIG.ENDPOINTS.PLAYER_INVITATIONS}/${id}/respond`,
        method: 'PATCH',
        body: { response, message },
      }),
      invalidatesTags: ['PlayerInvitation', 'Team'],
    }),
  }),
});

// Export des hooks générés automatiquement
export const {
  // Auth
  useLoginMutation,
  useRegisterMutation,

  // User
  useGetProfileQuery,
  useUpdateProfileMutation,

  // Teams
  useGetMyTeamsQuery,
  useGetTeamsQuery,
  useCreateTeamMutation,
  useUpdateTeamMutation,
  useDeleteTeamMutation,

  // Matches
  useGetMatchesQuery,
  useCreateMatchMutation,

  // Match Invitations
  useGetMatchInvitationsQuery,
  useRespondToInvitationMutation,

  // Player Invitations
  useGetPlayerInvitationsQuery,
  useSendPlayerInvitationMutation,
  useRespondToPlayerInvitationMutation,
} = footballApi;
