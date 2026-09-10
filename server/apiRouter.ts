import { Router, Request, Response } from 'express';

const CLIENT_ID = 'txNoH4kkV41MfH25';
const CLIENT_SECRET = 'dQjy0MinCEvxi1O4UmxvxWnDjt4cgHBPw8ll6nYBk98=';

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

export async function getTidalToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt - 60000) {
    return cachedToken;
  }

  const authHeader = 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: CLIENT_ID,
  });

  const res = await fetch('https://auth.tidal.com/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: authHeader,
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`Failed to obtain Tidal token from Monochrome credentials: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  const expiresIn = data.expires_in || 14400;
  tokenExpiresAt = now + expiresIn * 1000;
  return cachedToken as string;
}

export function formatCoverUrl(coverId: string | null | undefined, size = '320'): string {
  if (!coverId) {
    return `https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=${size}&auto=format&fit=crop&q=80`;
  }
  if (typeof coverId === 'string' && (coverId.startsWith('http') || coverId.startsWith('data:') || coverId.startsWith('blob:'))) {
    return coverId;
  }
  const formatted = String(coverId).replace(/-/g, '/');
  return `https://resources.tidal.com/images/${formatted}/${size}x${size}.jpg`;
}

export const apiRouter = Router();

// 1. Health & Instances
apiRouter.get('/instances', async (_req: Request, res: Response) => {
  const instances = [
    {
      name: 'Monochrome HiFi (Direct Engine)',
      url: 'https://api.tidal.com',
      status: 'online',
      type: 'official-client',
      notes: 'High-res 320kbps AAC streaming with official Monochrome API credentials',
      official: true,
    },
    {
      name: 'Monochrome Official Web',
      url: 'https://monochrome.tf',
      status: 'online',
      type: 'web-mirror',
      notes: 'Primary official Monochrome web portal',
      official: true,
    },
    {
      name: 'Monochrome Samidy API',
      url: 'https://monochrome-api.samidy.com',
      status: 'online',
      type: 'rest-api',
      notes: 'Official metadata proxy (v2.3 HiFi-RestAPI)',
      official: true,
    },
    {
      name: 'Lossless.wtf Mirror',
      url: 'https://lossless.wtf',
      status: 'online',
      type: 'web-mirror',
      notes: 'Official Monochrome web failover mirror',
      official: true,
    },
    {
      name: 'If-It-Runs-Ship-It Mirror',
      url: 'https://if-it-runs-ship-it.lol',
      status: 'online',
      type: 'web-mirror',
      notes: 'Official Monochrome web failover mirror',
      official: true,
    }
  ];

  res.json({
    success: true,
    activeInstance: 'Monochrome HiFi (Direct Engine)',
    instances,
  });
});

// 2. Search
apiRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const query = String(req.query.q || '').trim();
    if (!query) {
      return res.json({ tracks: [], albums: [], artists: [] });
    }

    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const token = await getTidalToken();

    // Fetch tracks, albums, artists in parallel
    const [tracksRes, albumsRes, artistsRes] = await Promise.all([
      fetch(`https://api.tidal.com/v1/search/tracks?query=${encodeURIComponent(query)}&limit=${limit}&countryCode=US`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.ok ? r.json() : { items: [] }).catch(() => ({ items: [] })),
      fetch(`https://api.tidal.com/v1/search/albums?query=${encodeURIComponent(query)}&limit=10&countryCode=US`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.ok ? r.json() : { items: [] }).catch(() => ({ items: [] })),
      fetch(`https://api.tidal.com/v1/search/artists?query=${encodeURIComponent(query)}&limit=8&countryCode=US`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.ok ? r.json() : { items: [] }).catch(() => ({ items: [] })),
    ]);

    const tracks = (tracksRes.items || []).map((t: any) => ({
      id: t.id,
      title: t.title,
      version: t.version || null,
      duration: t.duration,
      artist: {
        id: t.artist?.id,
        name: t.artist?.name || 'Unknown Artist',
        picture: t.artist?.picture ? formatCoverUrl(t.artist.picture, '320') : null,
      },
      artists: (t.artists || []).map((a: any) => ({
        id: a.id,
        name: a.name,
      })),
      album: {
        id: t.album?.id,
        title: t.album?.title || 'Unknown Album',
        cover: formatCoverUrl(t.album?.cover, '320'),
        coverLarge: formatCoverUrl(t.album?.cover, '640'),
      },
      audioQuality: t.audioQuality || 'HIGH',
      isrc: t.isrc || null,
      trackNumber: t.trackNumber || 1,
      popularity: t.popularity || 0,
    }));

    const albums = (albumsRes.items || []).map((a: any) => ({
      id: a.id,
      title: a.title,
      artist: a.artist?.name || 'Unknown Artist',
      cover: formatCoverUrl(a.cover, '320'),
      coverLarge: formatCoverUrl(a.cover, '640'),
      numberOfTracks: a.numberOfTracks,
      releaseDate: a.releaseDate,
      audioQuality: a.audioQuality || 'LOSSLESS',
    }));

    const artists = (artistsRes.items || []).map((a: any) => ({
      id: a.id,
      name: a.name,
      picture: formatCoverUrl(a.picture, '320'),
      pictureLarge: formatCoverUrl(a.picture, '640'),
      popularity: a.popularity || 0,
    }));

    res.json({ tracks, albums, artists });
  } catch (error: any) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message || 'Search failed' });
  }
});

