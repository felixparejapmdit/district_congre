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
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    VStack,
    Center,
    Progress,
    CircularProgress,
    CircularProgressLabel,
    Portal,
    Badge
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "../styles.css";
import { FaCheckSquare, FaRegSquare, FaDownload, FaEraser, FaBars, FaMapMarkerAlt, FaGlobeAsia, FaCog, FaBuilding, FaChurch, FaFileExcel, FaCloudDownloadAlt, FaFileAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

// 📌 Custom Marker Icon
const markerIcon = new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
});

// 🗺️ Component to control map panning/zooming
const MapFlyTo = ({ district }) => {
    const map = useMap();
    useEffect(() => {
        if (district?.latitude && district?.longitude) {
            const zoomLevel = district.isCongregation ? 16 : 10;
            map.flyTo([district.latitude, district.longitude], zoomLevel, {
                animate: true,
                duration: 1.5
            });
        }
    }, [district, map]);
    return null;
};

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
    handleExportClick,
    selectedDistrictIds,
    isExporting,
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
                <Button
                    size="sm"
                    colorScheme="green"
                    leftIcon={<FaDownload />}
                    onClick={handleExportClick}
                    isDisabled={selectedDistrictIds.length === 0}
                    isLoading={isExporting}
                >
                    Export
                </Button>
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
    // --- State ---
    const [districts, setDistricts] = useState([]);
    const [selectedDistrictIds, setSelectedDistrictIds] = useState([]);
    const [mapFocusTarget, setMapFocusTarget] = useState(null);
    const [localCongregations, setLocalCongregations] = useState([]);
    const [allCongregations, setAllCongregations] = useState([]);

    // 🔍 SEPARATE SEARCH STATES
    const [searchDistrict, setSearchDistrict] = useState("");
    const [searchCongregation, setSearchCongregation] = useState("");

    const [loadingCongregations, setLoadingCongregations] = useState(false);
    const [selectedCongregation, setSelectedCongregation] = useState(null);
    const [congregationSchedule, setCongregationSchedule] = useState("");
    const [loadingSchedule, setLoadingSchedule] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportStatus, setExportStatus] = useState("");
    const [exportProgress, setExportProgress] = useState(0);
    const [exportResults, setExportResults] = useState([]);
    const [exportDownloadUrl, setExportDownloadUrl] = useState("");
    const [isExportSuccess, setIsExportSuccess] = useState(false);
    const [previousCongregations, setPreviousCongregations] = useState([]);

    // --- Hooks ---
    const { isOpen: isScheduleOpen, onOpen: openSchedule, onClose: closeSchedule } = useDisclosure();
    const { isOpen: isConfirmOpen, onOpen: openConfirm, onClose: closeConfirm } = useDisclosure();
    const { isOpen: isMobileMenuOpen, onOpen: openMobileMenu, onClose: closeMobileMenu } = useDisclosure();

    // Responsive Check
    const isMobile = useBreakpointValue({ base: true, md: false });

    // API Config
    const API_URL = process.env.REACT_APP_API_URL || "";
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
                if (updatedDistricts.length > 0) {
                    setMapFocusTarget(updatedDistricts[0]);
                }

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
            setMapFocusTarget(district);
        }

        setSelectedDistrictIds(newSelectedIds);
        fetchSelectedCongregations(newSelectedIds);
    };

    const handleDistrictClick = (district) => {
        setMapFocusTarget(district);
        // User Logic: Clicking row should select it (for Export visibility)
        // Check if already selected
        if (!selectedDistrictIds.includes(district.id)) {
            // Add to selection
            const newSelectedIds = [...selectedDistrictIds, district.id];
            setSelectedDistrictIds(newSelectedIds);
            fetchSelectedCongregations(newSelectedIds);
        } else {
            // If already selected, maybe just fetch/refresh? 
            // Or should it deselect? 
            // Usually row click = select. To deselect, click checkbox. 
            // Let's just keep it selected and ensure we fetch.
            fetchSelectedCongregations(selectedDistrictIds);
        }

        if (isMobile) closeMobileMenu();
    };

    const handleCongregationClick = async (cong) => {
        // Save current list if we are about to replace it via global search logic
        if (searchCongregation && localCongregations.length > 1) {
            setPreviousCongregations(localCongregations);
        }

        setSelectedCongregation(cong);
        setMapFocusTarget(cong);
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
        // If we were in a global search result view, and have a saved previous list, restore it
        if (previousCongregations.length > 0) {
            setLocalCongregations(previousCongregations);
            setPreviousCongregations([]);
        }
    };

    const handleGlobalSearchResultClick = (cong) => {
        // If we found it via search, put it in the list
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

    // Export Logic
    const handleExportClick = () => {
        if (selectedDistrictIds.length === 0) return alert("Select at least one district.");
        openConfirm();
    };

    const confirmExport = async () => {
        closeConfirm();
        setIsExporting(true);
        setIsExportSuccess(false);
        setExportProgress(0);
        setExportStatus("Initializing...");
        setExportDownloadUrl("");

        try {
            // 1. Get the list so we know what we are exporting
            const listRes = await axios.get(`${API_URL}/api/local-congregations-multi?district_ids=${selectedDistrictIds.join(',')}`);
            const total = listRes.data.length;

            if (total === 0) {
                alert("No congregations found.");
                setIsExporting(false);
                return;
            }

            setExportResults(listRes.data);

            // 2. Start the real backend export
            const exportPromise = axios.post(`${API_URL}/api/export-schedule`, { districtIds: selectedDistrictIds }, { responseType: 'blob' });

            // 3. Simulate progress
            for (let i = 0; i < total; i++) {
                const cong = listRes.data[i];
                setExportStatus(`[${i + 1}/${total}] Scraping: ${cong.name}`);
                setExportProgress(Math.floor((i / total) * 95));

                await new Promise(r => setTimeout(r, total > 50 ? 300 : 700));
            }

            setExportStatus("Finalizing Excel file...");
            setExportProgress(98);

            // 4. Await the actual result
            const response = await exportPromise;

            const url = window.URL.createObjectURL(new Blob([response.data]));
            setExportDownloadUrl(url);

            setExportProgress(100);
            setExportStatus("Success!");
            setIsExportSuccess(true);

        } catch (e) {
            console.error("Export error:", e);
            alert("Export failed.");
            setIsExporting(false);
        }
    };

    const handleDownloadExport = () => {
        if (!exportDownloadUrl) return;
        const link = document.createElement('a');
        link.href = exportDownloadUrl;
        link.setAttribute('download', `INC_Schedule_${Date.now()}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };



    const selectedDistrictNames = districts
        .filter(d => selectedDistrictIds.includes(d.id))
        .map(d => d.name)
        .join(', ');

    // --- Main Render ---
    return (
        <Box w="100vw" h="100vh" position="relative" overflow="hidden" bg="gray.100">

            {/* 🗺️ MAP */}
            <Box position="absolute" top="0" left="0" w="100%" h="100%" zIndex="0">
                <MapContainer
                    center={[12.8797, 121.774]}
                    zoom={6}
                    style={{ width: "100%", height: "100%" }}
                    zoomControl={false}
                >
                    <TileLayer
                        attribution='&copy; OpenStreetMap'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapFlyTo district={mapFocusTarget} />

                    {displayedCongregations
                        .filter((cong) => cong.latitude && cong.longitude)
                        .map((cong) => (
                            <Marker
                                key={cong.id}
                                position={[cong.latitude, cong.longitude]}
                                icon={markerIcon}
                                eventHandlers={{
                                    click: () => handleCongregationClick(cong),
                                }}
                            >
                                <Popup>
                                    <Text fontWeight="bold">{cong.name}</Text>
                                </Popup>
                            </Marker>
                        ))}
                </MapContainer>
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
                            handleExportClick={handleExportClick}
                            selectedDistrictIds={selectedDistrictIds}
                            isExporting={isExporting}
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

            {/* 💻 DESKTOP: Left Sidebar (Districts) */}
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
                        handleExportClick={handleExportClick}
                        selectedDistrictIds={selectedDistrictIds}
                        isExporting={isExporting}
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

            {/* 💻 DESKTOP: Right Panel (Congregations) */}
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

            {/* ⚙️ SETTINGS BUTTON */}
            <Box position="absolute" top={4} right={4} zIndex="1000">
                <Menu>
                    <MenuButton
                        as={IconButton}
                        aria-label="Options"
                        icon={<FaCog />}
                        variant="solid"
                        colorScheme="blue"
                        size="lg"
                        borderRadius="full"
                        boxShadow="lg"
                    />
                    <MenuList zIndex="1001">
                        <MenuItem icon={<FaBuilding />} onClick={() => navigate('/districts')}>
                            Manage Districts
                        </MenuItem>
                        <MenuItem icon={<FaChurch />} onClick={() => navigate('/local-congregations')}>
                            Manage Local Congregations
                        </MenuItem>
                    </MenuList>
                </Menu>
            </Box>

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

            {/* ⚠️ EXPORT CONFIRM MODAL */}
            <Modal isOpen={isConfirmOpen} onClose={closeConfirm} isCentered>
                <ModalOverlay />
                <ModalContent borderRadius="xl">
                    <ModalHeader>Confirm Export</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Text>Export schedule for <b>{selectedDistrictIds.length}</b> districts?</Text>
                        <Flex mt={6} gap={3} mb={2}>
                            <Button flex="1" onClick={closeConfirm}>Cancel</Button>
                            <Button flex="1" colorScheme="blue" onClick={confirmExport} isLoading={isExporting}>
                                Export
                            </Button>
                        </Flex>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* 🚀 EXPORT PROGRESS OVERLAY */}
            <AnimatePresence>
                {isExporting && (
                    <Portal>
                        <Box
                            as={motion.div}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            position="fixed"
                            top="0"
                            left="0"
                            right="0"
                            bottom="0"
                            bg="rgba(0, 0, 0, 0.7)"
                            backdropFilter="blur(8px)"
                            zIndex="2000"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            p={4}
                        >
                            <VStack
                                as={motion.div}
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                bg="white"
                                p={isExportSuccess ? 0 : 8}
                                borderRadius="2xl"
                                shadow="2xl"
                                spacing={isExportSuccess ? 0 : 6}
                                w="full"
                                maxW={isExportSuccess ? "500px" : "400px"}
                                textAlign="center"
                                overflow="hidden"
                                position="relative"
                            >
                                {!isExportSuccess ? (
                                    <>
                                        <CircularProgress
                                            value={exportProgress}
                                            color="blue.500"
                                            size="120px"
                                            thickness="8px"
                                            capIsRound
                                        >
                                            <CircularProgressLabel fontSize="xl" fontWeight="bold">
                                                {exportProgress}%
                                            </CircularProgressLabel>
                                        </CircularProgress>

                                        <VStack spacing={2}>
                                            <Text fontWeight="bold" fontSize="lg">Generating Export</Text>
                                            <Text fontSize="sm" color="gray.500">
                                                {exportStatus}
                                            </Text>
                                        </VStack>

                                        <Progress
                                            value={exportProgress}
                                            size="xs"
                                            width="100%"
                                            borderRadius="full"
                                            colorScheme="blue"
                                            isIndeterminate={exportProgress < 10 || exportProgress > 90}
                                        />

                                        <Text fontSize="xs" color="gray.400">
                                            Please do not close your browser.
                                        </Text>
                                    </>
                                ) : (
                                    <Box w="full" textAlign="left">
                                        <Box bg="blue.600" p={6} color="white" position="relative">
                                            <HStack spacing={4}>
                                                <Box bg="whiteAlpha.300" p={3} borderRadius="lg">
                                                    <FaFileExcel size="24px" />
                                                </Box>
                                                <Box>
                                                    <Text fontWeight="bold" fontSize="xl">Export Ready</Text>
                                                    <Text fontSize="sm" opacity={0.9}>{exportResults.length} congregations processed</Text>
                                                </Box>
                                            </HStack>
                                            <IconButton
                                                icon={<FaBars style={{ transform: 'rotate(90deg)' }} />}
                                                position="absolute"
                                                top={4}
                                                right={4}
                                                variant="ghost"
                                                color="white"
                                                size="sm"
                                                aria-label="Close"
                                                onClick={() => setIsExporting(false)}
                                            />
                                        </Box>

                                        <Box p={6}>
                                            <Text fontSize="sm" fontWeight="bold" color="gray.500" mb={3} display="flex" alignItems="center" gap={2}>
                                                <FaFileAlt /> LIST OF CONGREGATIONS
                                            </Text>
                                            <Box maxH="250px" overflowY="auto" pr={2} css={{
                                                '&::-webkit-scrollbar': { width: '4px' },
                                                '&::-webkit-scrollbar-thumb': { background: '#CBD5E0', borderRadius: '4px' },
                                            }}>
                                                <List spacing={2}>
                                                    {exportResults.map(cong => (
                                                        <ListItem
                                                            key={cong.id}
                                                            fontSize="xs"
                                                            p={2}
                                                            bg="gray.50"
                                                            borderRadius="md"
                                                            display="flex"
                                                            justifyContent="space-between"
                                                            alignItems="center"
                                                        >
                                                            <Text fontWeight="medium" noOfLines={1}>{cong.name}</Text>
                                                            <Badge size="sm" variant="subtle" colorScheme="blue">OK</Badge>
                                                        </ListItem>
                                                    ))}
                                                </List>
                                            </Box>

                                            <VStack mt={6} spacing={3}>
                                                <Button
                                                    w="full"
                                                    colorScheme="blue"
                                                    leftIcon={<FaCloudDownloadAlt />}
                                                    onClick={handleDownloadExport}
                                                    size="lg"
                                                    shadow="md"
                                                >
                                                    Open Excel File
                                                </Button>
                                                <Button w="full" variant="ghost" onClick={() => setIsExporting(false)}>
                                                    Close
                                                </Button>
                                            </VStack>
                                        </Box>
                                    </Box>
                                )}
                            </VStack>
                        </Box>
                    </Portal>
                )}

            </AnimatePresence>

        </Box>
    );
};

export default Globe;