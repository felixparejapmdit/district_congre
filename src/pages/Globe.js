import React, { useEffect, useState, useMemo } from "react";
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
    Checkbox,
    HStack,
    IconButton,
    Tooltip,
    Drawer,
    DrawerBody,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
    useBreakpointValue,
    Divider,
    Flex,
    VStack,
    Progress,
    CircularProgress,
    CircularProgressLabel,
    Portal,
    Badge,
    useToast,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles.css";
import { FaCheckSquare, FaDownload, FaEraser, FaBars, FaMapMarkerAlt, FaGlobeAsia, FaFileExcel, FaCloudDownloadAlt, FaFileAlt } from "react-icons/fa";



// --- EXTRACTED COMPONENTS (Fixes Focus Issue) ---

const CongregationListItem = ({ cong, isGlobalResult, onClick }) => (
    <ListItem
        as={motion.li}
        layout
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        whileHover={{ scale: 1.02, x: 4 }}
        whileTap={{ scale: 0.98 }}
        p={3}
        bg="white"
        borderRadius="lg"
        boxShadow="sm"
        cursor="pointer"
        _hover={{ bg: "blue.50", boxShadow: "md" }}
        transition="all 0.2s"
        onClick={() => onClick(cong)}
    >
        <HStack>
            <FaMapMarkerAlt color="#E53E3E" />
            <Box>
                <Text fontWeight="bold" fontSize="sm">{cong.name}</Text>
                {isGlobalResult && <Badge colorScheme="blue" fontSize="2xs">Global Result</Badge>}
            </Box>
        </HStack>
    </ListItem>
);

const SidebarContent = ({
    searchDistrict,
    setSearchDistrict,
    toggleSelectAllVisible,
    handleClearSelection,
    selectedDistrictIds,
    filteredDistricts,
    toggleDistrictSelection,
    handleDistrictClick,
    isMobile,
    localCongregations,
    searchCongregation,
    setSearchCongregation,
    displayedCongregations,
    handleCongregationClick,
    selectedDistrictNames
}) => (
    <Flex direction="column" h="100%">
        {/* Header / Search */}
        <Box p={4} pb={2}>
            <Text fontSize="2xl" fontWeight="bold" mb={4} display="flex" alignItems="center">
                <FaGlobeAsia style={{ marginRight: '10px' }} /> Directory
            </Text>

            {/* DISTRICT SEARCH */}
            <Flex gap={2} mb={2}>
                <Input
                    placeholder="Search district..."
                    value={searchDistrict}
                    onChange={(e) => setSearchDistrict(e.target.value)}
                    bg="white"
                    borderRadius="full"
                    boxShadow="sm"
                />
            </Flex>

            <Flex justify="space-between" align="center" mt={2}>
                <HStack>
                    <Tooltip label="Select All Visible">
                        <IconButton
                            size="sm"
                            icon={<FaCheckSquare />}
                            onClick={toggleSelectAllVisible}
                            variant="ghost"
                        />
                    </Tooltip>
                    <Tooltip label="Clear Selection">
                        <IconButton
                            size="sm"
                            icon={<FaEraser />}
                            onClick={handleClearSelection}
                            isDisabled={selectedDistrictIds.length === 0}
                            variant="ghost"
                            colorScheme="red"
                        />
                    </Tooltip>
                </HStack>
            </Flex>

            {/* Selected Districts Text */}
            <Text mt="2" fontSize="xs" color="gray.500" noOfLines={2}>
                Selected: <b>{selectedDistrictNames || 'None'}</b>
            </Text>
        </Box>

        <Divider />

        <Box flex="1" overflowY="auto" p={2}>
            {/* Mobile: Show Integrated Congregation List if needed */}
            {isMobile && (localCongregations.length > 0 || searchCongregation) && (
                <Box mb={4} p={2} bg="blue.50" borderRadius="md">
                    <Text fontSize="xs" fontWeight="bold" color="blue.600" mb={1}>CONGREGATIONS</Text>
                    <Input
                        placeholder="Find congregation..."
                        value={searchCongregation}
                        onChange={(e) => setSearchCongregation(e.target.value)}
                        bg="white"
                        size="sm"
                        mb={2}
                    />
                    <List spacing={2}>
                        {displayedCongregations.map(cong => (
                            <CongregationListItem
                                key={cong.id}
                                cong={cong}
                                isGlobalResult={!!searchCongregation}
                                onClick={handleCongregationClick}
                            />
                        ))}
                        {displayedCongregations.length === 0 && <Text fontSize="xs">No results.</Text>}
                    </List>
                </Box>
            )}

            <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={2} px={2}>DISTRICTS</Text>
            <List spacing={2}>
                {filteredDistricts.map(district => {
                    const isSelected = selectedDistrictIds.includes(district.id);
                    return (
                        <ListItem
                            key={district.id}
                            p={3}
                            bg={isSelected ? "blue.600" : "white"}
                            color={isSelected ? "white" : "gray.800"}
                            borderRadius="lg"
                            boxShadow={isSelected ? "md" : "sm"}
                            cursor="pointer"
                            _hover={{ bg: isSelected ? "blue.500" : "gray.50" }}
                            transition="all 0.2s"
                            onClick={() => handleDistrictClick(district)}
                        >
                            <Flex align="center" justify="space-between">
                                <Checkbox
                                    isChecked={isSelected}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        toggleDistrictSelection(district);
                                    }}
                                    colorScheme="whiteAlpha"
                                    iconColor={isSelected ? "white" : undefined}
                                    mr={3}
                                    size="lg"
                                />
                                <Box flex="1">
                                    <Text fontWeight="bold" fontSize="sm">{district.name}</Text>
                                </Box>
                            </Flex>
                        </ListItem>
                    );
                })}
            </List>
        </Box>
    </Flex>
);