// 3. Featured / Curated Discovery
apiRouter.get('/featured', async (_req: Request, res: Response) => {
  try {
    const token = await getTidalToken();
    
    // Query a selection of popular iconic artists to curate rich starting albums & tracks
    const popularQueries = ['Daft Punk', 'The Weeknd', 'Kendrick Lamar', 'Dua Lipa', 'Pink Floyd'];
    const randomQuery = popularQueries[Math.floor(Math.random() * popularQueries.length)];

    const [topTracksRes, featuredAlbumsRes] = await Promise.all([
      fetch(`https://api.tidal.com/v1/search/tracks?query=${encodeURIComponent(randomQuery)}&limit=15&countryCode=US`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.ok ? r.json() : { items: [] }).catch(() => ({ items: [] })),
      fetch(`https://api.tidal.com/v1/search/albums?query=${encodeURIComponent('Random Access Memories Starboy Future Nostalgia The Dark Side of the Moon')}&limit=8&countryCode=US`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.ok ? r.json() : { items: [] }).catch(() => ({ items: [] })),
    ]);

    const tracks = (topTracksRes.items || []).map((t: any) => ({
      id: t.id,
      title: t.title,
      version: t.version || null,
      duration: t.duration,
      artist: {
        id: t.artist?.id,
        name: t.artist?.name || 'Unknown Artist',
        picture: t.artist?.picture ? formatCoverUrl(t.artist.picture, '320') : null,
      },
      artists: (t.artists || []).map((a: any) => ({ id: a.id, name: a.name })),
      album: {
        id: t.album?.id,
        title: t.album?.title || 'Unknown Album',
        cover: formatCoverUrl(t.album?.cover, '320'),
        coverLarge: formatCoverUrl(t.album?.cover, '640'),
      },
      audioQuality: t.audioQuality || 'HIGH',
      isrc: t.isrc || null,
      trackNumber: t.trackNumber || 1,
      popularity: t.popularity || 0,
    }));

    const albums = (featuredAlbumsRes.items || []).map((a: any) => ({
      id: a.id,
      title: a.title,
      artist: a.artist?.name || 'Unknown Artist',
      cover: formatCoverUrl(a.cover, '320'),
      coverLarge: formatCoverUrl(a.cover, '640'),
      numberOfTracks: a.numberOfTracks,
      releaseDate: a.releaseDate,
      audioQuality: a.audioQuality || 'LOSSLESS',
    }));

    res.json({
      featuredHeadline: `Spotlight: ${randomQuery}`,
      tracks,
      albums,
    });
  } catch (error: any) {
    console.error('Featured tracks error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch featured content' });
  }
});

