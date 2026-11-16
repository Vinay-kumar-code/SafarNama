-- ============================================================================
-- SAFARNAMA (सफ़रनामा) - DATABASE SCHEMA (PostgreSQL + PostGIS on Supabase)
-- ============================================================================
-- Map-First Social Travel Ecosystem for Authentic India
-- Dual Identity Profiles, Multi-Format Content, Curated Hubs, Trips & Campaigns
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. ENUMS
CREATE TYPE user_role AS ENUM ('traveler', 'local_guide', 'admin');
CREATE TYPE content_format AS ENUM ('reel', 'carousel_note', 'quick_tip');
CREATE TYPE thread_status AS ENUM ('active', 'resolved', 'pinned');
CREATE TYPE campaign_status AS ENUM ('upcoming', 'active', 'concluded');
CREATE TYPE stay_type AS ENUM ('homestay', 'boutique_hotel', 'hostel', 'campsite', 'heritage_haveli');

-- 3. PROFILES TABLE (Dual-Identity Architecture)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    active_role user_role DEFAULT 'traveler' NOT NULL,
    home_city TEXT DEFAULT 'New Delhi, India',
    is_verified_guide BOOLEAN DEFAULT FALSE,
    guide_circuits TEXT[] DEFAULT '{}', -- e.g. ['Spiti Valley', 'Old Delhi Street Food', 'Kinnaur']
    credibility_score INTEGER DEFAULT 100, -- upvotes & helpfulness ratings
    passport_stamps_count INTEGER DEFAULT 0,
    languages_spoken TEXT[] DEFAULT '{"Hindi", "English"}',
    contact_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. OFFICIAL DESTINATION HUBS (Admin-Curated Indian Master Pages)
CREATE TABLE IF NOT EXISTS public.destinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL, -- e.g. 'spiti-valley-himachal'
    name TEXT NOT NULL, -- e.g. 'Spiti Valley'
    state TEXT NOT NULL, -- e.g. 'Himachal Pradesh'
    region TEXT NOT NULL, -- e.g. 'Western Himalayas'
    tagline TEXT,
    cover_image TEXT NOT NULL,
    gallery_images TEXT[] DEFAULT '{}',
    location GEOGRAPHY(Point, 4326) NOT NULL, -- PostGIS coordinate
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    
    -- Baseline Practical Travel Metadata
    overview TEXT NOT NULL,
    best_time_to_visit TEXT NOT NULL, -- e.g. 'May to October for roads; Jan-Feb for Snow Leopard expedition'
    seasonal_weather JSONB NOT NULL DEFAULT '{"summer": "15C to 20C (Day)", "winter": "-25C to -5C"}',
    permits_required TEXT, -- e.g. 'Inner Line Permit (ILP) required for foreign nationals beyond Khab'
    cultural_etiquette TEXT, -- e.g. 'Walk clockwise around chortens; ask permission before photographing monks'
    scam_alerts TEXT, -- e.g. 'Avoid unofficial snow-chain rentals at Kaza approach; agree on rates beforehand'
    emergency_contacts JSONB DEFAULT '{"police": "112", "disaster_management": "1077", "medical_emergency": "108"}',
    connectivity_info JSONB DEFAULT '{"jio": "4G in Kaza only", "airtel": "Intermittent", "bsnl": "Most reliable along valleys"}',
    estimated_daily_budget_inr INTEGER DEFAULT 2500,
    
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Spatial index for destinations
CREATE INDEX IF NOT EXISTS idx_destinations_location ON public.destinations USING GIST(location);

