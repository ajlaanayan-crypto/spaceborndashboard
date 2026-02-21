import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const urlToFetch = searchParams.get('url');

        if (!urlToFetch) {
            return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
        }

        // Validate URL
        try {
            new URL(urlToFetch);
        } catch {
            return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
        }

        // Check if it's a YouTube URL to use OEmbed (more reliable)
        const isYouTube = urlToFetch.includes('youtube.com') || urlToFetch.includes('youtu.be');

        if (isYouTube) {
            try {
                const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(urlToFetch)}&format=json`;
                const ytRes = await fetch(oembedUrl);
                if (ytRes.ok) {
                    const ytData = await ytRes.json();
                    return NextResponse.json({
                        title: ytData.title || '',
                        description: ytData.author_name ? `Video by ${ytData.author_name}` : '',
                        thumbnailUrl: ytData.thumbnail_url || ''
                    });
                }
            } catch (ytErr) {
                console.error("YouTube OEmbed Error, falling back to scraping:", ytErr);
            }
        }

        const response = await fetch(urlToFetch, {
            headers: {
                // Imitate a standard browser to avoid basic bot-blocks
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            },
            next: { revalidate: 3600 } // Cache for 1 hour to prevent abuse
        });

        if (!response.ok) {
            return NextResponse.json({ error: `Failed to fetch URL: ${response.statusText}` }, { status: response.status });
        }

        const html = await response.text();

        // Extract Title (Try og:title first, then standard <title>)
        let title = '';
        const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["'](.*?)["'][^>]*>/i) ||
            html.match(/<meta[^>]*content=["'](.*?)["'][^>]*property=["']og:title["'][^>]*>/i);
        if (ogTitleMatch && ogTitleMatch[1]) {
            title = ogTitleMatch[1];
        } else {
            const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
            if (titleMatch && titleMatch[1]) {
                title = titleMatch[1];
            }
        }

        // Extract Description
        let description = '';
        const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["'](.*?)["'][^>]*>/i) ||
            html.match(/<meta[^>]*content=["'](.*?)["'][^>]*property=["']og:description["'][^>]*>/i);
        if (ogDescMatch && ogDescMatch[1]) {
            description = ogDescMatch[1];
        } else {
            const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["'][^>]*>/i) ||
                html.match(/<meta[^>]*content=["'](.*?)["'][^>]*name=["']description["'][^>]*>/i);
            if (metaDescMatch && metaDescMatch[1]) {
                description = metaDescMatch[1];
            }
        }

        // Extract Image
        let imageUrl = '';
        const ogImgMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["'](.*?)["'][^>]*>/i) ||
            html.match(/<meta[^>]*content=["'](.*?)["'][^>]*property=["']og:image["'][^>]*>/i);
        if (ogImgMatch && ogImgMatch[1]) {
            imageUrl = ogImgMatch[1];

            // Handle relative URLs in og:image
            if (imageUrl.startsWith('/')) {
                const urlObj = new URL(urlToFetch);
                imageUrl = `${urlObj.protocol}//${urlObj.host}${imageUrl}`;
            }
        }

        // Decode HTML entities roughly to format strings cleanly
        const decodeHtml = (str: string) => {
            return str
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#039;/g, "'")
                .replace(/&apos;/g, "'");
        };

        return NextResponse.json({
            title: title ? decodeHtml(title).trim() : '',
            description: description ? decodeHtml(description).trim() : '',
            thumbnailUrl: imageUrl ? decodeHtml(imageUrl).trim() : ''
        });

    } catch (error: any) {
        console.error("Metadata Fetch Error:", error);
        return NextResponse.json({ error: 'Failed to extract metadata' }, { status: 500 });
    }
}