// 4. Album Details & Tracks
apiRouter.get('/album/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const token = await getTidalToken();

    const [albumRes, itemsRes] = await Promise.all([
      fetch(`https://api.tidal.com/v1/albums/${id}?countryCode=US`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()),
      fetch(`https://api.tidal.com/v1/albums/${id}/items?limit=100&countryCode=US`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()),
    ]);

    const album = {
      id: albumRes.id,
      title: albumRes.title,
      artist: albumRes.artist?.name || 'Unknown Artist',
      artistId: albumRes.artist?.id,
      cover: formatCoverUrl(albumRes.cover, '320'),
      coverLarge: formatCoverUrl(albumRes.cover, '640'),
      releaseDate: albumRes.releaseDate,
      numberOfTracks: albumRes.numberOfTracks,
      duration: albumRes.duration,
      audioQuality: albumRes.audioQuality || 'LOSSLESS',
    };

    const tracks = (itemsRes.items || []).map((item: any) => {
      const t = item.item || item;
      return {
        id: t.id,
        title: t.title,
        version: t.version || null,
        duration: t.duration,
        trackNumber: t.trackNumber || 1,
        artist: {
          id: t.artist?.id || album.artistId,
          name: t.artist?.name || album.artist,
        },
        artists: t.artists || [{ name: album.artist }],
        album: {
          id: album.id,
          title: album.title,
          cover: album.cover,
          coverLarge: album.coverLarge,
        },
        audioQuality: t.audioQuality || album.audioQuality,
        isrc: t.isrc || null,
      };
    });

    res.json({ album, tracks });
  } catch (error: any) {
    console.error('Album fetch error:', error);
    res.status(500).json({ error: error.message || 'Failed to load album' });
  }
});

// 5. Artist Details & Top Tracks
apiRouter.get('/artist/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const token = await getTidalToken();

    const [artistRes, topTracksRes, albumsRes] = await Promise.all([
      fetch(`https://api.tidal.com/v1/artists/${id}?countryCode=US`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()),
      fetch(`https://api.tidal.com/v1/artists/${id}/toptracks?limit=20&countryCode=US`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.ok ? r.json() : { items: [] }).catch(() => ({ items: [] })),
      fetch(`https://api.tidal.com/v1/artists/${id}/albums?limit=12&countryCode=US`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.ok ? r.json() : { items: [] }).catch(() => ({ items: [] })),
    ]);

    const artist = {
      id: artistRes.id,
      name: artistRes.name,
      picture: formatCoverUrl(artistRes.picture, '320'),
      pictureLarge: formatCoverUrl(artistRes.picture, '640'),
      popularity: artistRes.popularity,
    };

    const tracks = (topTracksRes.items || []).map((t: any) => ({
      id: t.id,
      title: t.title,
      version: t.version || null,
      duration: t.duration,
      trackNumber: t.trackNumber || 1,
      artist: {
        id: artist.id,
        name: artist.name,
      },
      artists: t.artists || [{ id: artist.id, name: artist.name }],
      album: {
        id: t.album?.id,
        title: t.album?.title || '',
        cover: formatCoverUrl(t.album?.cover, '320'),
        coverLarge: formatCoverUrl(t.album?.cover, '640'),
      },
      audioQuality: t.audioQuality || 'HIGH',
      isrc: t.isrc || null,
    }));

    const albums = (albumsRes.items || []).map((a: any) => ({
      id: a.id,
      title: a.title,
      artist: artist.name,
      cover: formatCoverUrl(a.cover, '320'),
      coverLarge: formatCoverUrl(a.cover, '640'),
      numberOfTracks: a.numberOfTracks,
      releaseDate: a.releaseDate,
    }));

    res.json({ artist, tracks, albums });
  } catch (error: any) {
    console.error('Artist fetch error:', error);
    res.status(500).json({ error: error.message || 'Failed to load artist' });
  }
});

// 6. Track Info & Lyrics
apiRouter.get('/track/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const token = await getTidalToken();

    const trackRes = await fetch(`https://api.tidal.com/v1/tracks/${id}?countryCode=US`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!trackRes.ok) {
      return res.status(trackRes.status).json({ error: 'Track not found' });
    }

    const t = await trackRes.json();
    const track = {
      id: t.id,
      title: t.title,
      version: t.version || null,
      duration: t.duration,
      artist: {
        id: t.artist?.id,
        name: t.artist?.name || 'Unknown Artist',
        picture: t.artist?.picture ? formatCoverUrl(t.artist.picture, '320') : null,
      },
      artists: t.artists || [],
      album: {
        id: t.album?.id,
        title: t.album?.title,
        cover: formatCoverUrl(t.album?.cover, '320'),
        coverLarge: formatCoverUrl(t.album?.cover, '640'),
      },
      audioQuality: t.audioQuality,
      isrc: t.isrc,
      bpm: t.bpm,
      trackNumber: t.trackNumber,
    };

    res.json(track);
  } catch (error: any) {
    console.error('Track fetch error:', error);
    res.status(500).json({ error: error.message || 'Failed to load track' });
  }
});