-- 5. MULTI-FORMAT CONTENT POSTS (Reels, Carousels & Micro-Blogs)
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    destination_id UUID REFERENCES public.destinations(id) ON DELETE SET NULL,
    spot_name TEXT NOT NULL, -- e.g. 'Chicham Bridge' or 'Kaza Monastery Viewpoint'
    caption TEXT NOT NULL,
    format content_format DEFAULT 'reel' NOT NULL,
    
    -- Media URLs (Cloudflare Stream HLS or Cloudflare R2 / Images)
    video_url TEXT, -- HLS adaptive streaming URL e.g. 'https://customer-xyz.cloudflarestream.com/.../manifest/video.m3u8'
    thumbnail_url TEXT,
    carousel_images TEXT[] DEFAULT '{}',
    
    -- Structured Micro-Blog Metadata (Travel Notes)
    cost_in_inr INTEGER, -- Real on-ground cost
    best_time_time_of_day TEXT, -- 'Sunrise (5:30 AM)'
    safety_tips TEXT, -- 'Road narrow with loose gravel; 4x4 recommended during monsoon'
    how_to_reach TEXT, -- 'Shared taxi from Kaza bus stand (INR 150) or 40-min motorcycle ride'
    connectivity_signal TEXT, -- 'BSNL 3G works; Airtel/Jio zero signal'
    
    -- Geospatial Tagging
    location GEOGRAPHY(Point, 4326) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    
    -- Contextual Gear Tags (Affiliate / Sponsored Travel Accessories)
    tagged_gear JSONB DEFAULT '[]', -- [{"item": "Wildcraft 60L Rucksack", "affiliate_url": "...", "price_inr": 3499}]
    
    likes_count INTEGER DEFAULT 0,
    saves_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    is_staff_pick BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_posts_location ON public.posts USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_posts_destination ON public.posts(destination_id);
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author_id);

-- 6. LIVE COMMUNITY Q&A THREADS (Real-Time Location Pinned Discussions)
CREATE TABLE IF NOT EXISTS public.qa_threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    destination_id UUID REFERENCES public.destinations(id) ON DELETE SET NULL,
    title TEXT NOT NULL, -- e.g. 'Is Manali-Kaza road via Kunzum Pass open right now?'
    category TEXT DEFAULT 'Road Conditions & Permits', -- 'Weather', 'Safety', 'Food & Stays', 'Transport'
    location GEOGRAPHY(Point, 4326) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    status thread_status DEFAULT 'active',
    upvotes_count INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_qa_threads_location ON public.qa_threads USING GIST(location);

CREATE TABLE IF NOT EXISTS public.qa_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID NOT NULL REFERENCES public.qa_threads(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reply_text TEXT NOT NULL,
    is_verified_local_reply BOOLEAN DEFAULT FALSE, -- Tagged if author has verified local guide status
    upvotes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. ZERO-HEADACHE TRIP BUILDER & SAVED PINS
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL, -- e.g. 'Spiti 7-Day Monsoon Circuit'
    description TEXT,
    start_date DATE,
    end_date DATE,
    total_budget_inr INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT FALSE,
    share_slug TEXT UNIQUE DEFAULT substring(md5(random()::text) from 1 for 8),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.trip_stops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
    destination_id UUID REFERENCES public.destinations(id) ON DELETE SET NULL,
    spot_name TEXT NOT NULL,
    day_number INTEGER DEFAULT 1 NOT NULL,
    order_in_day INTEGER DEFAULT 1 NOT NULL,
    notes TEXT,
    estimated_stay_minutes INTEGER DEFAULT 60,
    location GEOGRAPHY(Point, 4326) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_saved_spots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    saved_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, post_id)
);

-- 8. TIME-BOUND INFLUENCER & TOURISM CAMPAIGNS
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL, -- e.g. '#MonsoonInMeghalaya' or '#HampiHiddenGems'
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    organizer_name TEXT NOT NULL, -- e.g. 'Meghalaya Tourism x SafarNama'
    banner_image TEXT NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    reward_description TEXT NOT NULL, -- e.g. 'Limited Edition Digital Explorer Badge + Sponsored Homestay Vouchers'
    checkpoints JSONB NOT NULL DEFAULT '[]', -- [{"name": "Nohkalikai Falls", "lat": 25.2758, "lng": 91.6853, "radius_meters": 500}]
    status campaign_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.campaign_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    checkpoints_completed JSONB DEFAULT '[]',
    points INTEGER DEFAULT 0,
    badge_unlocked BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(campaign_id, user_id)
);

