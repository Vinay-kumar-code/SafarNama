package com.safarnama.travel.data

import com.safarnama.travel.api.R2MediaResolver

object SeedData {

    // Current User Profile (Aarav Sharma - Traveler & Certified Explorer)
    val CURRENT_USER = Profile(
        id = "user-aarav-001",
        username = "aarav_journeys",
        fullName = "Aarav Sharma",
        avatarUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
        bio = "Chasing Himalayan sunsets & South Indian filter coffee ☕ | 18 Indian States explored | Next: Ziro Music Fest 🏕️",
        activeRole = "traveler",
        homeCity = "Bengaluru, Karnataka",
        isVerifiedGuide = false,
        guideCircuits = emptyList(),
        credibilityScore = 340,
        passportStampsCount = 18,
        languagesSpoken = listOf("Hindi", "English", "Kannada"),
        stats = ProfileStats(
            tripsCompleted = 14,
            spotsSaved = 42,
            contributions = 28,
            guideToursLed = 0
        )
    )

    // Guide Profiles
    val GUIDE_TENZIN = Profile(
        id = "guide-spiti-01",
        username = "tenzin_spitilocal",
        fullName = "Tenzin Norbu",
        avatarUrl = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
        bio = "Born & raised in Kibber (4,270m) 🏔️ | Certified High-Altitude Guide & Snow Leopard Tracker | Spiti & Kinnaur Circuit Expert",
        activeRole = "local_guide",
        homeCity = "Kaza, Himachal Pradesh",
        isVerifiedGuide = true,
        guideCircuits = listOf("Spiti Valley High Passes", "Pin Valley National Park", "Kinnaur Apple Trails"),
        credibilityScore = 980,
        passportStampsCount = 34,
        languagesSpoken = listOf("Bhotia", "Hindi", "English"),
        stats = ProfileStats(
            tripsCompleted = 48,
            spotsSaved = 64,
            contributions = 120,
            guideToursLed = 42
        )
    )

    val GUIDE_KARAN = Profile(
        id = "guide-varanasi-02",
        username = "karan_banaras",
        fullName = "Karan Kashyap",
        avatarUrl = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
        bio = "8th generation Banarasi boatman & cultural storyteller. Walking through 84 Ganga Ghats since childhood 🪔",
        activeRole = "local_guide",
        homeCity = "Varanasi, Uttar Pradesh",
        isVerifiedGuide = true,
        guideCircuits = listOf("Subah-e-Banaras Ghats Walk", "Ancient Silk Weavers Alley", "Old Kashi Street Gastronomy"),
        credibilityScore = 890,
        passportStampsCount = 28,
        languagesSpoken = listOf("Hindi", "Bhojpuri", "English"),
        stats = ProfileStats(
            tripsCompleted = 62,
            spotsSaved = 51,
            contributions = 95,
            guideToursLed = 58
        )
    )

    val GUIDE_WANDAPLIN = Profile(
        id = "guide-meghalaya-03",
        username = "meghalaya_rootstracker",
        fullName = "Wandaplin Syiem",
        avatarUrl = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
        bio = "Khasi rainforest trail guardian 🌿 Living Root Bridges naturalist & caving guide in Sohra & Mawlynnong",
        activeRole = "local_guide",
        homeCity = "Cherrapunji (Sohra), Meghalaya",
        isVerifiedGuide = true,
        guideCircuits = listOf("Nongriat Double Decker Roots", "Mawsmai & Arwah Caves", "Krang Shuri Cascades"),
        credibilityScore = 915,
        passportStampsCount = 26,
        languagesSpoken = listOf("Khasi", "English", "Hindi"),
        stats = ProfileStats(
            tripsCompleted = 39,
            spotsSaved = 44,
            contributions = 78,
            guideToursLed = 35
        )
    )