const RightPanelContent = ({
    searchCongregation,
    setSearchCongregation,
    localCongregations,
    displayedCongregations,
    handleCongregationClick,
    searchDistrict // Just to trigger some updates if needed
}) => (
    <Flex direction="column" h="100%">
        <Box p={4} bg="white" borderBottom="1px solid" borderColor="gray.100">
            <Text fontSize="lg" fontWeight="bold" color="blue.600" mb={2}>
                Congregations
            </Text>

            {/* CONGREGATION SEARCH */}
            <Input
                placeholder="Search congregation..."
                value={searchCongregation}
                onChange={(e) => setSearchCongregation(e.target.value)}
                bg="gray.50"
                size="sm"
                borderRadius="md"
            />
        </Box>

        <Box flex="1" overflowY="auto" p={2}>
            {displayedCongregations.length === 0 ? (
                <Flex h="100%" align="center" justify="center" direction="column" color="gray.400" p={4} textAlign="center">
                    <FaMapMarkerAlt size="24px" style={{ marginBottom: '8px' }} />
                    <Text fontSize="sm">
                        {searchCongregation
                            ? "No congregations found."
                            : "Select a district to view congregations."}
                    </Text>
                </Flex>
            ) : (
                <List spacing={2}>
                    <AnimatePresence mode="popLayout">
                        {displayedCongregations.map(cong => (
                            <CongregationListItem
                                key={cong.id}
                                cong={cong}
                                isGlobalResult={!!searchCongregation}
                                onClick={handleCongregationClick}
                            />
                        ))}
                    </AnimatePresence>
                </List>
            )}
        </Box>
    </Flex>
);

// --- MAIN COMPONENT ---

