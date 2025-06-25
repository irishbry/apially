
export interface DropboxTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export const DropboxOAuthService = {
  async refreshAccessToken(appKey: string, appSecret: string, refreshToken: string): Promise<DropboxTokenResponse | null> {
    try {
      const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${appKey}:${appSecret}`)}`
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        })
      });

      if (!response.ok) {
        console.error('Failed to refresh Dropbox token:', response.status, await response.text());
        return null;
      }

      const tokenData: DropboxTokenResponse = await response.json();
      return tokenData;
    } catch (error) {
      console.error('Error refreshing Dropbox token:', error);
      return null;
    }
  },

  generateAuthUrl(appKey: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: appKey,
      response_type: 'code',
      redirect_uri: redirectUri,
      token_access_type: 'offline' // This ensures we get a refresh token
    });
    
    return `https://www.dropbox.com/oauth2/authorize?${params.toString()}`;
  },

  async exchangeCodeForTokens(appKey: string, appSecret: string, code: string, redirectUri: string): Promise<DropboxTokenResponse | null> {
    try {
      const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${appKey}:${appSecret}`)}`
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirectUri
        })
      });

      if (!response.ok) {
        console.error('Failed to exchange code for tokens:', response.status, await response.text());
        return null;
      }

      const tokenData: DropboxTokenResponse = await response.json();
      return tokenData;
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      return null;
    }
  }
};
