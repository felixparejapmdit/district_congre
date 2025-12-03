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
} from "@chakra-ui/react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "../styles.css";
import { FaCheckSquare, FaRegSquare, FaDownload } from "react-icons/fa";

// Helper for delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
            map.flyTo([district.latitude, district.longitude], 10);
        }
    }, [district, map]);
    return null;
};

const Globe = () => {
    const [districts, setDistricts] = useState([]);
    const [selectedDistrictIds, setSelectedDistrictIds] = useState([]);
    const [mapFocusDistrict, setMapFocusDistrict] = useState(null);
    const [localCongregations, setLocalCongregations] = useState([]);
    const [allCongregations, setAllCongregations] = useState([]); 
    const [searchDistrict, setSearchDistrict] = useState("");
    const [searchCongregation, setSearchCongregation] = useState("");
    const [loadingCongregations, setLoadingCongregations] = useState(false);
    const [selectedCongregation, setSelectedCongregation] = useState(null);
    const [congregationSchedule, setCongregationSchedule] = useState("");
    const [loadingSchedule, setLoadingSchedule] = useState(false);
    const [isExporting, setIsExporting] = useState(false); 

    const { isOpen: isScheduleOpen, onOpen: openSchedule, onClose: closeSchedule } = useDisclosure();
    const { isOpen: isConfirmOpen, onOpen: openConfirm, onClose: closeConfirm } = useDisclosure();

    const API_URL = process.env.REACT_APP_API_URL || "";
    const SCRAPER_URL = `${API_URL}/api/scrape`;

    // Memoize the filtered list of districts based on search input
    const filteredDistricts = useMemo(() => {
        return districts.filter((district) =>
            district.name.toLowerCase().includes(searchDistrict.toLowerCase())
        );
    }, [districts, searchDistrict]);

    // 🟢 Filter all congregations based on searchCongregation input (Live Search)
    const filteredCongregations = useMemo(() => {
        if (!searchCongregation) {
            // If no search term, return the list based on district selection/focus
            return localCongregations;
        }
        const searchTerm = searchCongregation.toLowerCase();
        // Always search against the master list for universal results
        return allCongregations.filter(cong => 
            cong.name.toLowerCase().includes(searchTerm)
        );
    }, [allCongregations, localCongregations, searchCongregation]);


    // 🟢 Initial Data Fetch
    useEffect(() => {
        const fetchAllData = async (retryCount = 3) => {
            try {
                // 1. Fetch Districts
                const distResponse = await axios.get(`${API_URL}/api/districts`);
                const updatedDistricts = distResponse.data.map((district) => ({
                    ...district,
                    latitude: district.latitude || 12.8797,
                    longitude: district.longitude || 121.774,
                }));
                setDistricts(updatedDistricts);
                if (updatedDistricts.length > 0) {
                    setMapFocusDistrict(updatedDistricts[0]);
                }

                // 2. Fetch All Congregations for Global Search (Pre-load the master list)
                const congResponse = await axios.get(`${API_URL}/api/all-congregations`);
                setAllCongregations(congResponse.data.map(cong => ({
                    ...cong,
                    latitude: cong.latitude || 12.8797,
                    longitude: cong.longitude || 121.774,
                })));

            } catch (error) {
                if (retryCount > 0) {
                    setTimeout(() => fetchAllData(retryCount - 1), 1000);
                } else {
                    console.error("Failed to fetch initial data:", error);
                }
            }
        };
        fetchAllData();
    }, [API_URL]);

    // 🟢 Effect to update map focus when district search filter changes
    useEffect(() => {
        if (searchDistrict && filteredDistricts.length > 0) {
            setMapFocusDistrict(filteredDistricts[0]);
        } else if (!searchDistrict && districts.length > 0 && !selectedDistrictIds.length) {
            setMapFocusDistrict(districts[0]);
        }
    }, [searchDistrict, filteredDistricts, districts, selectedDistrictIds.length]);


    // 🟢 Fetches all local congregations for *all selected* districts for the Map and Right Panel
    const fetchSelectedCongregations = async (ids) => {
        // If actively searching (global search mode), do not overwrite the congregation list
        if (searchCongregation) return;

        // CRITICAL FIX: Clear list immediately if no IDs selected
        if (ids.length === 0) { 
            setLocalCongregations([]);
            setLoadingCongregations(false);
            return;
        }

        setLocalCongregations([]);
        setLoadingCongregations(true);
        
        try {
            // Fetch list based on selection
            const response = await axios.get(
                `${API_URL}/api/local-congregations-multi?ids=${ids.join(',')}`
            );
            
            // MAP FIX: Set focus to the first congregation found, if available
            if (response.data.length > 0) {
                 setMapFocusDistrict(response.data[0]); 
            }

            setLocalCongregations(response.data);
        } catch (error) {
            console.error("Error fetching merged congregations:", error);
            // Fallback for single district: Useful during LI click/focus action.
            if (ids.length === 1) {
                try {
                    const response = await axios.get(
                        `${API_URL}/api/local-congregations?district_id=${ids[0]}`
                    );
                    setLocalCongregations(response.data);
                    if (response.data.length > 0) {
                        setMapFocusDistrict(response.data[0]);
                    }
                } catch (fallbackError) {
                    console.error("Fallback fetch failed:", fallbackError);
                }
            }
        } finally {
            setLoadingCongregations(false);
        }
    }


    // 🟢 Toggles district selection (via Checkbox)
    const toggleDistrictSelection = (districtId, districtObj) => {
        const isSelected = selectedDistrictIds.includes(districtId);
        let newSelectedIds;

        if (isSelected) {
            newSelectedIds = selectedDistrictIds.filter((id) => id !== districtId);
        } else {
            newSelectedIds = [...selectedDistrictIds, districtId];
            setMapFocusDistrict(districtObj);
        }

        setSelectedDistrictIds(newSelectedIds);
        fetchSelectedCongregations(newSelectedIds);
    };

    // 🟢 Handles click on the District LI (focuses map without toggling selection)
    const handleDistrictClick = (district) => {
        setMapFocusDistrict(district);
        setSearchCongregation(""); // Clear congregation search when focusing on a district
        
        // Load congregations for the clicked district (either its own or the group's)
        if (!selectedDistrictIds.includes(district.id)) {
             fetchSelectedCongregations([district.id]);
        } else {
             fetchSelectedCongregations(selectedDistrictIds);
        }
    };


    // Select or deselect all visible districts (filtered by search)
    const toggleSelectAllVisible = () => {
        const visibleIds = filteredDistricts.map((d) => d.id);
        const allVisibleSelected = visibleIds.every((id) => selectedDistrictIds.includes(id));

        let newSelectedIds;
        if (allVisibleSelected) {
            newSelectedIds = selectedDistrictIds.filter((id) => !visibleIds.includes(id));
        } else {
            newSelectedIds = Array.from(new Set([...selectedDistrictIds, ...visibleIds]));
            const firstVisible = filteredDistricts[0];
            if (firstVisible) setMapFocusDistrict(firstVisible);
        }
        
        setSelectedDistrictIds(newSelectedIds);
        fetchSelectedCongregations(newSelectedIds);
    };


    // Fetch congregation schedule from backend scraper on Click
    const handleCongregationClick = async (cong) => {
        setSelectedCongregation(cong);
        setCongregationSchedule("");
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
    
    // 🟢 Handles live search input change
    const handleSearchCongregationChange = (e) => {
        const searchTerm = e.target.value;
        setSearchCongregation(searchTerm);

        // Map focuses on the first visible result while typing
        if (searchTerm) {
            const firstMatch = allCongregations.find(cong => 
                cong.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            if (firstMatch) {
                setMapFocusDistrict(firstMatch);
            }
        }
    };

    // 🟢 Handle Enter Key to Search Congregation (Finalized search)
    const handleEnterPress = async (e) => {
        if (e.key === "Enter" && searchCongregation.trim() !== "") {
            
            // Perform exact match search
            const foundCongregation = filteredCongregations.find((cong) =>
                cong.name.toLowerCase() === searchCongregation.trim().toLowerCase()
            );

            if (foundCongregation) {
                // Focus map on the exact congregation location
                setMapFocusDistrict(foundCongregation);
                
                // Load only this congregation to the right panel/map (temporarily override display)
                setLocalCongregations([foundCongregation]);
                
                // Open the schedule modal
                handleCongregationClick(foundCongregation);
            } else {
                alert("Congregation not found. Please try again.");
            }
        }
    };

    // Handle Export
    const handleExportClick = () => {
        if (selectedDistrictIds.length === 0) {
            alert("Select at least one district.");
            return;
        }
        openConfirm(); 
    };
    
    const confirmExport = async () => {
        closeConfirm();
        setIsExporting(true);

        try {
            const response = await axios.post(
                `${API_URL}/api/export-schedule`,
                { districtIds: selectedDistrictIds },
                { responseType: 'blob' }
            );

            const districtNames = selectedDistrictIds
                .map(id => districts.find(d => d.id === id)?.name || "")
                .join("_")
                .replace(/[^\w\-]+/g, "_")
                .substring(0, 60);

            const filename = districtNames.length > 3
                ? `${districtNames}_Schedule.xlsx`
                : `INC_Schedule_${Date.now()}.xlsx`;

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
        } catch (error) {
            console.error("Export failed:", error);
            alert("Export failed. Check console and backend logs.");
        } finally {
            setIsExporting(false);
        }
    };

    // Get selected district names for display in the left panel
    const selectedDistrictNames = selectedDistrictIds.map(id => districts.find(d => d.id === id)?.name).filter(Boolean).join(', ');


    // UI render
    return (
        <Box display="flex" width="100vw" height="100vh" position="relative" overflowX="hidden">
            
            {/* 💡 OVERLAY for Export Loading */}
            {isExporting && (
                <Box
                    position="fixed"
                    top="0"
                    left="0"
                    right="0"
                    bottom="0"
                    bg="rgba(0,0,0,0.5)"
                    zIndex="3000"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                >
                    <Spinner size="xl" color="white" thickness="4px" />
                    <Text color="white" ml="4" fontSize="xl">Generating Schedule...</Text>
                </Box>
            )}

            {/* Left Panel - District List (Responsive Width) */}
            <Box 
                width={['100%', '25%']} 
                bg="gray.100" 
                p="4" 
                display="flex" 
                flexDirection="column" 
                zIndex="10"
                height={['auto', '100vh']} 
                minHeight={['300px', '100vh']}
            >
                {/* Sticky Header with Search Bar and Export Button */}
                <Box bg="gray.100" position="sticky" top="0" zIndex="100" p="4" pt="0">
                    <Text fontSize="2xl" fontWeight="bold">
                        📌 Districts
                    </Text>

                    <HStack mt="2" spacing={2}>
                        <Input
                            placeholder="Search district..."
                            value={searchDistrict}
                            onChange={(e) => setSearchDistrict(e.target.value)}
                            flex="1"
                        />
                        <Tooltip label="Toggle selection for visible districts">
                            <IconButton
                                aria-label="Select All Visible"
                                icon={
                                    filteredDistricts
                                        .every((d) => selectedDistrictIds.includes(d.id))
                                        ? <FaCheckSquare />
                                        : <FaRegSquare />
                                }
                                onClick={toggleSelectAllVisible}
                            />
                        </Tooltip>
                    </HStack>

                    <Button
                        mt="2"
                        colorScheme="green"
                        width="100%"
                        onClick={handleExportClick}
                        isLoading={isExporting}
                        loadingText="Generating Schedule..."
                        isDisabled={selectedDistrictIds.length === 0}
                    >
                        <HStack spacing={2}>
                            <FaDownload />
                            <Text>Export Selected ({selectedDistrictIds.length})</Text>
                        </HStack>
                    </Button>

                    <Text mt="2" fontSize="sm" color="gray.600" noOfLines={3}>
                        Selected: **{selectedDistrictNames || 'None'}**
                    </Text>
                </Box>

                {/* Scrollable Districts List */}
                <Box flex="1" overflowY="auto" mt="2">
                    <List spacing={3} p="1">
                        {filteredDistricts.map((district) => {
                            const isSelected = selectedDistrictIds.includes(district.id);
                            return (
                                <ListItem
                                    key={district.id}
                                    p="3"
                                    bg={isSelected ? "blue.500" : "white"}
                                    color={isSelected ? "white" : "black"}
                                    borderRadius="5px"
                                    cursor="pointer"
                                    _hover={{ bg: isSelected ? "blue.400" : "blue.50" }}
                                    onClick={() => handleDistrictClick(district)}
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="space-between"
                                >
                                    <HStack spacing={3}>
                                        <Checkbox
                                            isChecked={isSelected}
                                            onChange={() => toggleDistrictSelection(district.id, district)}
                                            colorScheme="whiteAlpha"
                                            onClick={(e) => e.stopPropagation()} 
                                        />
                                        <Text fontSize="md" fontWeight="medium">{district.name}</Text>
                                    </HStack>

                                    <Text fontSize="xs" color={isSelected ? "whiteAlpha.800" : "gray.500"}>
                                        {district.latitude && district.longitude ? "●" : "◌"}
                                    </Text>
                                </ListItem>
                            );
                        })}
                    </List>
                </Box>
            </Box>

            {/* Main Content - Map (Full width on mobile, 75% on desktop) */}
            <Box flex="1" position="relative" width={['100%', '75%']} height={['100vh', '100%']}>
                <MapContainer
                    center={[
                        mapFocusDistrict?.latitude || 12.8797,
                        mapFocusDistrict?.longitude || 121.774,
                    ]}
                    zoom={mapFocusDistrict ? 10 : 5}
                    style={{ width: "100%", height: "100%" }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapFlyTo district={mapFocusDistrict} />

                    {localCongregations
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
                                <Popup>{cong.name}</Popup>
                            </Marker>
                        ))}
                </MapContainer>
            </Box>

            {/* Right Panel - Find Congregation (Fixed position) */}
            <Box
                position="absolute"
                top={['10px', '20px']}
                right={['10px', '20px']}
                width={['95%', '300px']} 
                bg="white"
                boxShadow="xl"
                borderRadius="10px"
                zIndex="2000"
                overflow="hidden"
                maxHeight="80vh"
            >
                <Box bg="white" position="sticky" top="0" zIndex="100" p="4">
                    <Text fontSize="lg" fontWeight="bold" color="blue.600">
                        Find a Congregation
                    </Text>
                    <Input
                        placeholder="Search congregation..."
                        value={searchCongregation}
                        onChange={handleSearchCongregationChange}
                        onKeyDown={handleEnterPress}
                        mt="2"
                    />
                </Box>
                <Box maxHeight="60vh" overflowY="auto" p="4">
                    {loadingCongregations && !searchCongregation ? (
                        <Box textAlign="center" p="4">
                            <Spinner size="md" color="blue.500" />
                        </Box>
                    ) : (
                        <List spacing={2}>
                            {filteredCongregations.map((cong) => (
                                <ListItem
                                    key={cong.id}
                                    fontSize="sm"
                                    p="2"
                                    bg="gray.100"
                                    borderRadius="5px"
                                    cursor="pointer"
                                    onClick={() => handleCongregationClick(cong)}
                                >
                                    📍 {cong.name}
                                </ListItem>
                            ))}
                            {/* 💡 Show context-aware empty message */}
                            {filteredCongregations.length === 0 && (
                                <Text color="gray.500" p="2">
                                    {searchCongregation 
                                        ? "No congregations match search." 
                                        : "Select a district to view congregations."}
                                </Text>
                            )}
                        </List>
                    )}
                </Box>
            </Box>

            {/* Modal for Congregation Schedule (Unchanged) */}
            <Modal isOpen={isScheduleOpen} onClose={closeSchedule} size="lg">
                <ModalOverlay />
                <ModalContent borderRadius="10px" boxShadow="lg">
                    <ModalHeader fontSize="2xl" fontWeight="bold" textAlign="center">
                        {selectedCongregation?.name} Worship Schedule
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody p="6">
                        {loadingSchedule && !congregationSchedule ? (
                            <Box display="flex" justifyContent="center" alignItems="center" height="300px">
                                <Spinner size="xl" color="blue.500" />
                            </Box>
                        ) : (
                            <Box bg="gray.50" p="5" borderRadius="md" boxShadow="sm" maxHeight="70vh" overflowY="auto">
                                <Box px="2" className="schedule-layout">
                                    {congregationSchedule ? (
                                        <Box dangerouslySetInnerHTML={{ __html: congregationSchedule }} />
                                    ) : (
                                        <Box textAlign="center" p="5">
                                            <Text fontSize="md" color="gray.500">No worship schedule available.</Text>
                                        </Box>
                                    )}
                                </Box>
                                <Box mt="4" textAlign="center">
                                    <Text fontSize="sm" color="gray.400">* Schedules may change. Always confirm with the congregation.</Text>
                                </Box>
                            </Box>
                        )}
                    </ModalBody>
                </ModalContent>
            </Modal>


            {/* Modal for Export Confirmation (Unchanged) */}
            <Modal isOpen={isConfirmOpen} onClose={closeConfirm} size="md">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Confirm Export</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Text fontWeight="bold">Districts Selected ({selectedDistrictIds.length}):</Text>
                        <List spacing={1} mt="2" mb="4" maxHeight="200px" overflowY="auto">
                            {selectedDistrictIds.map(id => {
                                const d = districts.find(x => x.id === id);
                                return <ListItem key={id}>• **{d?.name}**</ListItem>;
                            })}
                        </List>

                        <Button
                            colorScheme="green"
                            width="100%"
                            onClick={confirmExport}
                            isLoading={isExporting}
                        >
                            Yes, Export Now
                        </Button>

                        <Button mt="2" width="100%" onClick={closeConfirm}>
                            Cancel
                        </Button>
                    </ModalBody>
                </ModalContent>
            </Modal>
        </Box>
    );
};

export default Globe;