const Globe = () => {
    const navigate = useNavigate();
    const toast = useToast();
    // --- State ---
    const [districts, setDistricts] = useState([]);
    const [selectedDistrictIds, setSelectedDistrictIds] = useState([]);
    const [localCongregations, setLocalCongregations] = useState([]);
    const [allCongregations, setAllCongregations] = useState([]);

    // 🔍 SEPARATE SEARCH STATES
    const [searchDistrict, setSearchDistrict] = useState("");
    const [searchCongregation, setSearchCongregation] = useState("");

    const [loadingCongregations, setLoadingCongregations] = useState(false);
    const [selectedCongregation, setSelectedCongregation] = useState(null);
    const [congregationSchedule, setCongregationSchedule] = useState("");
    const [loadingSchedule, setLoadingSchedule] = useState(false);
    const [previousCongregations, setPreviousCongregations] = useState([]);

    // --- Hooks ---
    const { isOpen: isScheduleOpen, onOpen: openSchedule, onClose: closeSchedule } = useDisclosure();
    const { isOpen: isMobileMenuOpen, onOpen: openMobileMenu, onClose: closeMobileMenu } = useDisclosure();

    // Responsive Check
    const isMobile = useBreakpointValue({ base: true, md: false });

    // API Config
    const envApiUrl = process.env.REACT_APP_API_URL || "";
    const API_URL = envApiUrl === "/" ? "" : envApiUrl;
    const SCRAPER_URL = `${API_URL}/api/scrape`;

    // --- Computed Data ---

    // 1. Filter Districts (Left Panel)
    const filteredDistricts = useMemo(() => {
        if (!searchDistrict) return districts;
        return districts.filter((d) => d.name.toLowerCase().includes(searchDistrict.toLowerCase()));
    }, [districts, searchDistrict]);

    // 2. Filter Congregations (Right Panel)
    const displayedCongregations = useMemo(() => {
        if (searchCongregation) {
            return allCongregations.filter(c => c.name.toLowerCase().includes(searchCongregation.toLowerCase())).slice(0, 15);
        }
        return localCongregations;
    }, [searchCongregation, allCongregations, localCongregations]);


    // --- Effects ---

    // Initial Load
    useEffect(() => {
        const fetchAllData = async (retryCount = 3) => {
            try {
                // 1. Fetch Districts
                const distResponse = await axios.get(`${API_URL}/api/districts`);
                const updatedDistricts = distResponse.data.map((district) => ({
                    ...district,
                    latitude: district.latitude || 12.8797,
                    longitude: district.longitude || 121.774,
                    isCongregation: false,
                }));
                setDistricts(updatedDistricts);

                // 2. Fetch All Congregations (for search)
                const congResponse = await axios.get(`${API_URL}/api/all-congregations`);
                setAllCongregations(congResponse.data.map(c => ({
                    ...c,
                    latitude: c.latitude || 12.8797,
                    longitude: c.longitude || 121.774,
                    isCongregation: true
                })));

            } catch (error) {
                if (retryCount > 0) setTimeout(() => fetchAllData(retryCount - 1), 1000);
            }
        };
        fetchAllData();
    }, [API_URL]);

    // --- Actions ---

    const fetchSelectedCongregations = async (ids) => {
        // Clear congregation search when selecting districts to show the new list
        if (searchCongregation) setSearchCongregation("");

        if (ids.length === 0) {
            setLocalCongregations([]);
            setLoadingCongregations(false);
            return;
        }

        setLoadingCongregations(true);
        try {
            const response = await axios.get(`${API_URL}/api/local-congregations-multi?district_ids=${ids.join(',')}`);
            const data = response.data.map(c => ({ ...c, isCongregation: true }));
            setLocalCongregations(data);
        } catch (error) {
            console.error("Error loading congregations", error);
        } finally {
            setLoadingCongregations(false);
        }
    };

    const toggleDistrictSelection = (district) => {
        const isSelected = selectedDistrictIds.includes(district.id);
        let newSelectedIds;

        if (isSelected) {
            newSelectedIds = selectedDistrictIds.filter((id) => id !== district.id);
        } else {
            newSelectedIds = [...selectedDistrictIds, district.id];
        }

        setSelectedDistrictIds(newSelectedIds);
        fetchSelectedCongregations(newSelectedIds);
    };

    const handleDistrictClick = (district) => {
        // User Logic: Clicking row should select it
        if (!selectedDistrictIds.includes(district.id)) {
            const newSelectedIds = [...selectedDistrictIds, district.id];
            setSelectedDistrictIds(newSelectedIds);
            fetchSelectedCongregations(newSelectedIds);
        } else {
            fetchSelectedCongregations(selectedDistrictIds);
        }

        if (isMobile) closeMobileMenu();
    };

    const handleCongregationClick = async (cong) => {
        if (searchCongregation && localCongregations.length > 1) {
            setPreviousCongregations(localCongregations);
        }

        setSelectedCongregation(cong);
        setCongregationSchedule("");
        handleGlobalSearchResultClick(cong);
        setLoadingSchedule(true);
        openSchedule();

        try {
            const congUrlSegment = cong.name.toLowerCase().replace(/\s+/g, "-").replace(/[.,]/g, "").replace(/'/g, "");
            const response = await axios.get(`${SCRAPER_URL}/${congUrlSegment}`);
            setCongregationSchedule(response.data.schedule);
        } catch (error) {
            setCongregationSchedule("<p>Failed to load schedule.</p>");
        } finally {
            setLoadingSchedule(false);
        }
    };

    const handleCloseSchedule = () => {
        closeSchedule();
        if (previousCongregations.length > 0) {
            setLocalCongregations(previousCongregations);
            setPreviousCongregations([]);
        }
    };

    const handleGlobalSearchResultClick = (cong) => {
        setLocalCongregations([cong]);
        if (isMobile) closeMobileMenu();
    };

    const toggleSelectAllVisible = () => {
        const visibleIds = filteredDistricts.map(d => d.id);
        const allSelected = visibleIds.every(id => selectedDistrictIds.includes(id));

        let newIds;
        if (allSelected) {
            newIds = selectedDistrictIds.filter(id => !visibleIds.includes(id));
        } else {
            newIds = [...new Set([...selectedDistrictIds, ...visibleIds])];
        }
        setSelectedDistrictIds(newIds);
        fetchSelectedCongregations(newIds);
    };

    const handleClearSelection = () => {
        setSelectedDistrictIds([]);
        setLocalCongregations([]);
    };

    const selectedDistrictNames = districts
        .filter(d => selectedDistrictIds.includes(d.id))
        .map(d => d.name)
        .join(', ');

    // --- Main Render ---
    return (
        <Box w="100vw" h="100vh" position="relative" overflow="hidden" bg="gray.100">

            {/* 🌍 BACKGROUND IMAGE */}
            <Box
                position="absolute"
                top="0"
                left="0"
                w="100%"
                h="100%"
                zIndex="0"
                backgroundImage="url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')"
                backgroundSize="cover"
                backgroundPosition="center"
                filter="brightness(0.6)"
            >
                <Box
                    w="100%"
                    h="100%"
                    bgGradient="radial(circle at center, transparent, rgba(0,0,0,0.4))"
                />
            </Box>

            {/* 📱 MOBILE: Menu Button */}
            {isMobile && (
                <IconButton
                    icon={<FaBars />}
                    position="absolute"
                    top={4}
                    left={4}
                    zIndex="1000"
                    colorScheme="blue"
                    size="lg"
                    borderRadius="full"
                    shadow="xl"
                    onClick={openMobileMenu}
                    aria-label="Open Menu"
                />
            )}

            {/* 📱 MOBILE: Drawer */}
            <Drawer isOpen={isMobileMenuOpen} placement="left" onClose={closeMobileMenu} size="full">
                <DrawerOverlay />
                <DrawerContent bg="gray.50">
                    <DrawerCloseButton zIndex="10" />
                    <DrawerBody p={0}>
                        <SidebarContent
                            searchDistrict={searchDistrict}
                            setSearchDistrict={setSearchDistrict}
                            toggleSelectAllVisible={toggleSelectAllVisible}
                            handleClearSelection={handleClearSelection}
                            selectedDistrictIds={selectedDistrictIds}
                            filteredDistricts={filteredDistricts}
                            toggleDistrictSelection={toggleDistrictSelection}
                            handleDistrictClick={handleDistrictClick}
                            isMobile={isMobile}
                            localCongregations={localCongregations}
                            searchCongregation={searchCongregation}
                            setSearchCongregation={setSearchCongregation}
                            displayedCongregations={displayedCongregations}
                            handleCongregationClick={handleCongregationClick}
                            selectedDistrictNames={selectedDistrictNames}
                        />
                    </DrawerBody>
                </DrawerContent>
            </Drawer>

            {/* 💻 DESKTOP: Left Sidebar */}
            {!isMobile && (
                <Box
                    position="absolute"
                    top={6}
                    left={6}
                    bottom={6}
                    width="350px"
                    bg="rgba(255, 255, 255, 0.9)"
                    backdropFilter="blur(12px)"
                    borderRadius="2xl"
                    boxShadow="2xl"
                    zIndex="1000"
                    overflow="hidden"
                    border="1px solid rgba(255, 255, 255, 0.5)"
                >
                    <SidebarContent
                        searchDistrict={searchDistrict}
                        setSearchDistrict={setSearchDistrict}
                        toggleSelectAllVisible={toggleSelectAllVisible}
                        handleClearSelection={handleClearSelection}
                        selectedDistrictIds={selectedDistrictIds}
                        filteredDistricts={filteredDistricts}
                        toggleDistrictSelection={toggleDistrictSelection}
                        handleDistrictClick={handleDistrictClick}
                        isMobile={isMobile}
                        localCongregations={localCongregations}
                        searchCongregation={searchCongregation}
                        setSearchCongregation={setSearchCongregation}
                        displayedCongregations={displayedCongregations}
                        handleCongregationClick={handleCongregationClick}
                        selectedDistrictNames={selectedDistrictNames}
                    />
                </Box>
            )}

            {/* 💻 DESKTOP: Right Panel */}
            {!isMobile && (localCongregations.length > 0 || searchCongregation) && (
                <Box
                    position="absolute"
                    top={6}
                    right={6}
                    bottom={6}
                    width="300px"
                    bg="rgba(255, 255, 255, 0.9)"
                    backdropFilter="blur(12px)"
                    borderRadius="2xl"
                    boxShadow="2xl"
                    zIndex="1000"
                    overflow="hidden"
                    border="1px solid rgba(255, 255, 255, 0.5)"
                >
                    <RightPanelContent
                        searchCongregation={searchCongregation}
                        setSearchCongregation={setSearchCongregation}
                        localCongregations={localCongregations}
                        displayedCongregations={displayedCongregations}
                        handleCongregationClick={handleCongregationClick}
                        searchDistrict={searchDistrict}
                    />
                </Box>
            )}

            {/* 🗓️ SCHEDULE MODAL */}
            <Modal isOpen={isScheduleOpen} onClose={handleCloseSchedule} isCentered blockScrollOnMount={false}>
                <ModalOverlay backdropFilter="blur(5px)" />
                <ModalContent
                    borderRadius="2xl"
                    overflow="hidden"
                    maxW={{ base: "95vw", md: "600px" }}
                    mx={{ base: 2, md: 0 }}
                    h={{ base: "80vh", md: "auto" }}
                    maxH="85vh"
                    shadow="2xl"
                >
                    <ModalHeader bg="blue.600" color="white" py={3} fontSize="lg">
                        {selectedCongregation?.name}
                    </ModalHeader>
                    <ModalCloseButton color="white" top={2} />
                    <ModalBody p={0} bg="white" display="flex" flexDirection="column">
                        <Box flex="1" overflowY="auto" p={6}>
                            {loadingSchedule ? (
                                <Flex justify="center" align="center" h="200px">
                                    <Spinner size="xl" color="blue.500" thickness="4px" />
                                </Flex>
                            ) : (
                                <Box
                                    className="schedule-content"
                                    dangerouslySetInnerHTML={{ __html: congregationSchedule || '<p>No schedule available.</p>' }}
                                    sx={{
                                        'table': { width: '100%', borderCollapse: 'collapse', mt: 2, borderRadius: 'lg', overflow: 'hidden' },
                                        'th, td': { border: '1px solid #E2E8F0', p: 3, fontSize: 'sm' },
                                        'th': { bg: 'blue.50', fontWeight: 'bold', color: 'blue.700', textAlign: 'left' },
                                        'tr:hover': { bg: 'gray.50' }
                                    }}
                                />
                            )}
                        </Box>
                        <Box borderTop="1px solid" borderColor="gray.100" p={3} bg="gray.50">
                            <Text fontSize="xs" color="gray.500" textAlign="center" fontStyle="italic">
                                * Schedules are subject to change. Confirm with local administration.
                            </Text>
                        </Box>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default Globe;