    // Stories / Highlights Row
    val STORY_HIGHLIGHTS = listOf(
        StoryHighlight("story-1", "Spiti Passes", "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=300&auto=format&fit=crop&q=80", true),
        StoryHighlight("story-2", "Kashi Ghats", "https://images.unsplash.com/photo-1561359313-0639aad49ca6?w=300&auto=format&fit=crop&q=80", true),
        StoryHighlight("story-3", "Living Roots", "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80", true),
        StoryHighlight("story-4", "Hampi Ruins", "https://images.unsplash.com/photo-1600100397608-f010e421c4b1?w=300&auto=format&fit=crop&q=80", false),
        StoryHighlight("story-5", "Ziro Valley", "https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?w=300&auto=format&fit=crop&q=80", false),
        StoryHighlight("story-6", "Munnar Mist", "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=300&auto=format&fit=crop&q=80", true),
        StoryHighlight("story-7", "Thar Dunes", "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=300&auto=format&fit=crop&q=80", false)
    )

    // Feed Posts with Photo Carousels & Micro-Blogs
    val FEED_POSTS = listOf(
        Post(
            id = "post-001",
            author = GUIDE_TENZIN,
            spotName = "Key Gompa & Kibber Sanctuary",
            state = "Himachal Pradesh",
            region = "Spiti Valley",
            caption = "tenzin_spitilocal Early morning light bathing Key Monastery (4,166m). The winter frost is just melting off the prayer flags. If you are riding from Kaza, take the high road via Kibber for panoramic valley vistas. Remember to drink butter tea at the monastery kitchen before hiking up to the meditation caves! 🏔️☕",
            format = PostFormat.CAROUSEL_NOTE,
            carouselImages = listOf(
                "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=900&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=900&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=900&auto=format&fit=crop&q=80"
            ),
            costInInr = 1800,
            bestTimeToVisit = "Jun - Oct",
            safetyTips = "Acclimatize for 24h at Kaza before ascending past 4,000m. Keep Diamox handy.",
            howToReach = "HRTC bus from Shimla via Reckong Peo, or 4x4 tempo from Manali through Atal Tunnel.",
            connectivitySignal = "BSNL 4G Only",
            latitude = 32.2974,
            longitude = 78.0125,
            likesCount = 1420,
            savesCount = 385,
            commentsCount = 64,
            isLiked = false,
            isSaved = true,
            createdAt = "2 HOURS AGO"
        ),
        Post(
            id = "post-002",
            author = GUIDE_KARAN,
            spotName = "Dashashwamedh & Manikarnika Ghats",
            state = "Uttar Pradesh",
            region = "Varanasi Heritage",
            caption = "karan_banaras As dusk settles over the Ganges, seven priests begin the Maha Aarti with multi-tiered brass lamps. The sound of conch shells vibrating across the water is an ancient resonance that hasn't changed for centuries. Best witnessed from a traditional wooden bajra boat anchored 30 meters off the ghat steps.",
            format = PostFormat.CAROUSEL_NOTE,
            carouselImages = listOf(
                "https://images.unsplash.com/photo-1561359313-0639aad49ca6?w=900&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1571536802807-30451e3955d8?w=900&auto=format&fit=crop&q=80"
            ),
            costInInr = 1200,
            bestTimeToVisit = "Oct - Mar",
            safetyTips = "Beware of unauthorized middlemen charging inflated boat rates. Verified guide rate is ₹400-₹600.",
            howToReach = "15 mins auto from Varanasi Cantt Railway Station to Godowlia Chowk, then walk 5 mins down to the river.",
            connectivitySignal = "Jio / Airtel 5G",
            latitude = 25.3076,
            longitude = 83.0107,
            likesCount = 2890,
            savesCount = 740,
            commentsCount = 112,
            isLiked = true,
            isSaved = false,
            createdAt = "5 HOURS AGO"
        ),
        Post(
            id = "post-003",
            author = GUIDE_WANDAPLIN,
            spotName = "Nongriat Double Decker Root Bridge",
            state = "Meghalaya",
            region = "East Khasi Hills",
            caption = "meghalaya_rootstracker Descended the 3,500 stone stairs into the rainforest heart. These living bridges are trained by Khasi elders across generations using Ficus elastica aerial roots. The natural pool below is crystal turquoise. Please pack out every single scrap of plastic!",
            format = PostFormat.CAROUSEL_NOTE,
            carouselImages = listOf(
                "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=900&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=900&auto=format&fit=crop&q=80"
            ),
            costInInr = 2400,
            bestTimeToVisit = "Sep - Apr",
            safetyTips = "Extremely steep stairway. Wear non-slip trek footwear; bamboo walking sticks available at Tyrna village.",
            howToReach = "Drive from Shillong to Tyrna village (2.5 hrs), then 2-hour guided trek down to Nongriat.",
            connectivitySignal = "Airtel 4G (Intermittent)",
            latitude = 25.2500,
            longitude = 91.6833,
            likesCount = 3120,
            savesCount = 910,
            commentsCount = 98,
            isLiked = false,
            isSaved = true,
            createdAt = "YESTERDAY"
        ),
        Post(
            id = "post-004",
            author = CURRENT_USER,
            spotName = "Matanga Hill & Virupaksha Temple",
            state = "Karnataka",
            region = "Hampi Deccan",
            caption = "aarav_journeys Watching the golden sunrise illuminate the Vijayanagara boulder empire from the summit of Matanga Hill. The Tungabhadra river snakes through banana plantations below. Hampi is pure magic on two wheels—rented a moped for ₹350/day and hopped across heritage ruins all afternoon.",
            format = PostFormat.CAROUSEL_NOTE,
            carouselImages = listOf(
                "https://images.unsplash.com/photo-1600100397608-f010e421c4b1?w=900&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1590766940554-634a7ed41450?w=900&auto=format&fit=crop&q=80"
            ),
            costInInr = 1500,
            bestTimeToVisit = "Nov - Feb",
            safetyTips = "Hydrate constantly; midday heat is intense even in winter.",
            howToReach = "Overnight Hampi Express train from Bengaluru to Hosapete, then 20 mins auto to Hampi bazaar.",
            connectivitySignal = "Jio / Airtel 4G",
            latitude = 15.3350,
            longitude = 76.4600,
            likesCount = 1890,
            savesCount = 420,
            commentsCount = 45,
            isLiked = true,
            isSaved = true,
            createdAt = "2 DAYS AGO"
        )
    )

