import React, { useEffect, useState } from "react";
import {
    Box,
    Input,
    Text,
    List,
    ListItem,
    Spinner,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    Button,
    HStack,
    IconButton,
    Flex,
    VStack,
    Divider,
    Badge,
    useBreakpointValue,
    Checkbox,
    useToast,
    Tooltip,
    CircularProgress,
    CircularProgressLabel,
    Progress
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
    FaSearch,
    FaMapMarkerAlt,
    FaGlobeAsia,
    FaClock,
    FaPhoneAlt,
    FaSyncAlt,
    FaArrowLeft,
    FaDownload,
    FaCheckSquare,
    FaEraser
} from "react-icons/fa";

const SCRAPER_BASE = "http://localhost:5001/api";
const DB_BASE = "http://localhost:3001/api";

const DirectoryManager = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [districts, setDistricts] = useState([]);
    const [filteredDistricts, setFilteredDistricts] = useState([]);
    const [searchDistrict, setSearchDistrict] = useState("");
    const [locales, setLocales] = useState([]);
    const [filteredLocales, setFilteredLocales] = useState([]);
    const [searchLocale, setSearchLocale] = useState("");
    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [selectedLocale, setSelectedLocale] = useState(null);
    const [localeDetails, setLocaleDetails] = useState(null);
    const [loadingDistricts, setLoadingDistricts] = useState(false);
    const [loadingLocales, setLoadingLocales] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [selectedDistrictIds, setSelectedDistrictIds] = useState([]);
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    const [exportStatus, setExportStatus] = useState("");

    const isMobile = useBreakpointValue({ base: true, md: false });
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { isOpen: isExportOpen, onOpen: onExportOpen, onClose: onExportClose } = useDisclosure();

    const selectedDistrictNames = districts
        .filter(d => selectedDistrictIds.includes(d.id))
        .map(d => d.name)
        .join(', ');

    useEffect(() => {
        fetchDistricts();
    }, []);

    const fetchDistricts = async () => {
        setLoadingDistricts(true);
        try {
            // Fetch from both to get IDs for export
            const [webRes, dbRes] = await Promise.all([
                axios.get(`${SCRAPER_BASE}/districts`),
                axios.get(`${DB_BASE}/districts`)
            ]);

            const parser = new DOMParser();
            const doc = parser.parseFromString(webRes.data, 'text/html');
            const links = doc.querySelectorAll('.mdl-list_item a.weight-700');

            const parsedDistricts = Array.from(links).map(link => {
                const name = link.textContent.trim();
                const match = dbRes.data.find(d => d.name.toLowerCase() === name.toLowerCase());
                return {
                    name,
                    path: link.getAttribute('href'),
                    id: match ? match.id : null
                };
            });

            setDistricts(parsedDistricts);
            setFilteredDistricts(parsedDistricts);
        } catch (error) {
            console.error("Error fetching districts:", error);
            toast({ title: "Sync failed", status: "warning" });
        } finally {
            setLoadingDistricts(false);
        }
    };

    const fetchLocales = async (district) => {
        setSelectedDistrict(district);
        setSearchLocale("");
        setLocales([]);
        setFilteredLocales([]);
        setLoadingLocales(true);
        try {
            const { data } = await axios.get(`${SCRAPER_BASE}/locales?path=${encodeURIComponent(district.path)}`);
            const parser = new DOMParser();
            const doc = parser.parseFromString(data, 'text/html');
            const links = doc.querySelectorAll('.mdl-grid a[href*="/locales/"]');
            const parsedLocales = Array.from(links).map(link => ({
                name: link.textContent.trim(),
                slug: link.getAttribute('href').split('/').pop()
            }));
            setLocales(parsedLocales);
            setFilteredLocales(parsedLocales);
        } catch (error) {
            console.error("Error fetching locales:", error);
        } finally {
            setLoadingLocales(false);
        }
    };

    const fetchDetails = async (locale) => {
        setSelectedLocale(locale);
        setLocaleDetails(null);
        setLoadingDetails(true);
        onOpen();
        try {
            const { data } = await axios.get(`${SCRAPER_BASE}/scrape/${locale.slug}`);
            setLocaleDetails(data);
        } catch (error) {
            console.error("Error fetching details:", error);
        } finally {
            setLoadingDetails(false);
        }
    };

    const toggleSelectAllVisible = () => {
        const visibleIds = filteredDistricts.map(d => d.id).filter(id => id !== null);
        const allSelected = visibleIds.every(id => selectedDistrictIds.includes(id));

        if (allSelected) {
            setSelectedDistrictIds(prev => prev.filter(id => !visibleIds.includes(id)));
        } else {
            setSelectedDistrictIds(prev => [...new Set([...prev, ...visibleIds])]);
        }
    };

    const handleClearSelection = () => {
        setSelectedDistrictIds([]);
    };

    const handleExport = async () => {
        if (selectedDistrictIds.length === 0) {
            toast({ title: "Select districts first", status: "warning", position: "top" });
            return;
        }

        setIsExporting(true);
        setExportProgress(0);
        setExportStatus("Initializing Export...");
        onExportOpen();

        try {
            // Simulate progression like Globe.js for better UX
            const listRes = await axios.get(`${DB_BASE}/local-congregations-multi?district_ids=${selectedDistrictIds.join(',')}`);
            const total = listRes.data.length;

            if (total === 0) {
                toast({ title: "No congregations found in selection", status: "info" });
                setIsExporting(false);
                onExportClose();
                return;
            }

            // Start actual process
            const exportPromise = axios.post(`${DB_BASE}/export-schedule`, {
                districtIds: selectedDistrictIds
            }, { responseType: 'blob' });

            // Progression simulation
            for (let i = 0; i < total; i++) {
                const cong = listRes.data[i];
                setExportStatus(`[${i + 1}/${total}] Processing ${cong.name}...`);
                setExportProgress(Math.floor((i / total) * 95));
                // Small sleep for UX
                await new Promise(r => setTimeout(r, total > 50 ? 50 : 200));
            }

            setExportStatus("Generatng Excel file...");
            setExportProgress(98);

            const response = await exportPromise;

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `District_Export_${new Date().getTime()}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            setExportProgress(100);
            setExportStatus("Export Complete!");
            toast({ title: "Success", description: "Your file is ready.", status: "success" });

            setTimeout(() => {
                onExportClose();
                setIsExporting(false);
            }, 1000);

        } catch (error) {
            console.error("Export failed:", error);
            toast({ title: "Export Error", description: "Failed to generate report.", status: "error" });
            setIsExporting(false);
            onExportClose();
        }
    };

    useEffect(() => {
        const filtered = districts.filter(d =>
            d.name.toLowerCase().includes(searchDistrict.toLowerCase())
        );
        setFilteredDistricts(filtered);
    }, [searchDistrict, districts]);

    useEffect(() => {
        const filtered = locales.filter(l =>
            l.name.toLowerCase().includes(searchLocale.toLowerCase())
        );
        setFilteredLocales(filtered);
    }, [searchLocale, locales]);

    return (
        <Box
            position="relative"
            w="100%"
            h="100vh"
            overflow="hidden"
            backgroundImage="url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')"
            backgroundSize="cover"
            backgroundPosition="center"
        >
            {/* Background Overlay */}
            <Box
                position="absolute"
                top="0"
                left="0"
                w="100%"
                h="100%"
                bgGradient="radial(circle at center, transparent, rgba(0,0,0,0.6))"
                backdropFilter="brightness(0.6)"
                zIndex="0"
            />

            <Flex
                position="relative"
                zIndex="1"
                p={6}
                gap={6}
                h="100%"
                flexDir={isMobile ? "column" : "row"}
            >
                {/* DISTRICTS SIDEBAR */}
                <Box
                    w={isMobile ? "100%" : "380px"}
                    bg="rgba(255, 255, 255, 0.9)"
                    backdropFilter="blur(15px)"
                    borderRadius="2xl"
                    p={6}
                    shadow="2xl"
                    display="flex"
                    flexDir="column"
                    border="1px solid rgba(255, 255, 255, 0.4)"
                >
                    <VStack align="stretch" spacing={4} flex="1" overflow="hidden">
                        <Flex justify="space-between" align="center">
                            <HStack spacing={3}>
                                <Text fontSize="xl" fontWeight="black" color="blue.900" display="flex" align="center" gap={2}>
                                    <FaGlobeAsia /> DISTRICTS
                                </Text>
                            </HStack>
                            <HStack spacing={1}>
                                <Tooltip label="Select All Visible">
                                    <IconButton size="xs" icon={<FaCheckSquare />} variant="ghost" onClick={toggleSelectAllVisible} colorScheme="blue" />
                                </Tooltip>
                                <Tooltip label="Clear Selection">
                                    <IconButton size="xs" icon={<FaEraser />} variant="ghost" onClick={handleClearSelection} colorScheme="red" />
                                </Tooltip>
                                <Button
                                    size="sm"
                                    colorScheme="green"
                                    leftIcon={<FaDownload />}
                                    onClick={handleExport}
                                    isLoading={isExporting}
                                    borderRadius="full"
                                    shadow="md"
                                    fontSize="xs"
                                >
                                    EXPORT
                                </Button>
                            </HStack>
                        </Flex>

                        <Text fontSize="10px" color="gray.500" fontWeight="bold" noOfLines={1} opacity={0.7}>
                            SELECTED: {selectedDistrictNames || "NONE"}
                        </Text>

                        <Box position="relative">
                            <Input
                                placeholder="Search districts..."
                                value={searchDistrict}
                                onChange={(e) => setSearchDistrict(e.target.value)}
                                bg="white"
                                borderRadius="xl"
                                pl={10}
                                size="lg"
                                shadow="sm"
                            />
                            <Box position="absolute" left={4} top="50%" transform="translateY(-50%)" color="gray.400">
                                <FaSearch />
                            </Box>
                        </Box>

                        <Divider />

                        <Box flex="1" overflowY="auto" pr={2} sx={{
                            '&::-webkit-scrollbar': { width: '4px' },
                            '&::-webkit-scrollbar-track': { background: 'transparent' },
                            '&::-webkit-scrollbar-thumb': { background: 'rgba(0,0,0,0.1)', borderRadius: 'full' },
                        }}>
                            {loadingDistricts ? (
                                <Flex justify="center" p={8}><Spinner color="blue.500" /></Flex>
                            ) : (
                                <List spacing={2}>
                                    {filteredDistricts.map((d, i) => (
                                        <ListItem
                                            key={i}
                                            as={motion.div}
                                            whileHover={{ scale: 1.01, x: 2 }}
                                            p={3}
                                            bg={selectedDistrict?.path === d.path ? "blue.600" : "white"}
                                            color={selectedDistrict?.path === d.path ? "white" : "gray.700"}
                                            borderRadius="xl"
                                            cursor="pointer"
                                            onClick={() => fetchLocales(d)}
                                            shadow="sm"
                                            fontSize="sm"
                                            fontWeight="bold"
                                            transition="all 0.2s"
                                        >
                                            <HStack justify="space-between">
                                                <Text flex="1" noOfLines={1}>{d.name}</Text>
                                                <Checkbox
                                                    colorScheme="blue"
                                                    borderColor="gray.300"
                                                    isChecked={selectedDistrictIds.includes(d.id)}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        if (!d.id) {
                                                            toast({ title: "Not in database", status: "warning", size: "sm" });
                                                            return;
                                                        }
                                                        setSelectedDistrictIds(prev =>
                                                            prev.includes(d.id)
                                                                ? prev.filter(id => id !== d.id)
                                                                : [...prev, d.id]
                                                        );
                                                    }}
                                                />
                                            </HStack>
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </Box>
                    </VStack>
                </Box>

                {/* LOCALES PANEL */}
                <Box
                    flex="1"
                    bg="rgba(255, 255, 255, 0.7)"
                    backdropFilter="blur(20px)"
                    borderRadius="3xl"
                    p={8}
                    shadow="dark-lg"
                    display="flex"
                    flexDir="column"
                    border="1px solid rgba(255, 255, 255, 0.6)"
                >
                    <VStack align="stretch" spacing={6} flex="1" overflow="hidden">
                        <Flex justify="space-between" align="center">
                            <VStack align="start" spacing={0}>
                                <Text fontSize="xs" fontWeight="black" color="blue.500" letterSpacing="widest" mb={1}>
                                    AVAILABLE CONGREGATIONS
                                </Text>
                                <Text fontSize="2xl" fontWeight="black" color="gray.800" display="flex" align="center" gap={3}>
                                    <Box as="span" p={2} bg="blue.50" borderRadius="lg" color="blue.600">
                                        <FaMapMarkerAlt />
                                    </Box>
                                    {selectedDistrict ? selectedDistrict.name : 'Select a District'}
                                </Text>
                            </VStack>

                            {selectedDistrict && (
                                <Badge colorScheme="blue" variant="subtle" px={3} py={1} borderRadius="full" fontSize="xs">
                                    {filteredLocales.length} Locales Found
                                </Badge>
                            )}
                        </Flex>

                        <Box position="relative">
                            <Input
                                placeholder="Filter congregations by name..."
                                value={searchLocale}
                                onChange={(e) => setSearchLocale(e.target.value)}
                                bg="white"
                                borderRadius="2xl"
                                pl={12}
                                size="lg"
                                shadow="xl"
                                border="none"
                                _focus={{ ring: 2, ringColor: "blue.400" }}
                                isDisabled={!selectedDistrict}
                            />
                            <Box position="absolute" left={4} top="50%" transform="translateY(-50%)" color="blue.400" fontSize="lg">
                                <FaSearch />
                            </Box>
                        </Box>

                        <Divider borderColor="rgba(0,0,0,0.05)" />

                        <Box flex="1" overflowY="auto" pr={2} sx={{
                            '&::-webkit-scrollbar': { width: '6px' },
                            '&::-webkit-scrollbar-track': { background: 'transparent' },
                            '&::-webkit-scrollbar-thumb': { background: 'rgba(0,0,0,0.1)', borderRadius: 'full' },
                        }}>
                            {!selectedDistrict ? (
                                <Flex h="100%" justify="center" align="center" color="gray.400" flexDir="column" gap={6}>
                                    <motion.div
                                        animate={{
                                            y: [0, -10, 0],
                                            opacity: [0.2, 0.5, 0.2]
                                        }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                    >
                                        <FaGlobeAsia size={80} />
                                    </motion.div>
                                    <VStack spacing={1}>
                                        <Text fontWeight="bold" color="gray.500">No District Selected</Text>
                                        <Text fontSize="sm">Pick a district from the sidebar to browse locales</Text>
                                    </VStack>
                                </Flex>
                            ) : loadingLocales ? (
                                <Flex h="100%" justify="center" align="center" flexDir="column" gap={4}>
                                    <Spinner size="xl" color="blue.500" thickness="4px" speed="0.8s" />
                                    <Text fontWeight="bold" color="blue.600" letterSpacing="widest" fontSize="xs">FETCHING LOCALES...</Text>
                                </Flex>
                            ) : (
                                <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(280px, 1fr))" gap={6} p={2}>
                                    <AnimatePresence mode="popLayout">
                                        {filteredLocales.map((l, i) => (
                                            <Box
                                                key={l.slug}
                                                as={motion.div}
                                                layout
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                transition={{ duration: 0.2, delay: i * 0.03 }}
                                                whileHover={{ y: -5 }}
                                                cursor="pointer"
                                                onClick={() => fetchDetails(l)}
                                            >
                                                <Box
                                                    p={5}
                                                    bg="rgba(255, 255, 255, 0.15)"
                                                    backdropFilter="blur(15px)"
                                                    borderRadius="2xl"
                                                    shadow="lg"
                                                    border="1px solid"
                                                    borderColor="gray.50"
                                                    position="relative"
                                                    overflow="hidden"
                                                    _hover={{
                                                        borderColor: "blue.200",
                                                        shadow: "2xl",
                                                        bg: "blue.50"
                                                    }}
                                                    transition="all 0.3s"
                                                >
                                                    {/* Decorative element */}
                                                    <Box
                                                        position="absolute"
                                                        top="-10px"
                                                        right="-10px"
                                                        bg="blue.500"
                                                        opacity="0.05"
                                                        w="60px"
                                                        h="60px"
                                                        borderRadius="full"
                                                    />

                                                    <HStack spacing={4} align="start">
                                                        <Flex
                                                            p={3}
                                                            bg="blue.500"
                                                            color="white"
                                                            borderRadius="xl"
                                                            shadow="md"
                                                        >
                                                            <FaMapMarkerAlt size={16} />
                                                        </Flex>
                                                        <VStack align="start" spacing={1}>
                                                            <Text fontWeight="black" fontSize="md" color="gray.800" lineHeight="tight">
                                                                {l.name}
                                                            </Text>
                                                            <Text fontSize="xs" fontWeight="bold" color="blue.400" textTransform="uppercase" letterSpacing="tighter">
                                                                View Details & Schedule
                                                            </Text>
                                                        </VStack>
                                                    </HStack>
                                                </Box>
                                            </Box>
                                        ))}
                                    </AnimatePresence>

                                    {filteredLocales.length === 0 && (
                                        <Box gridColumn="1 / -1" py={20}>
                                            <VStack spacing={3} opacity={0.5}>
                                                <FaSearch size={40} />
                                                <Text fontWeight="bold">No results matching your search</Text>
                                            </VStack>
                                        </Box>
                                    )}
                                </Box>
                            )}
                        </Box>
                    </VStack>
                </Box>
            </Flex>

            {/* DETAILS MODAL */}
            <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl">
                <ModalOverlay backdropFilter="blur(10px)" bg="blackAlpha.700" />
                <ModalContent borderRadius="2xl" overflow="hidden" boxShadow="2xl">
                    <ModalHeader bg="blue.600" color="white" display="flex" align="center" gap={3} py={5}>
                        <FaMapMarkerAlt /> {selectedLocale?.name}
                    </ModalHeader>
                    <ModalCloseButton color="white" />
                    <ModalBody p={0} bg="gray.50">
                        {loadingDetails ? (
                            <Flex justify="center" align="center" h="400px" flexDir="column" gap={4}>
                                <Spinner size="xl" color="blue.500" thickness="4px" />
                                <Text fontWeight="bold" color="blue.900" className="animate-pulse">Scraping live data...</Text>
                            </Flex>
                        ) : localeDetails ? (
                            <Box h="70vh" overflowY="auto" p={6}>
                                <VStack align="stretch" spacing={6}>
                                    {/* Address & Navigate */}
                                    <Box bg="white" p={5} borderRadius="xl" border="1px solid" borderColor="gray.100" shadow="sm">
                                        <Text fontSize="xs" fontWeight="black" color="gray.400" mb={2} letterSpacing="wider">PHYSICAL ADDRESS</Text>
                                        <Text fontWeight="bold" color="gray.800" mb={4}>{localeDetails.address}</Text>

                                        {localeDetails.navigateUrl && (
                                            <Button
                                                as="a"
                                                href={localeDetails.navigateUrl}
                                                target="_blank"
                                                leftIcon={<FaMapMarkerAlt />}
                                                colorScheme="blue"
                                                size="md"
                                                borderRadius="full"
                                                shadow="md"
                                            >
                                                Navigate to Locale
                                            </Button>
                                        )}
                                    </Box>

                                    {/* Map Iframe */}
                                    {localeDetails.mapUrl && (
                                        <Box h="200px" borderRadius="xl" overflow="hidden" border="1px solid" borderColor="gray.200">
                                            <iframe
                                                width="100%"
                                                height="100%"
                                                frameBorder="0"
                                                style={{ border: 0 }}
                                                src={localeDetails.mapUrl}
                                                allowFullScreen
                                                title="Map"
                                            />
                                        </Box>
                                    )}

                                    {/* Schedule */}
                                    <Box bg="white" p={5} borderRadius="xl" border="1px solid" borderColor="gray.100" shadow="sm">
                                        <Text fontSize="xs" fontWeight="black" color="blue.500" mb={4} letterSpacing="wider" display="flex" align="center" gap={2}>
                                            <FaClock /> WORSHIP SERVICES
                                        </Text>
                                        <Box
                                            sx={{
                                                '.daygroup': { mb: 6, pb: 4, borderBottom: '1px solid', borderColor: 'gray.50' },
                                                '.daygroup:last-child': { borderBottom: 0 },
                                                'h6': { fontWeight: '800', color: 'blue.700', textTransform: 'uppercase', fontSize: 'xs', mb: 3 },
                                                '.chip-break': { display: 'flex', flexWrap: 'wrap', gap: 2 },
                                                '.chip': { bg: 'gray.50', border: '1px solid', borderColor: 'gray.100', px: 3, py: 1, borderRadius: 'full', fontSize: 'sm', fontWeight: '700', display: 'flex', align: 'center', gap: 2 },
                                                '.subchip': { fontSize: '10px', px: 2, py: 0.5, borderRadius: 'md', fontWeight: '800' },
                                                '.ENGLISH': { bg: 'blue.500', color: 'white' },
                                                '.CWS': { bg: 'orange.500', color: 'white' }
                                            }}
                                            dangerouslySetInnerHTML={{ __html: localeDetails.schedule }}
                                        />
                                    </Box>

                                    {/* Contact */}
                                    <Box bg="indigo.50" p={5} borderRadius="xl" border="1px solid" borderColor="indigo.100">
                                        <Text fontSize="xs" fontWeight="black" color="indigo.400" mb={3} letterSpacing="wider" display="flex" align="center" gap={2}>
                                            <FaPhoneAlt /> CONTACT INFORMATION
                                        </Text>
                                        <Box
                                            sx={{
                                                'h6': { fontSize: 'sm', fontWeight: '800', mt: 4, mb: 1, color: 'gray.700' },
                                                'h6:first-of-type': { mt: 0 },
                                                '.material-icons': { verticalAlign: 'middle', fontSize: '18px', mr: 2, color: 'indigo.300' }
                                            }}
                                            dangerouslySetInnerHTML={{ __html: localeDetails.contact }}
                                        />
                                    </Box>
                                </VStack>
                            </Box>
                        ) : (
                            <Flex justify="center" p={10}><Text color="gray.500">Failed to load details.</Text></Flex>
                        )}
                    </ModalBody>
                </ModalContent>
            </Modal>
            {/* EXPORT PROGRESS MODAL */}
            <Modal isOpen={isExportOpen} onClose={() => { }} isCentered closeOnOverlayClick={false}>
                <ModalOverlay backdropFilter="blur(20px)" />
                <ModalContent borderRadius="3xl" p={8} shadow="2xl" border="1px solid" borderColor="blue.100">
                    <VStack spacing={6}>
                        <Box position="relative">
                            <CircularProgress value={exportProgress} size="120px" thickness="8px" color="blue.500">
                                <CircularProgressLabel fontWeight="black" fontSize="xl">{exportProgress}%</CircularProgressLabel>
                            </CircularProgress>
                            {exportProgress === 100 && (
                                <Box position="absolute" top="0" right="0" bg="green.500" color="white" borderRadius="full" p={1} shadow="lg">
                                    <FaDownload size={12} />
                                </Box>
                            )}
                        </Box>

                        <VStack spacing={2} align="center">
                            <Text fontWeight="black" fontSize="xl" color="blue.900" letterSpacing="tight">
                                {exportStatus === "Export Complete!" ? "DISTRICT EXPORT READY" : "GENERATING DIRECTORY"}
                            </Text>
                            <Text fontSize="sm" color="gray.500" fontWeight="bold" textAlign="center">
                                {exportStatus}
                            </Text>
                        </VStack>

                        <Progress value={exportProgress} w="100%" borderRadius="full" size="sm" colorScheme="blue" hasStripe isAnimated />
                    </VStack>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default DirectoryManager;
