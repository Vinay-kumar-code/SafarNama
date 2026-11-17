package com.safarnama.travel.data

import com.safarnama.travel.api.R2MediaResolver

object SeedData {

    // Current User Profile (Aarav Sharma - Traveler)
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
        ),
        isFollowing = true
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
        ),
        isFollowing = true
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
        ),
        isFollowing = true
    )

    // Initial Followed Accounts for Aarav Sharma
    val INITIAL_FOLLOWED_ACCOUNTS = listOf(
        FollowedAccountSetting(GUIDE_TENZIN, notificationsEnabled = true),
        FollowedAccountSetting(GUIDE_KARAN, notificationsEnabled = true),
        FollowedAccountSetting(GUIDE_WANDAPLIN, notificationsEnabled = false)
    )

    // Feed Posts with Photo Carousels, Micro-Blogs, and Tweets
    val FEED_POSTS = listOf(
        // Tweet 1 by Tenzin (mentioning Aarav & Karan)
        Post(
            id = "tweet-001",
            author = GUIDE_TENZIN,
            spotName = "Kunzum Pass Checkpoint",
            state = "Himachal Pradesh",
            region = "Spiti Valley",
            caption = "Kunzum Pass (4,551m) just received 4 inches of fresh snowfall. If you are riding through Kaza today with @aarav_journeys and @karan_banaras, make sure tire chains are prepped and check in at our Losar base camp. Butter tea is boiling hot at the mountain outpost! 🏔️☕❄️",
            format = PostFormat.TWEET,
            destinationId = "dest-spiti",
            destinationName = "Spiti Valley",
            mentionedUsernames = listOf("aarav_journeys", "karan_banaras"),
            costInInr = 0,
            bestTimeToVisit = "Jun - Oct",
            safetyTips = "Roads can be icy before 10 AM. Travel in a convoy.",
            connectivitySignal = "Satellite SOS Only",
            latitude = 32.4000,
            longitude = 77.6333,
            likesCount = 892,
            savesCount = 143,
            commentsCount = 24,
            threadRepliesCount = 8,
            isLiked = false,
            isSaved = false,
            createdAt = "15m ago"
        ),
        // Photo Post 1
        Post(
            id = "post-001",
            author = GUIDE_TENZIN,
            spotName = "Key Gompa & Kibber Sanctuary",
            state = "Himachal Pradesh",
            region = "Spiti Valley",
            caption = "Early morning light bathing Key Monastery (4,166m). The winter frost is just melting off the prayer flags. If you are riding from Kaza, take the high road via Kibber for panoramic valley vistas. Remember to drink butter tea at the monastery kitchen before hiking up to the meditation caves! 🏔️☕",
            format = PostFormat.PHOTO_POST,
            destinationId = "dest-spiti",
            destinationName = "Spiti Valley",
            mentionedUsernames = listOf("aarav_journeys"),
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
        // Tweet 2 by Aarav (Group travel mention)
        Post(
            id = "tweet-002",
            author = CURRENT_USER,
            spotName = "Dashashwamedh Ghat",
            state = "Uttar Pradesh",
            region = "Varanasi",
            caption = "Morning Ganga boat ride with @karan_banaras. The bells across 84 ghats echoing over the river mist as the sun peeks through the winter haze is surreal. Experiencing this city with a local storyteller changes everything you see. 🪔🚣",
            format = PostFormat.TWEET,
            destinationId = "dest-varanasi",
            destinationName = "Varanasi Ghats",
            mentionedUsernames = listOf("karan_banaras"),
            costInInr = 400,
            bestTimeToVisit = "Oct - Mar",
            safetyTips = "Early sunrise boats start by 5:30 AM from Assi Ghat.",
            connectivitySignal = "Jio / Airtel 5G",
            latitude = 25.3076,
            longitude = 83.0107,
            likesCount = 634,
            savesCount = 92,
            commentsCount = 18,
            threadRepliesCount = 5,
            isLiked = true,
            isSaved = false,
            createdAt = "3 HOURS AGO"
        ),
        // Photo Post 2
        Post(
            id = "post-002",
            author = GUIDE_KARAN,
            spotName = "Dashashwamedh & Manikarnika Ghats",
            state = "Uttar Pradesh",
            region = "Varanasi Heritage",
            caption = "As dusk settles over the Ganges, seven priests begin the Maha Aarti with multi-tiered brass lamps. The sound of conch shells vibrating across the water is an ancient resonance that hasn't changed for centuries. Best witnessed from a traditional wooden bajra boat anchored 30 meters off the ghat steps.",
            format = PostFormat.PHOTO_POST,
            destinationId = "dest-varanasi",
            destinationName = "Varanasi Ghats",
            mentionedUsernames = listOf("aarav_journeys"),
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
        // Tweet 3 by Wandaplin (Rainforest update)
        Post(
            id = "tweet-003",
            author = GUIDE_WANDAPLIN,
            spotName = "Rainbow Falls Trailhead",
            state = "Meghalaya",
            region = "East Khasi Hills",
            caption = "Quick update for backpackers heading to Nongriat this weekend: Rainbow Falls trail is open! Trekked it with @aarav_journeys today. Please hire registered local village guides from Tyrna and remember zero plastic bottles allowed in the root bridge valley. 🌿💧",
            format = PostFormat.TWEET,
            destinationId = "dest-meghalaya",
            destinationName = "Meghalaya Roots",
            mentionedUsernames = listOf("aarav_journeys"),
            costInInr = 500,
            bestTimeToVisit = "Sep - Apr",
            safetyTips = "Carry bamboo trek poles for the 3,500 stairs.",
            connectivitySignal = "Airtel 4G",
            latitude = 25.2500,
            longitude = 91.6833,
            likesCount = 478,
            savesCount = 180,
            commentsCount = 14,
            threadRepliesCount = 4,
            isLiked = false,
            isSaved = true,
            createdAt = "8 HOURS AGO"
        ),
        // Photo Post 3
        Post(
            id = "post-003",
            author = GUIDE_WANDAPLIN,
            spotName = "Nongriat Double Decker Root Bridge",
            state = "Meghalaya",
            region = "East Khasi Hills",
            caption = "Descended the 3,500 stone stairs into the rainforest heart. These living bridges are trained by Khasi elders across generations using Ficus elastica aerial roots. The natural pool below is crystal turquoise. Please pack out every single scrap of plastic!",
            format = PostFormat.PHOTO_POST,
            destinationId = "dest-meghalaya",
            destinationName = "Meghalaya Roots",
            mentionedUsernames = emptyList(),
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
        // Photo Post 4
        Post(
            id = "post-004",
            author = CURRENT_USER,
            spotName = "Matanga Hill & Virupaksha Temple",
            state = "Karnataka",
            region = "Hampi Deccan",
            caption = "Watching the golden sunrise illuminate the Vijayanagara boulder empire from the summit of Matanga Hill. The Tungabhadra river snakes through banana plantations below. Hampi is pure magic on two wheels—rented a moped for ₹350/day and hopped across heritage ruins all afternoon.",
            format = PostFormat.PHOTO_POST,
            destinationId = "dest-hampi",
            destinationName = "Hampi Deccan",
            mentionedUsernames = emptyList(),
            carouselImages = listOf(
                "https://images.unsplash.com/photo-1600100397608-f010e421c4b1?w=900&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1590766940554-634a7ed41450?w=900&auto=format&fit=crop&q=80"
            ),
            costInInr = 1500,
            bestTimeToVisit = "Nov - Feb",
            safetyTips = "Hydrate constantly; midday heat is intense even in winter.",
            howToReach = "Overnight Hampi Express train from Bengaluru to Hosapete, then 20 mins auto to Hampi bazaar.",
            connectivitySignal = "All 5G Networks",
            latitude = 15.3350,
            longitude = 76.4600,
            likesCount = 1840,
            savesCount = 520,
            commentsCount = 47,
            isLiked = true,
            isSaved = true,
            createdAt = "2 DAYS AGO"
        )
    )

    // Reels Feed with Native Video Assets from Cloudflare R2
    val REELS_FEED = listOf(
        Post(
            id = "reel-001",
            author = GUIDE_TENZIN,
            spotName = "Kunzum Pass High Altitude Ridge (4,551m)",
            state = "Himachal Pradesh",
            region = "Spiti Valley",
            caption = "Crossing Kunzum La with the prayer flags snapping in 50 km/h wind. The boundary between Kullu and Spiti Valley. Look at that trans-Himalayan desert! 🏔️🚩 #SpitiValley #KunzumPass #TransHimalayas",
            format = PostFormat.REEL,
            videoUrl = R2MediaResolver.resolveVideoUrl("videos/spiti_kunzum.mp4", "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"),
            thumbnailUrl = "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&auto=format&fit=crop&q=80",
            destinationId = "dest-spiti",
            destinationName = "Spiti Valley",
            mentionedUsernames = listOf("aarav_journeys"),
            likesCount = 4820,
            savesCount = 1120,
            commentsCount = 184,
            isLiked = false,
            isSaved = true,
            createdAt = "3 HOURS AGO"
        ),
        Post(
            id = "reel-002",
            author = GUIDE_KARAN,
            spotName = "Subah-e-Banaras Morning Boating",
            state = "Uttar Pradesh",
            region = "Varanasi",
            caption = "Assi Ghat to Chet Singh Fort at 6:00 AM. Migratory Siberian gulls swirling over the holy river. 🕊️🪔 #Varanasi #GangesMorning #BanarasDiaries",
            format = PostFormat.REEL,
            videoUrl = R2MediaResolver.resolveVideoUrl("videos/varanasi_aarti.mp4", "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"),
            thumbnailUrl = "https://images.unsplash.com/photo-1561359313-0639aad49ca6?w=800&auto=format&fit=crop&q=80",
            destinationId = "dest-varanasi",
            destinationName = "Varanasi Ghats",
            mentionedUsernames = emptyList(),
            likesCount = 8920,
            savesCount = 2430,
            commentsCount = 340,
            isLiked = true,
            isSaved = false,
            createdAt = "6 HOURS AGO"
        ),
        Post(
            id = "reel-003",
            author = GUIDE_WANDAPLIN,
            spotName = "Rainbow Falls Turquoise Plunge Pool",
            state = "Meghalaya",
            region = "East Khasi Hills",
            caption = "Hidden deep past Nongriat village. When the midday sun strikes the spray, a circular rainbow forms over the pool. Nature's wonder! 🌿🌈 #Meghalaya #RainbowFalls #LivingRootBridge",
            format = PostFormat.REEL,
            videoUrl = R2MediaResolver.resolveVideoUrl("videos/meghalaya_roots.mp4", "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4"),
            thumbnailUrl = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80",
            destinationId = "dest-meghalaya",
            destinationName = "Meghalaya Roots",
            mentionedUsernames = listOf("aarav_journeys"),
            likesCount = 6140,
            savesCount = 1890,
            commentsCount = 215,
            isLiked = false,
            isSaved = true,
            createdAt = "YESTERDAY"
        )
    )

    // Initial Comments and Thread Replies
    val INITIAL_COMMENTS = mapOf(
        "tweet-001" to listOf(
            Comment("c-101", "tweet-001", CURRENT_USER, "Thanks Tenzin bhai! We are stopping by the monastery first for tea and then meeting you at Losar.", "10m ago"),
            Comment("c-102", "tweet-001", GUIDE_KARAN, "Safe travels @aarav_journeys! Spiti snow is magical. Looking forward to your photos.", "8m ago", parentCommentId = "c-101"),
            Comment("c-103", "tweet-001", GUIDE_WANDAPLIN, "The pass looks breathtaking! Keep warm guys 🏔️", "5m ago")
        ),
        "post-001" to listOf(
            Comment("c-201", "post-001", CURRENT_USER, "Key Gompa kitchen butter tea was unforgettable. Highly recommend early morning arrival!", "1h ago"),
            Comment("c-202", "post-001", GUIDE_KARAN, "Magnificent photography Tenzin! Those light angles are sublime.", "45m ago")
        ),
        "reel-001" to listOf(
            Comment("c-301", "reel-001", CURRENT_USER, "The sound of those prayer flags in the wind gives goosebumps every single time!", "2h ago"),
            Comment("c-302", "reel-001", GUIDE_KARAN, "Pure trans-Himalayan magic! 🚩", "1h ago")
        )
    )

    // Initial 1-on-1 Direct Messages
    val INITIAL_DIRECT_MESSAGES = mapOf(
        "guide-spiti-01" to listOf(
            DirectMessage("m-1", "guide-spiti-01", "user-aarav-001", "Julley Aarav! Are you reaching Kaza by Thursday afternoon?", "10:30 AM", false),
            DirectMessage("m-2", "user-aarav-001", "guide-spiti-01", "Julley Tenzin! Yes, taking the morning HRTC bus from Reckong Peo.", "10:32 AM", true),
            DirectMessage("m-3", "guide-spiti-01", "user-aarav-001", "Perfect. I have arranged homestay in Kibber. See you at the bus stop!", "10:35 AM", false)
        ),
        "guide-varanasi-02" to listOf(
            DirectMessage("m-4", "guide-varanasi-02", "user-aarav-001", "Namaste Aarav! Morning Aarti boat is booked for tomorrow 5:30 AM.", "Yesterday", false),
            DirectMessage("m-5", "user-aarav-001", "guide-varanasi-02", "Namaste Karan ji! Wonderful, meeting you directly at Assi Ghat stairs.", "Yesterday", true)
        ),
        "guide-meghalaya-03" to listOf(
            DirectMessage("m-6", "guide-meghalaya-03", "user-aarav-001", "Khublei Aarav! Don't forget non-slip shoes for the Nongriat descent.", "2 days ago", false),
            DirectMessage("m-7", "user-aarav-001", "guide-meghalaya-03", "Khublei Wandaplin! Got my trek boots ready. Can't wait!", "2 days ago", true)
        )
    )

    // 8 Major Indian Destination Hubs
    val DESTINATION_HUBS = listOf(
        DestinationHub(
            id = "dest-spiti",
            slug = "spiti",
            name = "Spiti Valley & Pin",
            state = "Himachal Pradesh",
            region = "Trans-Himalayas",
            tagline = "The Middle Land: 1,000-Year Monasteries & High Passes",
            coverImage = "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&auto=format&fit=crop&q=80",
            galleryImages = listOf(
                "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800",
                "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800"
            ),
            latitude = 32.2461,
            longitude = 78.0349,
            overview = "High altitude cold mountain desert along the Spiti river, renowned for Tibetan Buddhist sanctuaries, fossil villages, and stark geological beauty.",
            bestTimeToVisit = "Jun to Oct",
            dailyBudgetInr = 2200,
            topSpotsCount = 12,
            guideCount = 8,
            averageRating = 4.9
        ),
        DestinationHub(
            id = "dest-varanasi",
            slug = "varanasi",
            name = "Varanasi Ganga Ghats",
            state = "Uttar Pradesh",
            region = "Northern Plains",
            tagline = "Eternal City of Lights, 84 Ghats & Subah-e-Banaras",
            coverImage = "https://images.unsplash.com/photo-1561359313-0639aad49ca6?w=800&auto=format&fit=crop&q=80",
            galleryImages = listOf(
                "https://images.unsplash.com/photo-1561359313-0639aad49ca6?w=800",
                "https://images.unsplash.com/photo-1571536802807-30451e3955d8?w=800"
            ),
            latitude = 25.3176,
            longitude = 82.9739,
            overview = "One of the world's oldest living cities, spiritual epicenter of India with sacred riverfront steps, dawn rowing, and dusk Ganga Aarti rituals.",
            bestTimeToVisit = "Oct to Mar",
            dailyBudgetInr = 1500,
            topSpotsCount = 18,
            guideCount = 14,
            averageRating = 4.8
        ),
        DestinationHub(
            id = "dest-meghalaya",
            slug = "meghalaya",
            name = "Cherrapunji & Nongriat",
            state = "Meghalaya",
            region = "Northeast Rainforests",
            tagline = "Living Root Bridges, Cloud Forests & Deep Limestone Caves",
            coverImage = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80",
            galleryImages = listOf(
                "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800",
                "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800"
            ),
            latitude = 25.2986,
            longitude = 91.5822,
            overview = "Abode of the clouds with the wettest rainforests on Earth, botanical architecture shaped over centuries by indigenous Khasi villagers.",
            bestTimeToVisit = "Sep to Apr",
            dailyBudgetInr = 2500,
            topSpotsCount = 14,
            guideCount = 9,
            averageRating = 4.9
        ),
        DestinationHub(
            id = "dest-hampi",
            slug = "hampi",
            name = "Hampi Deccan Ruins",
            state = "Karnataka",
            region = "Deccan Plateau",
            tagline = "UNESCO Vijayanagara Boulder Capital & Tungabhadra Coracles",
            coverImage = "https://images.unsplash.com/photo-1600100397608-f010e421c4b1?w=800&auto=format&fit=crop&q=80",
            galleryImages = listOf(
                "https://images.unsplash.com/photo-1600100397608-f010e421c4b1?w=800"
            ),
            latitude = 15.3350,
            longitude = 76.4600,
            overview = "Monumental 14th-century capital of the Vijayanagara Empire strewn across dramatic granite boulder landscapes and riverside stone pavilions.",
            bestTimeToVisit = "Nov to Feb",
            dailyBudgetInr = 1800,
            topSpotsCount = 16,
            guideCount = 12,
            averageRating = 4.8
        ),
        DestinationHub(
            id = "dest-ziro",
            slug = "ziro",
            name = "Ziro Valley Pine Trails",
            state = "Arunachal Pradesh",
            region = "Eastern Himalayas",
            tagline = "Apatani Rice-Fish Landscapes & Sub-Tropical Mountain Sanctuaries",
            coverImage = "https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?w=800&auto=format&fit=crop&q=80",
            latitude = 27.5947,
            longitude = 93.8385,
            overview = "Cradle of the indigenous Apatani tribe known for sustainable agriculture, terraced wetlands, pine groves, and the famous outdoor music festival.",
            bestTimeToVisit = "Mar to Oct",
            dailyBudgetInr = 2400,
            topSpotsCount = 10,
            guideCount = 6,
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

    // Digital Passport Stamps for Indian States (Kept for model compatibility)
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