    // Vertical Video Reels
    val REELS_FEED = listOf(
        Post(
            id = "reel-001",
            author = GUIDE_TENZIN,
            spotName = "Kunzum Pass (4,551 m)",
            state = "Himachal Pradesh",
            region = "Spiti High Passes",
            caption = "Crossing Kunzum Pass at dawn. Fresh powder snow on the Buddhist shrine. Local tradition requires completing a clock-wise kora around the stupa before proceeding to Spiti! 🏔️✨",
            format = PostFormat.REEL,
            videoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            thumbnailUrl = "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&auto=format&fit=crop&q=80",
            likesCount = 4280,
            savesCount = 1240,
            commentsCount = 184,
            isLiked = false,
            isSaved = true
        ),
        Post(
            id = "reel-002",
            author = GUIDE_KARAN,
            spotName = "Subah-e-Banaras Morning Boat",
            state = "Uttar Pradesh",
            region = "Varanasi Ghats",
            caption = "Mist rising over the sacred Ganga as migratory Siberian gulls greet early morning rowers. Nothing heals the mind like the rhythm of Banaras oars 🪔🕊️",
            format = PostFormat.REEL,
            videoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
            thumbnailUrl = "https://images.unsplash.com/photo-1561359313-0639aad49ca6?w=800&auto=format&fit=crop&q=80",
            likesCount = 7890,
            savesCount = 2310,
            commentsCount = 312,
            isLiked = true,
            isSaved = false
        ),
        Post(
            id = "reel-003",
            author = GUIDE_WANDAPLIN,
            spotName = "Rainbow Falls Cascades",
            state = "Meghalaya",
            region = "East Khasi Rainforest",
            caption = "Hidden deep past Nongriat village, the Rainbow Falls crashes into a natural turquoise swimming basin. Pure unadulterated nature in the wettest place on earth! 🌈💦",
            format = PostFormat.REEL,
            videoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
            thumbnailUrl = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80",
            likesCount = 3450,
            savesCount = 980,
            commentsCount = 145,
            isLiked = false,
            isSaved = true
        )
    )

