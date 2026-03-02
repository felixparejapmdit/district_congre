import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import {
    Box,
    Input,
    Text,
    List,
    ListItem,
    Spinner,
    Drawer,
    DrawerOverlay,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    DrawerCloseButton,
    useDisclosure,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    Button,
    HStack,
    IconButton,
    Flex,
    VStack,
    Divider,
    Badge,
    useBreakpointValue,
    Tooltip,
    useToast,
    Portal,
    SimpleGrid,
    Image,
    Link,
    Icon,
    useColorMode,
    useColorModeValue,
    Skeleton,
    SkeletonText
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
    FaSearch,
    FaMapMarkerAlt,
    FaClock,
    FaPhoneAlt,
    FaArrowLeft,
    FaInfoCircle,
    FaCar,
    FaRoad,
    FaExternalLinkAlt,
    FaCalendarAlt,
    FaMapMarkedAlt,
    FaMapPin,
    FaRoute,
    FaFilePdf
} from "react-icons/fa";
import { exportLocaleToPDF } from "../utils/exportUtils";

// --- CONFIG ---
const CENTRAL_OFFICE = { lat: 14.6508, lng: 121.0505 };
const START_ADDRESS = "Iglesia+Ni+Cristo+-+Lokal+ng+Templo+Central,+1+Central+Ave,+New+Era+(Constitution+Hills),+Quezon+City,+1101+Metro+Manila";
const envApiUrl = process.env.REACT_APP_API_URL || "";
const envScraperHost = process.env.REACT_APP_SCRAPER_HOST || "";
const API_BASE = (envApiUrl === "/" ? "" : (envApiUrl || "http://localhost:3001")) + "/api";
const SCRAPER_BASE = (envScraperHost === "/" ? "" : (envScraperHost || "http://localhost:3001")) + "/api";

