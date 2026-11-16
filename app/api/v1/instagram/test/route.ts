import { NextRequest, NextResponse } from 'next/server';

/**
 * INSTAGRAM TESTING LAB PROXY & OAUTH ENDPOINT
 * Safely handles App Secret operations on server side,
 * provides token debugging, account discovery, media browser, and messaging test.
 */
export async function GET(req: NextRequest) {
  const appId = process.env.INSTAGRAM_APP_ID || '28857766263891383';
  const hasSecret = !!process.env.INSTAGRAM_APP_SECRET;
  const currentToken = process.env.INSTAGRAM_ACCESS_TOKEN || null;

  const url = new URL(req.url);
  const redirectUri = url.searchParams.get('redirect_uri') || `${url.origin}/instagram-test.html`;

  // Standard Instagram Graph API & Messaging Scopes
  const scopes = [
    'instagram_basic',
    'instagram_manage_messages',
    'instagram_manage_contents',
    'pages_show_list',
    'pages_read_engagement',
    'pages_manage_metadata',
    'business_management',
  ].join(',');

  const oauthUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${encodeURIComponent(scopes)}&response_type=code`;

  return NextResponse.json({
    success: true,
    app_id: appId,
    has_secret: hasSecret,
    has_configured_token: !!currentToken,
    recommended_redirect_uri: redirectUri,
    oauth_url: oauthUrl,
    scopes: scopes.split(','),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    const appId = body.app_id || process.env.INSTAGRAM_APP_ID || '28857766263891383';
    const appSecret = body.app_secret || process.env.INSTAGRAM_APP_SECRET;

    // 1. EXCHANGE OAUTH CODE FOR ACCESS TOKEN
    if (action === 'exchange_code') {
      const { code, redirect_uri } = body;
      if (!code) {
        return NextResponse.json({ success: false, error: 'Code is required' }, { status: 400 });
      }
      if (!appSecret) {
        return NextResponse.json({ success: false, error: 'INSTAGRAM_APP_SECRET is not configured' }, { status: 400 });
      }

      const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&redirect_uri=${encodeURIComponent(
        redirect_uri
      )}&code=${code}`;

      const res = await fetch(tokenUrl);
      const data = await res.json();

      if (!res.ok || data.error) {
        return NextResponse.json({ success: false, error: data.error?.message || 'Token exchange failed', details: data }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        access_token: data.access_token,
        token_type: data.token_type,
        expires_in: data.expires_in,
      });
    }

    // 2. EXCHANGE FOR 60-DAY LONG-LIVED ACCESS TOKEN
    if (action === 'exchange_long_lived') {
      const { access_token } = body;
      if (!access_token || !appSecret) {
        return NextResponse.json({ success: false, error: 'access_token and app_secret are required' }, { status: 400 });
      }

      const url = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${access_token}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || data.error) {
        return NextResponse.json({ success: false, error: data.error?.message || 'Long-lived exchange failed', details: data }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        access_token: data.access_token,
        token_type: data.token_type,
        expires_in_seconds: data.expires_in,
        expires_in_days: Math.round((data.expires_in || 5184000) / 86400),
      });
    }

    // 3. DEBUG & INSPECT TOKEN
    if (action === 'debug_token') {
      const { access_token } = body;
      if (!access_token) {
        return NextResponse.json({ success: false, error: 'access_token is required' }, { status: 400 });
      }

      const appToken = `${appId}|${appSecret}`;
      const url = `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(access_token)}&access_token=${encodeURIComponent(appToken)}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || data.error) {
        return NextResponse.json({ success: false, error: data.error?.message || 'Token inspection failed', details: data }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        data: data.data,
      });
    }

    // 4. GET LINKED INSTAGRAM ACCOUNTS (VIA FACEBOOK PAGES)
    if (action === 'get_accounts') {
      const token = body.access_token || process.env.INSTAGRAM_ACCESS_TOKEN;
      if (!token) {
        return NextResponse.json({ success: false, error: 'access_token is required' }, { status: 400 });
      }

      const url = `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,category,access_token,instagram_business_account{id,username,name,profile_picture_url,followers_count,media_count}&access_token=${token}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || data.error) {
        // Fallback: try graph.instagram.com/me in case it is an Instagram User Token directly
        const directRes = await fetch(`https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${token}`);
        const directData = await directRes.json();

        if (directRes.ok && !directData.error) {
          return NextResponse.json({
            success: true,
            source: 'instagram_basic_display',
            accounts: [
              {
                id: directData.id,
                name: directData.username,
                is_direct_instagram: true,
                instagram_business_account: {
                  id: directData.id,
                  username: directData.username,
                  account_type: directData.account_type,
                  media_count: directData.media_count,
                },
              },
            ],
          });
        }

        return NextResponse.json({ success: false, error: data.error?.message || 'Failed to fetch accounts', details: data }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        source: 'facebook_pages_graph',
        pages: data.data || [],
      });
    }

    // 5. GET MEDIA CONTENT
    if (action === 'get_media') {
      const { instagram_account_id, access_token } = body;
      const token = access_token || process.env.INSTAGRAM_ACCESS_TOKEN;
      if (!instagram_account_id || !token) {
        return NextResponse.json({ success: false, error: 'instagram_account_id and access_token are required' }, { status: 400 });
      }

      const limit = Math.min(Number(body.limit || 20), 50);
      const fields = 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count';
      
      // Try Facebook Graph API path first
      let res = await fetch(
        `https://graph.facebook.com/v21.0/${instagram_account_id}/media?fields=${fields}&limit=${limit}&access_token=${token}`
      );
      let data = await res.json();

      // If failed, try graph.instagram.com
      if (!res.ok || data.error) {
        res = await fetch(
          `https://graph.instagram.com/me/media?fields=${fields}&limit=${limit}&access_token=${token}`
        );
        data = await res.json();
      }

      if (!res.ok || data.error) {
        return NextResponse.json({ success: false, error: data.error?.message || 'Failed to fetch media', details: data }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        media: data.data || [],
        paging: data.paging,
      });
    }

    // 6. GET MESSAGES & CONVERSATIONS (INSTAGRAM DM)
    if (action === 'get_conversations') {
      const { instagram_account_id, access_token } = body;
      const token = access_token || process.env.INSTAGRAM_ACCESS_TOKEN;
      if (!instagram_account_id || !token) {
        return NextResponse.json({ success: false, error: 'instagram_account_id and access_token are required' }, { status: 400 });
      }

      const url = `https://graph.facebook.com/v21.0/${instagram_account_id}/conversations?platform=instagram&fields=id,updated_time,participants,messages{id,message,created_time,from}&access_token=${token}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || data.error) {
        return NextResponse.json({ success: false, error: data.error?.message || 'Failed to fetch conversations', details: data }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        conversations: data.data || [],
      });
    }

    // 7. SEND DIRECT MESSAGE
    if (action === 'send_message') {
      const { instagram_account_id, recipient_id, text, access_token } = body;
      const token = access_token || process.env.INSTAGRAM_ACCESS_TOKEN;
      if (!instagram_account_id || !recipient_id || !text || !token) {
        return NextResponse.json(
          { success: false, error: 'instagram_account_id, recipient_id, text, and access_token are required' },
          { status: 400 }
        );
      }

      const url = `https://graph.facebook.com/v21.0/${instagram_account_id}/messages`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: recipient_id },
          message: { text },
          access_token: token,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        return NextResponse.json({ success: false, error: data.error?.message || 'Failed to send message', details: data }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        result: data,
      });
    }

    // 8. SEARCH REELS BY LOCATION / HASHTAG
    if (action === 'search_location_reels') {
      const { instagram_account_id, query, access_token } = body;
      const token = access_token || process.env.INSTAGRAM_ACCESS_TOKEN;

      if (!query) {
        return NextResponse.json({ success: false, error: 'query parameter is required' }, { status: 400 });
      }

      // Convert query into clean hashtag (alphanumeric only, no spaces)
      const cleanHashtag = String(query).replace(/[^\w\u0600-\u06FF]/g, '').toLowerCase();

      // If user provided Instagram account and token, search Meta Hashtag API
      if (instagram_account_id && token) {
        try {
          const searchUrl = `https://graph.facebook.com/v21.0/ig_hashtag_search?user_id=${instagram_account_id}&q=${encodeURIComponent(
            cleanHashtag
          )}&access_token=${token}`;
          const searchRes = await fetch(searchUrl);
          const searchData = await searchRes.json();

          if (searchRes.ok && searchData.data && searchData.data.length > 0) {
            const hashtagId = searchData.data[0].id;
            const mediaUrl = `https://graph.facebook.com/v21.0/${hashtagId}/top_media?user_id=${instagram_account_id}&fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count&limit=25&access_token=${token}`;
            const mediaRes = await fetch(mediaUrl);
            const mediaData = await mediaRes.json();

            if (mediaRes.ok && mediaData.data) {
              const reels = mediaData.data.filter((m: any) => m.media_type === 'VIDEO' || m.media_type === 'CAROUSEL_ALBUM' || m.media_url);
              return NextResponse.json({
                success: true,
                source: 'instagram_hashtag_api',
                hashtag: cleanHashtag,
                hashtag_id: hashtagId,
                total: reels.length,
                reels: reels.map((r: any) => ({
                  id: r.id,
                  provider: 'instagram',
                  caption: r.caption,
                  type: r.media_type === 'VIDEO' ? 'REEL' : r.media_type,
                  url: r.permalink,
                  media_url: r.media_url || r.thumbnail_url,
                  thumbnail: r.thumbnail_url || r.media_url,
                  like_count: r.like_count,
                  comments_count: r.comments_count,
                  timestamp: r.timestamp,
                })),
              });
            }
          }
        } catch (e: any) {
          // Continue to fallback
        }
      }

      return NextResponse.json({
        success: false,
        source: 'instagram_hashtag_api',
        hashtag: cleanHashtag,
        error: 'To search Instagram Reels by place, your Instagram Professional Account must be connected with a valid Access Token.',
        hint: 'Use the Graph API Explorer to generate a Page Token with instagram_basic scope, or use the YouTube Shorts endpoint for unrestricted place searches.'
      }, { status: 400 });
    }

    // 9. RAW GRAPH API PROXY (FLEXIBLE TESTER)
    if (action === 'raw_proxy') {
      const { endpoint, method = 'GET', payload, access_token } = body;
      const token = access_token || process.env.INSTAGRAM_ACCESS_TOKEN;
      if (!endpoint || !token) {
        return NextResponse.json({ success: false, error: 'endpoint and access_token are required' }, { status: 400 });
      }

      const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
      const url = new URL(`https://graph.facebook.com/v21.0/${cleanEndpoint}`);
      
      const options: RequestInit = {
        method,
        headers: {},
      };

      if (method === 'GET') {
        url.searchParams.set('access_token', token);
        if (payload && typeof payload === 'object') {
          for (const [k, v] of Object.entries(payload)) {
            url.searchParams.set(k, String(v));
          }
        }
      } else {
        options.headers = { 'Content-Type': 'application/json' };
        options.body = JSON.stringify({
          ...(payload || {}),
          access_token: token,
        });
      }

      const res = await fetch(url.toString(), options);
      const data = await res.json();

      return NextResponse.json({
        success: res.ok,
        status: res.status,
        data,
      });
    }

    return NextResponse.json({ success: false, error: `Unknown action "${action}"` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Server error' }, { status: 500 });
  }
}