// 7. Lyrics
apiRouter.get('/lyrics/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const token = await getTidalToken();

    const lyricsRes = await fetch(`https://api.tidal.com/v1/tracks/${id}/lyrics?countryCode=US`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (lyricsRes.ok) {
      const data = await lyricsRes.json();
      return res.json({
        found: true,
        lyrics: data.lyrics || data.subtitles || '',
        subtitles: data.subtitles || null,
      });
    }

    res.json({
      found: false,
      lyrics: null,
      message: 'No synced lyrics found for this track in Monochrome repository.',
    });
  } catch {
    res.json({ found: false, lyrics: null });
  }
});

// 8. AUDIO STREAMING PROXY
// Pulls the DASH MPD manifest signed by CloudFront using Monochrome credentials,
// unescapes CloudFront URLs, and streams initial ISO BMFF fMP4 + audio segments directly.
apiRouter.get('/stream', async (req: Request, res: Response) => {
  try {
    const trackId = req.query.trackId;
    if (!trackId) {
      return res.status(400).send('Missing trackId');
    }

    const quality = (String(req.query.quality || 'HIGH')).toUpperCase();
    const token = await getTidalToken();

    const playbackRes = await fetch(
      `https://api.tidal.com/v1/tracks/${trackId}/playbackinfo?audioquality=${quality}&playbackmode=STREAM&assetpresentation=FULL&countryCode=US`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!playbackRes.ok) {
      const errText = await playbackRes.text().catch(() => '');
      return res.status(playbackRes.status).send(`Playback info failed: ${errText}`);
    }

    const playbackData = await playbackRes.json();
    if (!playbackData.manifest) {
      return res.status(404).send('No stream manifest found for track');
    }

    const manifestXml = Buffer.from(playbackData.manifest, 'base64').toString('utf-8');
    const initMatch = manifestXml.match(/initialization="([^"]+)"/);
    const mediaMatch = manifestXml.match(/media="([^"]+)"/);

    if (!initMatch || !mediaMatch) {
      return res.status(502).send('Could not extract media URLs from stream manifest');
    }

    const initUrl = initMatch[1].replace(/&amp;/g, '&');
    const mediaTemplate = mediaMatch[1].replace(/&amp;/g, '&');

    // Determine segment count
    const rMatch = manifestXml.match(/<S d="\d+" r="(\d+)"\/>/);
    const repeatCount = rMatch ? parseInt(rMatch[1], 10) : 0;
    const individualMatches = manifestXml.match(/<S d="\d+"\/>/g)?.length || 1;
    const totalSegments = 1 + repeatCount + individualMatches;

    // Set audio headers
    res.setHeader('Content-Type', 'audio/mp4');
    res.setHeader('Accept-Ranges', 'none');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    // Stream the initialization segment (0.mp4 - ftyp + moov atoms)
    const initRes = await fetch(initUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    if (!initRes.ok) {
      return res.status(initRes.status).send('Failed to fetch initial audio segment');
    }

    const initBuf = Buffer.from(await initRes.arrayBuffer());
    res.write(initBuf);

    // Stream subsequent segments in order
    let clientDisconnected = false;
    req.on('close', () => {
      clientDisconnected = true;
    });

    for (let seg = 1; seg <= totalSegments; seg++) {
      if (clientDisconnected) break;
      const segUrl = mediaTemplate.replace('$Number$', String(seg));
      try {
        const segRes = await fetch(segUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
        });
        if (!segRes.ok) {
          // If segment is 403 or 404, we have reached end of stream
          break;
        }
        const segBuf = Buffer.from(await segRes.arrayBuffer());
        res.write(segBuf);
      } catch {
        break;
      }
    }

    res.end();
  } catch (error: any) {
    console.error('Audio stream error:', error);
    if (!res.headersSent) {
      res.status(500).send(error.message || 'Streaming failed');
    } else {
      res.end();
    }
  }
});
