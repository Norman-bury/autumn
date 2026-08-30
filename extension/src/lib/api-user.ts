import { buildUrl } from './url';
import {
  API_ENDPOINTS,
  ApiClientError,
  AuthenticationError,
  createTimeoutController,
  fetchJson,
  getConfiguredSettings,
  NetworkError,
  type UserProfileAutofillResponse,
  type UserProfileResponse,
  TimeoutError,
} from './api-core';

export async function getProfile(): Promise<UserProfileResponse> {
  return fetchJson<UserProfileResponse>(API_ENDPOINTS.PROFILE, {
    method: 'GET',
  });
}

export async function getAutofillProfile(): Promise<UserProfileAutofillResponse> {
  try {
    return await fetchJson<UserProfileAutofillResponse>(
      API_ENDPOINTS.PROFILE_AUTOFILL,
      {
        method: 'GET',
      }
    );
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) {
      return toAutofillProfile(await getProfile());
    }
    throw error;
  }
}

function toAutofillProfile(
  profile: UserProfileResponse
): UserProfileAutofillResponse {
  return {
    first_name: profile.first_name,
    last_name: profile.last_name,
    email: profile.email,
    phone: profile.phone,
    city: profile.city,
    country: profile.country,
    linkedin_url: profile.linkedin_url,
    github_url: profile.github_url,
    portfolio_url: profile.portfolio_url,
    highest_degree: profile.highest_degree,
    current_school: profile.current_school,
    major: profile.major,
    education_start_date: profile.education_start_date,
    education_end_date: profile.education_end_date,
    graduation_year: profile.graduation_year,
    target_roles: profile.target_roles,
    preferred_locations: profile.preferred_locations,
    skills: profile.skills,
    self_summary: profile.self_summary,
    field_policies: {},
    never_guess: [],
  };
}

export async function testConnection(): Promise<boolean> {
  const settings = await getConfiguredSettings();
  const { controller, timeoutId } = createTimeoutController();
  try {
    const response = await fetch(
      `${buildUrl(settings.appUrl, API_ENDPOINTS.JOB_LEADS)}?per_page=1`,
      {
        method: 'GET',
        headers: { 'X-API-Key': settings.apiKey },
        signal: controller.signal,
      }
    );
    if (!response.ok) {
      if (response.status === 401)
        throw new AuthenticationError('Invalid API key.');
      throw new NetworkError(`Server returned status ${response.status}`);
    }
    return true;
  } catch (error) {
    if (error instanceof ApiClientError) throw error;
    if (error instanceof Error && error.name === 'AbortError')
      throw new TimeoutError('Connection test timed out.');
    throw new NetworkError(
      error instanceof Error ? error.message : 'Connection failed'
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