    // Destination Hubs (Interactive Map & Search Explore Grid)
    val DESTINATION_HUBS = listOf(
        DestinationHub(
            id = "dest-spiti",
            slug = "spiti-valley",
            name = "Spiti Valley",
            state = "Himachal Pradesh",
            region = "Trans-Himalayan Cold Desert",
            tagline = "The Middle Land: Ancient Monasteries & Stargazing High Passes",
            coverImage = "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&auto=format&fit=crop&q=80",
            latitude = 32.2464,
            longitude = 78.0349,
            overview = "High altitude cold desert mountain valley located in Himachal Pradesh. Home to centuries-old Tibetan Buddhist monasteries like Key, Tabo, and Dhankar.",
            bestTimeToVisit = "Jun to Oct for roads; Jan to Mar for Snow Leopard tracking",
            dailyBudgetInr = 2200,
            topSpotsCount = 16,
            guideCount = 14,
            averageRating = 4.9
        ),
        DestinationHub(
            id = "dest-varanasi",
            slug = "varanasi",
            name = "Varanasi (Kashi)",
            state = "Uttar Pradesh",
            region = "Holy Ganges Plains",
            tagline = "City of Light: 84 Sacred Ghats & Eternal Silk Weavers",
            coverImage = "https://images.unsplash.com/photo-1561359313-0639aad49ca6?w=800&auto=format&fit=crop&q=80",
            latitude = 25.3176,
            longitude = 82.9739,
            overview = "One of the oldest continuously inhabited cities in the world. Revered as the spiritual capital of India, with ancient morning aartis, ghats, and labyrinthine alleys.",
            bestTimeToVisit = "Oct to Mar for crisp temple mornings",
            dailyBudgetInr = 1500,
            topSpotsCount = 22,
            guideCount = 28,
            averageRating = 4.8
        ),
        DestinationHub(
            id = "dest-meghalaya",
            slug = "meghalaya",
            name = "Cherrapunji & Mawlynnong",
            state = "Meghalaya",
            region = "Abode of Clouds",
            tagline = "Bio-Engineered Living Root Bridges & Cloud Cascades",
            coverImage = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80",
            latitude = 25.2702,
            longitude = 91.7323,
            overview = "Lush plateau dissected by deep ravines, perennial waterfalls, living root architectural wonders, and Asia's cleanest village.",
            bestTimeToVisit = "Sep to May for trekking; Jul to Aug for roaring monsoons",
            dailyBudgetInr = 2600,
            topSpotsCount = 18,
            guideCount = 12,
            averageRating = 4.9
        ),
        DestinationHub(
            id = "dest-hampi",
            slug = "hampi",
            name = "Hampi",
            state = "Karnataka",
            region = "Deccan Boulder Valley",
            tagline = "Granite Empire of Vijayanagara Kings on the Tungabhadra",
            coverImage = "https://images.unsplash.com/photo-1600100397608-f010e421c4b1?w=800&auto=format&fit=crop&q=80",
            latitude = 15.3350,
            longitude = 76.4600,
            overview = "UNESCO World Heritage site dotted with 1,600 surviving monuments of Vijayanagara, giant monolithic bull statues, and boulder-strewn hills.",
            bestTimeToVisit = "Nov to Feb",
            dailyBudgetInr = 1600,
            topSpotsCount = 24,
            guideCount = 19,
            averageRating = 4.7
        ),
        DestinationHub(
            id = "dest-ziro",
            slug = "ziro-valley",
            name = "Ziro Valley",
            state = "Arunachal Pradesh",
            region = "Eastern Himalayas",
            tagline = "Apatani Pine Groves & Eco-Conscious Outdoor Music Trails",
            coverImage = "https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?w=800&auto=format&fit=crop&q=80",
            latitude = 27.5350,
            longitude = 93.8300,
            overview = "Enchanting plateau famous for indigenous Apatani wet-rice cultivation, fish farming, traditional pine homestays, and September music fest.",
            bestTimeToVisit = "Mar to Oct",
            dailyBudgetInr = 2400,
            topSpotsCount = 12,
            guideCount = 8,
            averageRating = 4.8
        ),
        DestinationHub(
            id = "dest-munnar",
            slug = "munnar",
            name = "Munnar & Anamudi",
            state = "Kerala",
            region = "Western Ghats Tea Country",
            tagline = "Rolling Emerald Tea Estates & Nilgiri Tahr Sanctuaries",
            coverImage = "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=800&auto=format&fit=crop&q=80",
            latitude = 10.0889,
            longitude = 77.0595,
            overview = "Idyllic hill station nestled at the confluence of three mountain streams, featuring sprawling tea plantations and South India's highest peak.",
            bestTimeToVisit = "Sep to Apr",
            dailyBudgetInr = 2100,
            topSpotsCount = 15,
            guideCount = 11,
            averageRating = 4.7
        ),
        DestinationHub(
            id = "dest-jaisalmer",
            slug = "jaisalmer",
            name = "Jaisalmer & Sam Dunes",
            state = "Rajasthan",
            region = "Thar Desert",
            tagline = "The Golden Fort & Starlit Sand Caravans",
            coverImage = "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&auto=format&fit=crop&q=80",
            latitude = 26.9157,
            longitude = 70.9083,
            overview = "Golden sandstone city rising like a mirage from the Thar desert. Live inside the world's only inhabited living fort.",
            bestTimeToVisit = "Oct to Mar",
            dailyBudgetInr = 2000,
            topSpotsCount = 14,
            guideCount = 16,
            averageRating = 4.8
        ),
        DestinationHub(
            id = "dest-ladakh",
            slug = "ladakh",
            name = "Leh & Pangong Tso",
            state = "Ladakh",
            region = "Land of High Passes",
            tagline = "Cobalt Blue Salt Lakes & Khardung La 18,380ft",
            coverImage = "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=800&auto=format&fit=crop&q=80",
            latitude = 34.1526,
            longitude = 77.5771,
            overview = "Majestic trans-Himalayan kingdom of Tibetan-Buddhist culture, dramatic mountain passes, and shimmering border lakes.",
            bestTimeToVisit = "May to Sep",
            dailyBudgetInr = 3000,
            topSpotsCount = 20,
            guideCount = 22,
            averageRating = 4.9
        )
    )

    // Digital Passport Stamps for Indian States
    val PASSPORT_STAMPS = listOf(
        PassportStamp("stamp-hp", "HIMACHAL", "Spiti High Passes & Key Gompa", "OCT 2026", true, "🏔️"),
        PassportStamp("stamp-up", "UTTAR PRADESH", "Varanasi Ganga Ghats Circuit", "AUG 2026", true, "🪔"),
        PassportStamp("stamp-ml", "MEGHALAYA", "Sohra Living Root Bridges", "JUN 2026", true, "🌿"),
        PassportStamp("stamp-ka", "KARNATAKA", "Hampi Vijayanagara Empire", "APR 2026", true, "🏛️"),
        PassportStamp("stamp-ar", "ARUNACHAL", "Ziro Valley Pine Trails", "JAN 2026", true, "🌲"),
        PassportStamp("stamp-kl", "KERALA", "Munnar Misty Tea Highlands", "NOV 2025", true, "🍃"),
        PassportStamp("stamp-rj", "RAJASTHAN", "Jaisalmer Thar Sand Dunes", "SEP 2025", true, "🐪"),
        PassportStamp("stamp-ld", "LADAKH", "Khardung La & Pangong Lake", "JUL 2025", true, "🚩")
    )
}