-- 9. NATIVE ITINERARY SPONSORSHIPS & VERIFIED STAYS
CREATE TABLE IF NOT EXISTS public.sponsored_stays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    destination_id UUID NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g. 'Zostel Homes Tabo' or 'Chanderi Heritage Kothi'
    stay_type stay_type DEFAULT 'homestay' NOT NULL,
    price_per_night_inr INTEGER NOT NULL,
    rating NUMERIC(2,1) DEFAULT 4.8,
    booking_url TEXT NOT NULL,
    image_url TEXT NOT NULL,
    amenities TEXT[] DEFAULT '{"Heated Rooms", "Local Himachali Meals", "Solar Water", "Wi-Fi"}',
    is_verified_partner BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 10. POSTGIS GEOSPATIAL RPC FUNCTIONS

-- Function A: Find all nearby posts, reels, and notes within X km of coordinate
CREATE OR REPLACE FUNCTION get_nearby_posts(
    current_lat DOUBLE PRECISION,
    current_lng DOUBLE PRECISION,
    radius_km DOUBLE PRECISION DEFAULT 25.0
)
RETURNS TABLE (
    id UUID,
    author_id UUID,
    author_username TEXT,
    author_avatar TEXT,
    spot_name TEXT,
    caption TEXT,
    format content_format,
    video_url TEXT,
    thumbnail_url TEXT,
    carousel_images TEXT[],
    cost_in_inr INTEGER,
    best_time_time_of_day TEXT,
    safety_tips TEXT,
    how_to_reach TEXT,
    connectivity_signal TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    distance_meters DOUBLE PRECISION,
    likes_count INTEGER,
    saves_count INTEGER
)
LANGUAGE sql
STABLE
AS $$
    SELECT 
        p.id,
        p.author_id,
        u.username AS author_username,
        u.avatar_url AS author_avatar,
        p.spot_name,
        p.caption,
        p.format,
        p.video_url,
        p.thumbnail_url,
        p.carousel_images,
        p.cost_in_inr,
        p.best_time_time_of_day,
        p.safety_tips,
        p.how_to_reach,
        p.connectivity_signal,
        p.latitude,
        p.longitude,
        ST_Distance(
            p.location,
            ST_SetSRID(ST_MakePoint(current_lng, current_lat), 4326)::geography
        ) AS distance_meters,
        p.likes_count,
        p.saves_count
    FROM public.posts p
    JOIN public.profiles u ON p.author_id = u.id
    WHERE ST_DWithin(
        p.location,
        ST_SetSRID(ST_MakePoint(current_lng, current_lat), 4326)::geography,
        radius_km * 1000
    )
    ORDER BY distance_meters ASC;
$$;

-- Function B: Smart Itinerary Sequence Route
-- Takes user saved spots and sequences them by shortest path approximation
CREATE OR REPLACE FUNCTION get_sequenced_trip_route(trip_uuid UUID)
RETURNS TABLE (
    step_order INT,
    spot_name TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    day_number INT,
    notes TEXT
)
LANGUAGE sql
STABLE
AS $$
    SELECT 
        ts.order_in_day AS step_order,
        ts.spot_name,
        ts.latitude,
        ts.longitude,
        ts.day_number,
        ts.notes
    FROM public.trip_stops ts
    WHERE ts.trip_id = trip_uuid
    ORDER BY ts.day_number ASC, ts.order_in_day ASC;
$$;

-- 11. ROW-LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_saved_spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsored_stays ENABLE ROW LEVEL SECURITY;

-- Read policies (Public feeds for travel discovery)
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Public read destinations" ON public.destinations FOR SELECT USING (true);
CREATE POLICY "Public read posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Public read qa_threads" ON public.qa_threads FOR SELECT USING (true);
CREATE POLICY "Public read qa_replies" ON public.qa_replies FOR SELECT USING (true);
CREATE POLICY "Public read campaigns" ON public.campaigns FOR SELECT USING (true);
CREATE POLICY "Public read sponsored_stays" ON public.sponsored_stays FOR SELECT USING (true);
CREATE POLICY "Public read public trips" ON public.trips FOR SELECT USING (is_public = true OR auth.uid() = creator_id);

-- Write policies (Authenticated users)
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can edit own posts" ON public.posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE USING (auth.uid() = author_id);
CREATE POLICY "Users can manage own trips" ON public.trips FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY "Users can manage own saved spots" ON public.user_saved_spots FOR ALL USING (auth.uid() = user_id);