const LocalCongregations = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { colorMode } = useColorMode();

    // Data States
    const [allCongregations, setAllCongregations] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [selectedLocale, setSelectedLocale] = useState(null);
    const [currentDistrictName, setCurrentDistrictName] = useState("");
    const [isScraping, setIsScraping] = useState(false);

    // Timezone States
    const [localeTimezone, setLocaleTimezone] = useState(null);  // IANA tz string
    const [currentTime, setCurrentTime] = useState(new Date());
    const clockRef = useRef(null);

    // Shared Schedule States
    const { isOpen: isMatchingOpen, onOpen: onMatchingOpen, onClose: onMatchingClose } = useDisclosure();
    const [matchingLocales, setMatchingLocales] = useState([]);
    const [clickedTime, setClickedTime] = useState("");


    // Responsive
    const isMobile = useBreakpointValue({ base: true, md: false });

    // --- Adaptative UI Helpers ---
    const bgBlur = "blur(15px)";
    const glassBg = useColorModeValue("rgba(255, 255, 255, 0.85)", "rgba(15, 23, 42, 0.85)");
    const cardBg = useColorModeValue("white", "rgba(30, 41, 59, 0.7)");
    const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");
    const drawerBg = useColorModeValue("#F8FAFC", "#0A0F1A");
    const infoBoxBg = useColorModeValue("white", "whiteAlpha.50");
    const accentColor = "blue.500";
    const titleColor = useColorModeValue("gray.800", "white");
    const subTextColor = useColorModeValue("gray.500", "gray.400");
    const imageBorderColor = useColorModeValue("white", "whiteAlpha.200");
    const itemHoverBg = useColorModeValue('blue.50', 'whiteAlpha.100');
    const scheduleBorderBottom = useColorModeValue("gray.50", "whiteAlpha.50");
    const overlayBg = useColorModeValue("whiteAlpha.800", "blackAlpha.800");
    const inputFocusBg = useColorModeValue("white", "gray.800");

    useEffect(() => {
        init();
    }, []);

    // Live clock — ticks every second
    useEffect(() => {
        clockRef.current = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(clockRef.current);
    }, []);

    // Timezone lookup via free timeapi.io (no API key needed)
    const fetchTimezone = useCallback(async (lat, lng) => {
        if (!lat || !lng) { setLocaleTimezone(null); return; }
        try {
            const res = await fetch(`https://timeapi.io/api/TimeZone/coordinate?latitude=${lat}&longitude=${lng}`);
            const data = await res.json();
            if (data && data.timeZone) setLocaleTimezone(data.timeZone);
            else setLocaleTimezone(null);
        } catch {
            setLocaleTimezone(null);
        }
    }, []);


    // Timezone helper: get offset diff from PH (Asia/Manila = UTC+8)
    const getTimezoneInfo = useCallback((tzName, now) => {
        if (!tzName) return null;
        try {
            const fmt = (tz) => new Intl.DateTimeFormat('en-PH', {
                timeZone: tz,
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                hour12: true
            }).format(now);

            const fmtDate = (tz) => new Intl.DateTimeFormat('en-PH', {
                timeZone: tz,
                weekday: 'short', month: 'short', day: 'numeric'
            }).format(now);

            // Calculate UTC offset in hours for both timezones
            const toOffset = (tz) => {
                const d = new Date(now);
                const local = new Date(d.toLocaleString('en-US', { timeZone: tz }));
                const utc = new Date(d.toLocaleString('en-US', { timeZone: 'UTC' }));
                return (local - utc) / 3600000;
            };

            const phOffset = toOffset('Asia/Manila');       // always +8
            const locOffset = toOffset(tzName);
            const diff = locOffset - phOffset;

            return {
                phTime: fmt('Asia/Manila'),
                phDate: fmtDate('Asia/Manila'),
                localeTime: fmt(tzName),
                localeDate: fmtDate(tzName),
                diff,
                diffLabel: diff === 0 ? 'SAME AS PH' : `${diff > 0 ? '+' : ''}${diff}h FROM PH`,
                diffColor: diff === 0 ? 'green' : diff > 0 ? 'purple' : 'orange',
                tzShort: tzName.split('/').pop().replace(/_/g, ' '),
            };
        } catch {
            return null;
        }
    }, []);

    const init = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${API_BASE}/all-congregations`);
            setAllCongregations(data);
        } catch (error) {
            console.error("Init failed:", error);
            toast({ title: "Database Error", status: "error" });
        } finally {
            setLoading(false);
        }
    };

    // Haversine Distance (Air/Straight)
    const getAirDist = (lat, lon) => {
        const pLat = parseFloat(lat);
        const pLon = parseFloat(lon);
        if (isNaN(pLat) || isNaN(pLon) || pLat === 0) return null;

        const R = 6371; // km
        const dLat = (pLat - CENTRAL_OFFICE.lat) * (Math.PI / 180);
        const dLon = (pLon - CENTRAL_OFFICE.lng) * (Math.PI / 180);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(CENTRAL_OFFICE.lat * (Math.PI / 180)) * Math.cos(pLat * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const res = R * c;
        return isNaN(res) ? null : res.toFixed(1);
    };

    const getRoadDist = (airDist) => {
        const val = parseFloat(airDist);
        if (isNaN(val) || val <= 0) return null;
        // PH Roads are winding; 1.37 is a standard expansion factor for air-to-road distance
        const res = val * 1.37;
        return isNaN(res) ? null : res.toFixed(1);
    };

    const getEstTraffic = (roadDist) => {
        const val = parseFloat(roadDist);
        if (isNaN(val) || val <= 0) return null;
        // Avg speed 28km/h including traffic delays
        const mins = Math.round((val / 28) * 60 + 10);
        return isNaN(mins) ? null : mins;
    };

    const formatDuration = (mins) => {
        if (!mins) return "---";
        const totalMinutes = parseInt(mins);
        if (isNaN(totalMinutes)) return mins;
        if (totalMinutes < 60) return `${totalMinutes}min`;
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return m > 0 ? `${h}hr ${m}min` : `${h}hr`;
    };

    // parseSchedule function removed to restore previous HTML-based design

    const handleTimeClick = (timeStr) => {
        setClickedTime(timeStr);
        const normalizedTime = timeStr.trim();

        // Find matching congregations using a more flexible regex to handle HTML tags or whitespace variations
        // We look for the exact time string but allow different surrounding content
        const matches = allCongregations.filter(c => {
            if (!c.schedule) return false;
            if (c.id === selectedLocale?.id) return false;

            // This regex looks for the time string within a chip span or similar structure
            // We escape the time string for safety
            const escaped = normalizedTime.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`>\\s*${escaped}\\s*<`, 'i');
            return regex.test(c.schedule);
        });

        setMatchingLocales(matches);
        onMatchingOpen();
    };

    const filtered = useMemo(() => {
        if (!searchTerm.trim()) return [];
        const term = searchTerm.toLowerCase();
        return allCongregations.filter(c =>
            c.name.toLowerCase().includes(term) ||
            c.District?.name.toLowerCase().includes(term)
        ).slice(0, 50);
    }, [searchTerm, allCongregations]);

    const handleSelectLocale = async (locale) => {
        // Step 1: Map all DB fields to the shape the drawer expects
        const fromDb = {
            ...locale,
            imageUrl: locale.image_url || null,
            // Pre-computed proximity from DB (stored during sync)
            cachedAirDist: locale.air_distance || null,
            cachedRoadDist: locale.road_distance || null,
            cachedTravelTime: locale.travel_time || null,
            // Pre-computed timezone (stored during sync)
            cachedTimezoneDiff: locale.timezone_diff || null,
        };

        setSelectedLocale(fromDb);
        setCurrentDistrictName(locale.District?.name || "Unknown");
        onOpen();

        // Step 2: If timezone is stored in DB, parse the IANA zone right away
        if (locale.timezone_diff) {
            // Format stored: "Asia/Manila · Same as PH (UTC+8)" — extract the IANA part
            const iana = locale.timezone_diff.split(" · ")[0];
            if (iana) setLocaleTimezone(iana);
        } else if (locale.latitude && locale.longitude) {
            // DB didn't have it — fetch it live
            fetchTimezone(locale.latitude, locale.longitude);
        }

        // Step 3: Only scrape live if the important drawer fields are missing from DB
        const needsScrape = !locale.schedule || !locale.address || (!locale.latitude && !locale.longitude);
        if (!needsScrape) {
            // All data is in the DB — drawer is fully loaded, no scraping needed
            setIsScraping(false);
            return;
        }

        // Step 4: Fallback live scrape for incomplete records
        setIsScraping(true);
        try {
            const cleanName = (locale.slug || locale.name)
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[.,']/g, "");
            const { data: scraped } = await axios.get(`${SCRAPER_BASE}/scrape/${cleanName}`);

            if (scraped && scraped.success !== false) {
                let bestImageUrl = locale.image_url || null;
                const scraperImg = scraped.imageUrl || scraped.image_url;
                if (scraperImg) {
                    bestImageUrl = /lh[35]\.googleusercontent\.com/.test(scraperImg)
                        ? `${scraperImg.split("=")[0]}=s800`
                        : scraperImg;
                }

                const fresh = {
                    ...fromDb,
                    ...scraped,
                    imageUrl: bestImageUrl,
                    latitude: scraped.latitude || locale.latitude,
                    longitude: scraped.longitude || locale.longitude,
                };

                setSelectedLocale(fresh);
                setAllCongregations(prev => prev.map(c => c.id === locale.id ? fresh : c));
                if (!locale.timezone_diff) fetchTimezone(fresh.latitude, fresh.longitude);
            }
        } catch (err) {
            console.warn("Live scrape fallback failed:", err);
            toast({
                title: "Using Cached Data",
                description: "Could not fetch live data. Showing database info.",
                status: "warning",
                duration: 3000,
            });
        } finally {
            setIsScraping(false);
        }
    };


    return (
        <Box
            w="100%" h="100vh" position="relative" overflow="hidden"
            bgImage="url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')"
            backgroundSize="cover" backgroundPosition="center"
        >
            {/* Background Layer */}
            <Box position="absolute" inset={0} bg={overlayBg} backdropFilter="blur(5px)" zIndex={0} />

            <Flex position="relative" zIndex={1} h="100%" flexDir="column" p={{ base: 4, md: 8 }}>
                {/* Header */}
                <Flex align="center" justify="space-between" mb={8}>
                    <HStack spacing={4}>
                        <VStack align="start" spacing={0}>
                            <Text fontSize="2xl" fontWeight="black" color="blue.500" letterSpacing="tight">FIND CONGREGATION</Text>
                            <Text fontSize="xs" fontWeight="bold" color={subTextColor}>CENTRAL OFFICE PROXIMITY ENGINE</Text>
                        </VStack>
                    </HStack>
                    {!isMobile && (
                        <Badge colorScheme="blue" p={2} borderRadius="xl" variant="subtle" border="1px solid" borderColor="blue.200">
                            COORD: {CENTRAL_OFFICE.lat}, {CENTRAL_OFFICE.lng} (CENTRAL)
                        </Badge>
                    )}
                </Flex>

                {/* Main Search UI */}
                <VStack spacing={6} w="100%" maxW="850px" mx="auto" mb={10}>
                    <Box position="relative" w="100%">
                        <Input
                            autoFocus
                            placeholder="Type to search locale or district..."
                            size="lg" h="70px" borderRadius="full"
                            bg={glassBg} px={14} fontSize="xl" fontWeight="bold"
                            border="2px solid" borderColor={borderColor}
                            shadow="2xl" color={titleColor}
                            _focus={{ borderColor: "blue.400", bg: inputFocusBg }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Box position="absolute" left={6} top="50%" transform="translateY(-50%)" color="blue.500"><FaSearch size={22} /></Box>
                    </Box>
                    {searchTerm && <Text fontSize="sm" fontWeight="black" color="blue.500">{filtered.length} RESULTS FROM DATABASE</Text>}
                </VStack>

                {/* Results List */}
                <Box flex={1} overflowY="auto" px={2} sx={{ '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { bg: 'blue.500', borderRadius: 'full' } }}>
                    {loading ? (
                        <Flex h="300px" justify="center" align="center" flexDir="column" gap={4}>
                            <Spinner size="xl" thickness="4px" color="blue.500" /><Text fontWeight="black" color="blue.500">INITIATING GEOSPATIAL DATA...</Text>
                        </Flex>
                    ) : (
                        <VStack spacing={3} align="stretch" pb={8}>
                            <AnimatePresence mode="popLayout">
                                {filtered.map((c, i) => {
                                    // Robust parsing to handle 'NaN km' or invalid distance strings from DB
                                    const parseSafe = (val) => {
                                        if (!val || typeof val !== 'string' || val.includes('NaN')) return null;
                                        const p = parseFloat(val);
                                        return isNaN(p) ? null : p;
                                    };

                                    const rawAir = parseSafe(c.air_distance) || getAirDist(c.latitude, c.longitude);
                                    const airDistBase = rawAir ? `${rawAir} KM` : "---";

                                    const rawRoad = parseSafe(c.road_distance) || getRoadDist(rawAir);
                                    const roadDistBase = rawRoad ? `${rawRoad} KM` : "---";

                                    const trafficMins = parseSafe(c.travel_time) || getEstTraffic(rawRoad);
                                    const trafficBase = formatDuration(trafficMins);

                                    return (
                                        <Box
                                            key={c.id} as={motion.div} layout
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20, scale: 0.95 }}
                                            transition={{ duration: 0.2, delay: i * 0.02 }}
                                            bg={cardBg} px={6} py={3} borderRadius="2xl" shadow="md" border="1px solid" borderColor={borderColor}
                                            cursor="pointer" onClick={() => handleSelectLocale(c)}
                                            whileHover={{ x: 10, shadow: "lg", borderColor: "blue.400", backgroundColor: itemHoverBg }}
                                        >
                                            <Flex justify="space-between" align="center" gap={4}>
                                                <HStack spacing={4} flex={1}>
                                                    <Box p={2} bg="blue.500" color="white" borderRadius="xl" shadow="inner">
                                                        <Icon as={FaMapPin} boxSize={3} />
                                                    </Box>
                                                    <VStack align="start" spacing={0}>
                                                        <Text fontWeight="1000" fontSize="md" color={titleColor} noOfLines={1}>{c.name}</Text>
                                                        <Text fontSize="xs" fontWeight="black" color="blue.400" textTransform="uppercase" letterSpacing="widest">{c.District?.name}</Text>
                                                    </VStack>
                                                </HStack>

                                                <HStack spacing={8} display={{ base: "none", md: "flex" }} mr={4}>
                                                    <VStack align="center" spacing={0} minW="80px">
                                                        <Text fontSize="9px" fontWeight="black" color="gray.500" letterSpacing="widest" opacity={0.7}>AIR DISTANCE</Text>
                                                        <Text fontSize="sm" fontWeight="black" color={titleColor}>{airDistBase || "---"}</Text>
                                                    </VStack>
                                                    <VStack align="center" spacing={0} minW="80px">
                                                        <Text fontSize="9px" fontWeight="black" color="gray.500" letterSpacing="widest" opacity={0.7}>ROAD DISTANCE</Text>
                                                        <Text fontSize="sm" fontWeight="black" color={titleColor}>{roadDistBase || "---"}</Text>
                                                    </VStack>
                                                    <VStack align="center" spacing={0} minW="100px">
                                                        <Text fontSize="9px" fontWeight="black" color="orange.500" letterSpacing="widest" opacity={0.8}>AVG TRAVEL</Text>
                                                        <Text fontSize="sm" fontWeight="black" color={titleColor}>{trafficBase || "---"}</Text>
                                                    </VStack>
                                                </HStack>

                                                <IconButton
                                                    icon={<FaExternalLinkAlt />}
                                                    colorScheme="blue"
                                                    variant="ghost"
                                                    size="sm"
                                                    borderRadius="full"
                                                    aria-label="View Details"
                                                    _hover={{ bg: 'blue.100', color: 'blue.600' }}
                                                />
                                            </Flex>
                                        </Box>
                                    );
                                })}
                            </AnimatePresence>

                            {searchTerm && filtered.length === 0 && !loading && (
                                <Flex py={12} justify="center" align="center" flexDir="column" opacity={0.6}>
                                    <Box p={6} borderRadius="full" bg="whiteAlpha.200" mb={4}>
                                        <FaSearch size={40} color="gray.500" />
                                    </Box>
                                    <VStack spacing={1}>
                                        <Text fontWeight="black" color={titleColor} fontSize="lg">No results matching your search</Text>
                                        <Text fontSize="sm" color={subTextColor}>Try a different locale name or district</Text>
                                    </VStack>
                                </Flex>
                            )}
                        </VStack>
                    )}
                </Box>
            </Flex>

            {/* --- LOCALE DETAIL DRAWER --- */}
            <Drawer isOpen={isOpen} onClose={onClose} size="lg" placement="right">
                <DrawerOverlay bg="blackAlpha.800" backdropFilter="blur(20px)" />
                <DrawerContent bg={drawerBg} borderLeft="2px solid" borderColor="blue.500">
                    <DrawerHeader
                        p={0}
                        h={selectedLocale?.imageUrl ? "300px" : "100px"}
                        position="relative"
                        overflow="hidden"
                    >
                        {selectedLocale?.imageUrl ? (
                            <Box h="100%" w="100%" position="relative">
                                <Image
                                    src={selectedLocale.imageUrl}
                                    w="100%"
                                    h="100%"
                                    objectFit="cover"
                                    as={motion.img}
                                    initial={{ scale: 1.2 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 1.5 }}
                                />
                                <Box
                                    position="absolute"
                                    top={0}
                                    left={0}
                                    right={0}
                                    bottom={0}
                                    bgGradient="linear(to-t, blackAlpha.900, transparent)"
                                />
                                <VStack
                                    position="absolute"
                                    bottom={6}
                                    left={6}
                                    align="start"
                                    spacing={0}
                                    color="white"
                                >
                                    <Badge colorScheme="blue" mb={2}>ACTIVE LOCALE</Badge>
                                    <Text fontSize="3xl" fontWeight="black" textShadow="0 2px 10px rgba(0,0,0,0.5)">
                                        {selectedLocale.name}
                                    </Text>
                                    <Text fontSize="xs" fontWeight="bold" opacity={0.8} letterSpacing="widest">
                                        DISTRICT OF {currentDistrictName?.toUpperCase()}
                                    </Text>
                                </VStack>
                            </Box>
                        ) : (
                            <Box bg="blue.600" h="100%" w="100%" display="flex" alignItems="center" px={6}>
                                <VStack align="start" spacing={0} color="white">
                                    <Text fontSize="2xl" fontWeight="black">{selectedLocale?.name || "LOCALE PROFILE"}</Text>
                                    <Text fontSize="2xs" fontWeight="black" opacity={0.8} letterSpacing="widest">PREMIUM DIRECTORY SERVICES</Text>
                                </VStack>
                            </Box>
                        )}
                        <DrawerCloseButton
                            color="white"
                            bg="blackAlpha.500"
                            _hover={{ bg: "blackAlpha.700" }}
                            borderRadius="full"
                            top={4}
                            right={4}
                        />
                    </DrawerHeader>

                    <DrawerBody p={0} overflowY="auto" sx={{ '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { bg: 'blue.500' } }}>
                        {isScraping ? (
                            // Skeleton loader — mirrors the real drawer layout
                            <VStack spacing={0} align="stretch">
                                {/* Image skeleton */}
                                <Skeleton h="250px" w="100%" />
                                <VStack p={6} spacing={5} align="stretch">
                                    {/* Action button skeleton */}
                                    <Skeleton h="60px" borderRadius="2xl" />
                                    {/* Proximity card skeleton */}
                                    <Box p={6} borderRadius="3xl" border="1px solid" borderColor={borderColor}>
                                        <Skeleton h="14px" w="50%" mb={4} />
                                        <HStack spacing={3}>
                                            <Skeleton h="60px" flex={1} borderRadius="xl" />
                                            <Skeleton h="60px" flex={1} borderRadius="xl" />
                                            <Skeleton h="60px" flex={1} borderRadius="xl" />
                                        </HStack>
                                    </Box>
                                    {/* Info card skeleton */}
                                    <Box p={6} borderRadius="3xl" border="1px solid" borderColor={borderColor}>
                                        <Skeleton h="14px" w="40%" mb={4} />
                                        <SkeletonText noOfLines={3} spacing={3} />
                                        <Skeleton h="14px" w="40%" mt={6} mb={4} />
                                        <SkeletonText noOfLines={5} spacing={2} />
                                    </Box>
                                </VStack>
                            </VStack>
                        ) : selectedLocale ? (
                            <VStack align="stretch" spacing={0}>
                                <VStack p={6} spacing={8} align="stretch">
                                    {/* --- LOCALE & DISTRICT DISPLAY --- */}
                                    <VStack align="start" spacing={0} mb={-4}>
                                        <Text fontSize="2xl" fontWeight="black" color={titleColor}>{selectedLocale.name}</Text>
                                        <Text fontSize="xs" fontWeight="black" color="blue.500">DISTRICT OF {currentDistrictName?.toUpperCase()}</Text>
                                    </VStack>

                                    {/* Action Buttons */}
                                    <HStack spacing={4}>
                                        <Button
                                            as={Link}
                                            href={`https://www.google.com/maps/dir/${START_ADDRESS}/${selectedLocale.latitude},${selectedLocale.longitude}`}
                                            isExternal
                                            flex={1}
                                            height="60px"
                                            borderRadius="2xl"
                                            colorScheme="blue"
                                            leftIcon={<FaMapMarkedAlt />}
                                            shadow="xl"
                                        >
                                            OPEN MAPS
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                const parseSafe = (val) => {
                                                    if (!val || typeof val !== 'string' || val.includes('NaN')) return null;
                                                    const p = parseFloat(val);
                                                    return isNaN(p) ? null : p;
                                                };
                                                const air = parseSafe(selectedLocale.air_distance) || getAirDist(selectedLocale.latitude, selectedLocale.longitude);
                                                const road = parseSafe(selectedLocale.road_distance) || getRoadDist(air);
                                                const traffic = parseSafe(selectedLocale.travel_time) || getEstTraffic(road);
                                                const tz = localeTimezone ? getTimezoneInfo(localeTimezone, currentTime)?.diffLabel : null;

                                                exportLocaleToPDF({
                                                    ...selectedLocale,
                                                    air_distance: air ? `${air} KM` : null,
                                                    road_distance: road ? `${road} KM` : null,
                                                    travel_time: traffic ? formatDuration(traffic) : null,
                                                    timezone_diff: tz
                                                }, currentDistrictName);
                                            }}
                                            flex={1}
                                            height="60px"
                                            borderRadius="2xl"
                                            colorScheme="red"
                                            leftIcon={<FaFilePdf />}
                                            shadow="xl"
                                        >
                                            EXPORT PDF
                                        </Button>
                                    </HStack>

                                    {/* Proximity Stats */}
                                    <Box bg={infoBoxBg} p={6} borderRadius="3xl" shadow="md" border="1px solid" borderColor={borderColor}>
                                        <HStack mb={6} color="blue.500"><FaRoute /><Text fontSize="xs" fontWeight="1000" letterSpacing="widest">PROXIMITY FROM CENTRAL</Text></HStack>
                                        <SimpleGrid columns={3} spacing={2}>
                                            <VStack p={3} bg="blackAlpha.50" borderRadius="2xl" align="center">
                                                <Text fontSize="8px" fontWeight="black" color="gray.500">AIR DISTANCE</Text>
                                                <Skeleton isLoaded={!isScraping} h="14px">
                                                    <Text fontWeight="1000" fontSize="sm">
                                                        {(() => {
                                                            const parseSafe = (val) => {
                                                                if (!val || typeof val !== 'string' || val.includes('NaN')) return null;
                                                                const p = parseFloat(val);
                                                                return isNaN(p) ? null : p;
                                                            };
                                                            const val = parseSafe(selectedLocale.air_distance) || getAirDist(selectedLocale.latitude, selectedLocale.longitude);
                                                            return val ? `${val} KM` : "---";
                                                        })()}
                                                    </Text>
                                                </Skeleton>
                                            </VStack>
                                            <VStack p={3} bg="blackAlpha.50" borderRadius="2xl" align="center">
                                                <Text fontSize="8px" fontWeight="black" color="gray.500">ROAD DISTANCE</Text>
                                                <Skeleton isLoaded={!isScraping} h="14px">
                                                    <Text fontWeight="1000" fontSize="sm">
                                                        {(() => {
                                                            const parseSafe = (val) => {
                                                                if (!val || typeof val !== 'string' || val.includes('NaN')) return null;
                                                                const p = parseFloat(val);
                                                                return isNaN(p) ? null : p;
                                                            };
                                                            const air = parseSafe(selectedLocale.air_distance) || getAirDist(selectedLocale.latitude, selectedLocale.longitude);
                                                            const road = parseSafe(selectedLocale.road_distance) || getRoadDist(air);
                                                            return road ? `${road} KM` : "---";
                                                        })()}
                                                    </Text>
                                                </Skeleton>
                                            </VStack>
                                            <VStack p={3} bg="blackAlpha.50" borderRadius="2xl" align="center">
                                                <Text fontSize="8px" fontWeight="black" color="gray.500">AVG TRAVEL</Text>
                                                <Skeleton isLoaded={!isScraping} h="14px">
                                                    <Text fontWeight="1000" fontSize="sm">
                                                        {(() => {
                                                            const parseSafe = (val) => {
                                                                if (!val || typeof val !== 'string' || val.includes('NaN')) return null;
                                                                const p = parseFloat(val);
                                                                return isNaN(p) ? null : p;
                                                            };
                                                            const air = parseSafe(selectedLocale.air_distance) || getAirDist(selectedLocale.latitude, selectedLocale.longitude);
                                                            const road = parseSafe(selectedLocale.road_distance) || getRoadDist(air);
                                                            const traffic = parseSafe(selectedLocale.travel_time) || getEstTraffic(road);
                                                            return formatDuration(traffic);
                                                        })()}
                                                    </Text>
                                                </Skeleton>
                                            </VStack>
                                        </SimpleGrid>
                                    </Box>

                                    {/* Timezone World Clock */}
                                    {selectedLocale.latitude && selectedLocale.longitude && (() => {
                                        const tzInfo = getTimezoneInfo(localeTimezone, currentTime);
                                        if (!localeTimezone) return (
                                            <Box bg={infoBoxBg} p={6} borderRadius="3xl" border="1px solid" borderColor={borderColor}>
                                                <Skeleton h="12px" w="35%" mb={4} />
                                                <HStack spacing={4}>
                                                    <Skeleton h="90px" flex={1} borderRadius="2xl" />
                                                    <Skeleton h="90px" flex={1} borderRadius="2xl" />
                                                </HStack>
                                            </Box>
                                        );
                                        if (!tzInfo) return null;
                                        return (
                                            <Box bg={infoBoxBg} p={6} borderRadius="3xl" shadow="md" border="1px solid" borderColor={borderColor}>
                                                <HStack mb={4} justify="space-between">
                                                    <HStack color="purple.500">
                                                        <FaClock />
                                                        <Text fontSize="xs" fontWeight="1000" letterSpacing="widest">WORLD CLOCK</Text>
                                                    </HStack>
                                                    <Badge colorScheme={tzInfo.diffColor} borderRadius="full" px={3} py={1} fontSize="10px" fontWeight="black">
                                                        {tzInfo.diffLabel}
                                                    </Badge>
                                                </HStack>
                                                <SimpleGrid columns={2} spacing={4}>
                                                    <Box p={4} borderRadius="2xl" bg="blue.500" color="white" textAlign="center">
                                                        <Text fontSize="8px" fontWeight="black" opacity={0.8} mb={1} letterSpacing="wider">🇵🇭 PHILIPPINES</Text>
                                                        <Text fontSize="lg" fontWeight="black" fontFamily="monospace">{tzInfo.phTime}</Text>
                                                        <Text fontSize="9px" opacity={0.75} mt={1}>{tzInfo.phDate}</Text>
                                                        <Text fontSize="8px" opacity={0.6} mt="2px">Asia/Manila · UTC+8</Text>
                                                    </Box>
                                                    <Box p={4} borderRadius="2xl" bg={`${tzInfo.diffColor}.500`} color="white" textAlign="center">
                                                        <Text fontSize="8px" fontWeight="black" opacity={0.8} mb={1} letterSpacing="wider">📍 {tzInfo.tzShort.toUpperCase()}</Text>
                                                        <Text fontSize="lg" fontWeight="black" fontFamily="monospace">{tzInfo.localeTime}</Text>
                                                        <Text fontSize="9px" opacity={0.75} mt={1}>{tzInfo.localeDate}</Text>
                                                        <Text fontSize="8px" opacity={0.6} mt="2px" noOfLines={1}>{localeTimezone}</Text>
                                                    </Box>
                                                </SimpleGrid>
                                            </Box>
                                        );
                                    })()}

                                    {/* Core Information */}
                                    <Box bg={infoBoxBg} p={6} borderRadius="3xl" shadow="md" border="1px solid" borderColor={borderColor}>
                                        <HStack mb={6} color="blue.500"><FaInfoCircle /><Text fontSize="xs" fontWeight="1000" letterSpacing="widest">LOCALE DIRECTORY</Text></HStack>
                                        <VStack align="start" spacing={8}>
                                            <Box>
                                                <Text fontSize="xs" fontWeight="black" color="gray.400" mb={1}>PERMANENT ADDRESS</Text>
                                                <Text fontWeight="1000" fontSize="md" lineHeight="short">{selectedLocale.address || "Fetching address..."}</Text>
                                            </Box>
                                            <Box>
                                                <Text fontSize="xs" fontWeight="black" color="gray.400" mb={3}>WORSHIP SERVICE SCHEDULE</Text>
                                                <Box
                                                    className="schedule-container"
                                                    dangerouslySetInnerHTML={{ __html: selectedLocale.schedule || '<p style="color:gray; font-weight:bold; font-size:14px;">No schedule available.</p>' }}
                                                    onClick={(e) => {
                                                        const chip = e.target.closest('.chip');
                                                        if (chip) {
                                                            handleTimeClick(chip.innerText.trim());
                                                        }
                                                    }}
                                                    sx={{
                                                        '& .daygroup': { marginBottom: '15px' },
                                                        '& .daygroup h6': { color: 'blue.500', fontSize: 'xs', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 'widest', marginBottom: '8px' },
                                                        '& .chip-break': { display: 'flex', flexWrap: 'wrap', gap: '8px' },
                                                        '& .chip': {
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s',
                                                            _hover: { transform: 'scale(1.05)', bg: 'blue.500', color: 'white' }
                                                        }
                                                    }}
                                                />
                                            </Box>
                                            {selectedLocale.contact && (
                                                <Box>
                                                    <Text fontSize="xs" fontWeight="black" color="gray.400" mb={1}>CONTACT CHANNELS</Text>
                                                    <Box
                                                        fontSize="sm"
                                                        fontWeight="bold"
                                                        dangerouslySetInnerHTML={{
                                                            __html: selectedLocale.contact
                                                                .replace(/<br\s*\/?>/gi, " • ") // Replace br with bullet for space efficiency
                                                                .replace(/<\/?p>/gi, "")
                                                        }}
                                                    />
                                                </Box>
                                            )}
                                        </VStack>
                                    </Box>

                                    {/* Live Map Frame */}
                                    {selectedLocale.mapUrl ? (
                                        <Box h="350px" borderRadius="3xl" overflow="hidden" border="4px solid" borderColor="whiteAlpha.100" shadow="2xl">
                                            <iframe title="map" width="100%" height="100%" frameBorder="0" src={selectedLocale.mapUrl} />
                                        </Box>
                                    ) : (
                                        <Box h="200px" borderRadius="3xl" bg="gray.100" display="flex" align="center" justify="center"><Text color="gray.400" fontWeight="bold">NO MAP PREVIEW AVAILABLE</Text></Box>
                                    )}
                                </VStack>
                            </VStack>
                        ) : null}
                    </DrawerBody>
                </DrawerContent>
            </Drawer>

            {/* --- SHARED SCHEDULE MODAL --- */}
            <Modal isOpen={isMatchingOpen} onClose={onMatchingClose} size="2xl" scrollBehavior="inside">
                <ModalOverlay backdropFilter="blur(20px)" bg="blackAlpha.700" />
                <ModalContent borderRadius="3xl" bg={drawerBg} border="1px solid" borderColor="blue.500" overflow="hidden">
                    <ModalHeader p={6} borderBottom="1px solid" borderColor={borderColor}>
                        <VStack align="start" spacing={1}>
                            <HStack color="blue.500">
                                <Icon as={FaClock} />
                                <Text fontSize="xs" fontWeight="black" letterSpacing="widest">SHARED SCHEDULE FINDER</Text>
                            </HStack>
                            <Text fontSize="xl" fontWeight="black" color={titleColor}>
                                LOCALES WITH {clickedTime} SCHEDULE
                            </Text>
                            <Badge colorScheme="blue" borderRadius="full" px={3}>{matchingLocales.length} RESULTS FOUND</Badge>
                        </VStack>
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody p={6}>
                        {matchingLocales.length > 0 ? (
                            <VStack spacing={3} align="stretch">
                                {matchingLocales.map((match, idx) => (
                                    <Box
                                        key={match.id}
                                        p={4}
                                        bg={infoBoxBg}
                                        borderRadius="2xl"
                                        border="1px solid"
                                        borderColor={borderColor}
                                        _hover={{ borderColor: 'blue.400', transform: 'translateX(5px)', bg: itemHoverBg }}
                                        transition="all 0.2s"
                                        cursor="pointer"
                                        onClick={() => {
                                            handleSelectLocale(match);
                                            onMatchingClose();
                                        }}
                                    >
                                        <Flex justify="space-between" align="center">
                                            <HStack spacing={4}>
                                                <Box p={2} bg="blue.500" color="white" borderRadius="lg">
                                                    <Icon as={FaMapPin} />
                                                </Box>
                                                <VStack align="start" spacing={0}>
                                                    <Text fontWeight="black" fontSize="md" color={titleColor}>{match.name}</Text>
                                                    <Text fontSize="xs" fontWeight="bold" color="blue.400">{match.District?.name}</Text>
                                                </VStack>
                                            </HStack>
                                            <Button size="sm" variant="ghost" rightIcon={<FaExternalLinkAlt />} colorScheme="blue" fontWeight="black" fontSize="xs">VIEW PROFILE</Button>
                                        </Flex>
                                    </Box>
                                ))}
                            </VStack>
                        ) : (
                            <Flex h="200px" align="center" justify="center" flexDir="column" opacity={0.5}>
                                <Icon as={FaSearch} boxSize={10} mb={4} />
                                <Text fontWeight="black">NO OTHER LOCALES FOUND</Text>
                            </Flex>
                        )}
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default LocalCongregations;
