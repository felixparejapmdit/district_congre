import React, { useEffect, useState, useMemo } from "react";
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
    useColorModeValue
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
    FaRoute
} from "react-icons/fa";

// --- CONFIG ---
const CENTRAL_OFFICE = { lat: 14.6508, lng: 121.0505 };
const START_ADDRESS = "Iglesia+Ni+Cristo+-+Lokal+ng+Templo+Central,+1+Central+Ave,+New+Era+(Constitution+Hills),+Quezon+City,+1101+Metro+Manila";
const API_BASE = "http://localhost:3001/api";
const SCRAPER_BASE = "http://localhost:5001/api";

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
    const [isScraping, setIsScraping] = useState(false);

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

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${API_BASE}/all-congregations`);
            setAllCongregations(data);
        } catch (err) {
            console.error("Init failed:", err);
            toast({ title: "Database Error", status: "error" });
        } finally {
            setLoading(false);
        }
    };

    // Haversine Distance (Air/Straight)
    const getAirDist = (lat, lon) => {
        if (!lat || !lon) return null;
        const R = 6371; // km
        const dLat = (lat - CENTRAL_OFFICE.lat) * (Math.PI / 180);
        const dLon = (lon - CENTRAL_OFFICE.lng) * (Math.PI / 180);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(CENTRAL_OFFICE.lat * (Math.PI / 180)) * Math.cos(lat * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return (R * c).toFixed(1);
    };

    const getRoadDist = (airDist) => {
        if (!airDist) return null;
        // PH Roads are winding; 1.37 is a standard expansion factor for air-to-road distance
        return (parseFloat(airDist) * 1.37).toFixed(1);
    };

    const getEstTraffic = (roadDist) => {
        if (!roadDist) return null;
        // Avg speed 28km/h including traffic delays
        const mins = Math.round((parseFloat(roadDist) / 28) * 60 + 10);
        return mins;
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
        setSelectedLocale(locale);
        onOpen();
        setIsScraping(true);
        try {
            const cleanName = (locale.slug || locale.name).toLowerCase().replace(/\s+/g, '-').replace(/[.,']/g, '');
            const { data: scraped } = await axios.get(`${SCRAPER_BASE}/scrape/${cleanName}`);
            if (scraped && scraped.success !== false) {
                const fresh = {
                    ...locale,
                    ...scraped,
                    latitude: scraped.latitude || locale.latitude,
                    longitude: scraped.longitude || locale.longitude,
                    imageUrl: scraped.imageUrl || locale.image_url,
                };
                setSelectedLocale(fresh);
                // Update global data so distance on card updates
                setAllCongregations(prev => prev.map(c => c.id === locale.id ? fresh : c));
            }
        } catch (err) {
            console.warn("Live scrape failed", err);
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
            <Box position="absolute" inset={0} bg={useColorModeValue("whiteAlpha.800", "blackAlpha.800")} backdropFilter="blur(5px)" zIndex={0} />

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
                            _focus={{ borderColor: "blue.400", bg: useColorModeValue("white", "gray.800") }}
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
                        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                            <AnimatePresence>
                                {filtered.map(c => {
                                    const airDist = getAirDist(c.latitude, c.longitude);
                                    const roadDist = getRoadDist(airDist);
                                    const traffic = getEstTraffic(roadDist);

                                    return (
                                        <Box
                                            key={c.id} as={motion.div} layout
                                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                                            bg={cardBg} p={6} borderRadius="3xl" shadow="xl" border="1px solid" borderColor={borderColor}
                                            cursor="pointer" onClick={() => handleSelectLocale(c)}
                                            whileHover={{ y: -8, shadow: "2xl", borderColor: "blue.400" }} transition="all 0.4s ease"
                                        >
                                            <VStack align="stretch" spacing={4}>
                                                <Flex justify="space-between" align="start">
                                                    <VStack align="start" spacing={0}>
                                                        <Text fontWeight="1000" fontSize="lg" color={titleColor}>{c.name}</Text>
                                                        <Text fontSize="xs" fontWeight="black" color="blue.400">{c.District?.name}</Text>
                                                    </VStack>
                                                    <Box p={3} bg="blue.500" color="white" borderRadius="2xl shadow-lg"><FaMapPin /></Box>
                                                </Flex>

                                                <Divider />

                                                <SimpleGrid columns={2} spacing={4}>
                                                    <VStack align="start" spacing={0}>
                                                        <HStack color="green.500" spacing={1} fontSize="10px" fontWeight="black"><FaCar /><Text>AIR DISTANCE</Text></HStack>
                                                        <Text fontSize="md" fontWeight="black" color={titleColor}>{airDist ? `${airDist} KM` : "---"}</Text>
                                                    </VStack>
                                                    <VStack align="start" spacing={0}>
                                                        <HStack color="blue.500" spacing={1} fontSize="10px" fontWeight="black"><FaRoad /><Text>ROAD DISTANCE</Text></HStack>
                                                        <Text fontSize="md" fontWeight="black" color={titleColor}>{roadDist ? `${roadDist} KM` : "---"}</Text>
                                                    </VStack>
                                                    <VStack align="start" spacing={0}>
                                                        <HStack color="orange.500" spacing={1} fontSize="10px" fontWeight="black"><FaClock /><Text>EST. TRAFFIC</Text></HStack>
                                                        <Text fontSize="md" fontWeight="black" color={titleColor}>{traffic ? `${traffic} MINS` : "---"}</Text>
                                                    </VStack>
                                                    <Flex align="center" justify="end"><Button rightIcon={<FaExternalLinkAlt />} colorScheme="blue" variant="link" size="sm" fontWeight="black">DETAILS</Button></Flex>
                                                </SimpleGrid>
                                            </VStack>
                                        </Box>
                                    );
                                })}
                            </AnimatePresence>
                        </SimpleGrid>
                    )}
                </Box>
            </Flex>

            {/* --- LOCALE DETAIL DRAWER --- */}
            <Drawer isOpen={isOpen} onClose={onClose} size="lg" placement="right">
                <DrawerOverlay bg="blackAlpha.800" backdropFilter="blur(20px)" />
                <DrawerContent bg={drawerBg} borderLeft="2px solid" borderColor="blue.500">
                    <DrawerHeader bg="blue.600" color="white" py={6}>
                        <HStack justify="space-between">
                            <VStack align="start" spacing={0}>
                                <Text fontSize="xl" fontWeight="black">{selectedLocale?.name || "LOCALE PROFILE"}</Text>
                                <Text fontSize="2xs" fontWeight="black" opacity={0.8} letterSpacing="widest">PREMIUM DIRECTORY SERVICES</Text>
                            </VStack>
                            <DrawerCloseButton position="static" />
                        </HStack>
                    </DrawerHeader>

                    <DrawerBody p={0} overflowY="auto" sx={{ '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { bg: 'blue.500' } }}>
                        {isScraping ? (
                            <Flex h="full" align="center" justify="center" direction="column" gap={6}>
                                <Spinner size="xl" thickness="5px" color="blue.500" /><Text fontWeight="black" color="blue.500" letterSpacing="widest">SYNCING LIVE DATA...</Text>
                            </Flex>
                        ) : selectedLocale ? (
                            <VStack align="stretch" spacing={0}>
                                <VStack p={6} spacing={8} align="stretch">
                                    {/* Locale Image Section (Moved here) */}
                                    {selectedLocale.imageUrl && (
                                        <Box
                                            borderRadius="2xl"
                                            overflow="hidden"
                                            shadow="2xl"
                                            border="4px solid"
                                            borderColor="whiteAlpha.100"
                                            as={motion.div}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                        >
                                            <Image
                                                src={selectedLocale.imageUrl}
                                                w="100%"
                                                h="250px"
                                                objectFit="cover"
                                                transition="transform 0.5s ease"
                                                _hover={{ transform: 'scale(1.05)' }}
                                            />
                                        </Box>
                                    )}

                                    {/* Action Buttons */}
                                    <HStack spacing={4}>
                                        <Button
                                            as={Link}
                                            href={`https://www.google.com/maps/dir/${START_ADDRESS}/${selectedLocale.latitude},${selectedLocale.longitude}`}
                                            isExternal
                                            w="full"
                                            height="60px"
                                            borderRadius="2xl"
                                            colorScheme="blue"
                                            leftIcon={<FaMapMarkedAlt />}
                                            shadow="xl"
                                        >
                                            OPEN MAPS
                                        </Button>
                                    </HStack>

                                    {/* Proximity Stats */}
                                    <Box bg={infoBoxBg} p={6} borderRadius="3xl" shadow="md" border="1px solid" borderColor={borderColor}>
                                        <HStack mb={6} color="blue.500"><FaRoute /><Text fontSize="xs" fontWeight="1000" letterSpacing="widest">PROXIMITY FROM CENTRAL</Text></HStack>
                                        <SimpleGrid columns={3} spacing={2}>
                                            <VStack p={3} bg="blackAlpha.50" borderRadius="2xl" align="center">
                                                <Text fontSize="8px" fontWeight="black" color="gray.500">AIR DISTANCE</Text>
                                                <Text fontWeight="1000" fontSize="sm">{getAirDist(selectedLocale.latitude, selectedLocale.longitude) || "---"} KM</Text>
                                            </VStack>
                                            <VStack p={3} bg="blackAlpha.50" borderRadius="2xl" align="center">
                                                <Text fontSize="8px" fontWeight="black" color="gray.500">ROAD DISTANCE</Text>
                                                <Text fontWeight="1000" fontSize="sm">{getRoadDist(getAirDist(selectedLocale.latitude, selectedLocale.longitude)) || "---"} KM</Text>
                                            </VStack>
                                            <VStack p={3} bg="blackAlpha.50" borderRadius="2xl" align="center">
                                                <Text fontSize="8px" fontWeight="black" color="gray.500">AVG TRAVEL</Text>
                                                <Text fontWeight="1000" fontSize="sm">{getEstTraffic(getRoadDist(getAirDist(selectedLocale.latitude, selectedLocale.longitude))) || "---"} MIN</Text>
                                            </VStack>
                                        </SimpleGrid>
                                    </Box>

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
                                                    className="schedule-box"
                                                    dangerouslySetInnerHTML={{
                                                        __html: (selectedLocale.schedule || "Fetching schedule...")
                                                            .replace(/Worship Service Schedule\s*(<br>)?\s*Be sure to confirm worship service schedules before attending\.\s*Worship service times may be temporarily or recently changed\./gi, "")
                                                    }}
                                                    sx={{
                                                        '.daygroup': { mb: 4, pb: 2, borderBottom: '1px solid', borderColor: 'gray.100' },
                                                        'h6': { fontWeight: '800', color: 'blue.500', textTransform: 'uppercase', fontSize: '10px', mb: 2 },
                                                        '.chip': { bg: 'blue.50', px: 2, py: 1, borderRadius: 'md', mr: 2, mb: 2, display: 'inline-flex', fontSize: 'xs', fontWeight: 'bold', color: 'blue.700' }
                                                    }}
                                                />
                                            </Box>
                                            {selectedLocale.contact && (
                                                <Box>
                                                    <Text fontSize="xs" fontWeight="black" color="gray.400" mb={1}>CONTACT CHANNELS</Text>
                                                    <Box fontSize="sm" fontWeight="bold" dangerouslySetInnerHTML={{ __html: selectedLocale.contact }} />
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
        </Box>
    );
};

export default LocalCongregations;
