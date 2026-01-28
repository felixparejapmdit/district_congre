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
} from "@chakra-ui/react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "../styles.css";
import { FaCheckSquare, FaRegSquare, FaDownload, FaEraser, FaBars, FaMapMarkerAlt, FaGlobeAsia } from "react-icons/fa";

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
        p={3}
        bg="white"
        borderRadius="lg"
        boxShadow="sm"
        cursor="pointer"
        _hover={{ bg: "blue.50", transform: "translateY(-1px)", boxShadow: "md" }}
        transition="all 0.2s"
        onClick={() => onClick(cong)}
    >
        <HStack>
            <FaMapMarkerAlt color="#E53E3E" />
            <Box>
                <Text fontWeight="bold" fontSize="sm">{cong.name}</Text>
                {isGlobalResult && <Text fontSize="xs" color="gray.500">Global Search Result</Text>}
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
                    {displayedCongregations.map(cong => (
                        <CongregationListItem
                            key={cong.id}
                            cong={cong}
                            isGlobalResult={!!searchCongregation}
                            onClick={handleCongregationClick}
                        />
                    ))}
                </List>
            )}
        </Box>
    </Flex>
);

// --- MAIN COMPONENT ---

const Globe = () => {
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
        setSelectedCongregation(cong);
        setMapFocusTarget(cong); // Zoom in
        setCongregationSchedule("");
        handleGlobalSearchResultClick(cong); // Ensures map list is updated
        setLoadingSchedule(true);
        openSchedule();

        try {
            const congUrlSegment = cong.name.replace(/\s+/g, "-").replace(/[.,]/g, "").replace(/'/g, "");
            const response = await axios.get(`${SCRAPER_URL}/${congUrlSegment}`);
            setCongregationSchedule(response.data.schedule);
        } catch (error) {
            setCongregationSchedule("<p>Failed to load schedule.</p>");
        } finally {
            setLoadingSchedule(false);
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
        try {
            const response = await axios.post(`${API_URL}/api/export-schedule`, { districtIds: selectedDistrictIds }, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `INC_Schedule_${Date.now()}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (e) {
            alert("Export failed.");
        } finally {
            setIsExporting(false);
        }
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

            {/* 🗓️ SCHEDULE MODAL */}
            <Modal isOpen={isScheduleOpen} onClose={closeSchedule} size="xl" isCentered>
                <ModalOverlay backdropFilter="blur(5px)" />
                <ModalContent borderRadius="xl" overflow="hidden">
                    <ModalHeader bg="blue.600" color="white">
                        {selectedCongregation?.name}
                    </ModalHeader>
                    <ModalCloseButton color="white" />
                    <ModalBody p={6} bg="gray.50">
                        {loadingSchedule ? (
                            <Flex justify="center" align="center" h="200px">
                                <Spinner size="xl" color="blue.500" />
                            </Flex>
                        ) : (
                            <Box
                                className="schedule-content"
                                dangerouslySetInnerHTML={{ __html: congregationSchedule || '<p>No schedule available.</p>' }}
                                sx={{
                                    'table': { width: '100%', borderCollapse: 'collapse', mt: 2 },
                                    'th, td': { border: '1px solid #E2E8F0', p: 2, fontSize: 'sm' },
                                    'th': { bg: 'blue.50', fontWeight: 'bold' }
                                }}
                            />
                        )}
                        <Text mt={4} fontSize="xs" color="gray.500" textAlign="center">
                            * Confirm with local administration.
                        </Text>
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

        </Box>
    );
};

export default Globe;