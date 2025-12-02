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
  Checkbox,
  HStack,
  VStack,
  IconButton,
  Tooltip,
} from "@chakra-ui/react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "../styles.css";
import { FaCheckSquare, FaRegSquare, FaDownload } from "react-icons/fa";

// 📌 Custom Marker Icon
const markerIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

// 🗺️ Move the Map when a District is Clicked
const MapFlyTo = ({ district }) => {
  const map = useMap();
  useEffect(() => {
    if (district?.latitude && district?.longitude) {
      // Use the coordinates of the first selected district to focus the map
      map.flyTo([district.latitude, district.longitude], 10);
    }
  }, [district, map]);
  return null;
};

const Globe = () => {
  const [districts, setDistricts] = useState([]);
  // store an array of selected district IDs for multi-select
  const [selectedDistrictIds, setSelectedDistrictIds] = useState([]);
  // Store the first selected district for map flyTo (optional)
  const [mapFocusDistrict, setMapFocusDistrict] = useState(null);
  const [localCongregations, setLocalCongregations] = useState([]);
  const [searchDistrict, setSearchDistrict] = useState("");
  const [searchCongregation, setSearchCongregation] = useState("");
  const [loadingCongregations, setLoadingCongregations] = useState(false);
  const [selectedCongregation, setSelectedCongregation] = useState(null);
  const [congregationSchedule, setCongregationSchedule] = useState("");
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const API_URL = process.env.REACT_APP_API_URL || "";
  const SCRAPER_URL = `${API_URL}/api/scrape`;

  const {
  isOpen: isConfirmOpen,
  onOpen: openConfirm,
  onClose: closeConfirm
} = useDisclosure();


  useEffect(() => {
    const fetchDistricts = async (retryCount = 3) => {
      try {
        const response = await axios.get(`${API_URL}/api/districts`);
        const updatedDistricts = response.data.map((district) => ({
          ...district,
          latitude: district.latitude || 12.8797,
          longitude: district.longitude || 121.774,
        }));
        setDistricts(updatedDistricts);
      } catch (error) {
        if (retryCount > 0) {
          setTimeout(() => fetchDistricts(retryCount - 1), 1000);
        } else {
          console.error("Failed to fetch districts:", error);
        }
      }
    };

    fetchDistricts();
  }, [API_URL]);

  // Toggle a single district selection
  const toggleDistrictSelection = (districtId, districtObj = null, setFocus = true) => {
    const isSelected = selectedDistrictIds.includes(districtId);
    let newSelectedIds;
    if (isSelected) {
      newSelectedIds = selectedDistrictIds.filter((id) => id !== districtId);
    } else {
      newSelectedIds = [...selectedDistrictIds, districtId];
      if (setFocus && districtObj) {
        setMapFocusDistrict(districtObj);
      }
    }
    setSelectedDistrictIds(newSelectedIds);

    // Fetch local congregations for the first selected district to keep right-panel manageable
    if (newSelectedIds.length > 0) {
      const focusDistrict = districts.find((d) => d.id === newSelectedIds[0]);
      if (focusDistrict) {
        fetchLocalCongregationsForDistrict(focusDistrict.id);
      } else {
        setLocalCongregations([]);
      }
    } else {
      setLocalCongregations([]);
      setMapFocusDistrict(null);
    }
  };

  // Select or deselect all visible districts (filtered by search)
  const toggleSelectAllVisible = () => {
    const visibleIds = districts
      .filter((district) =>
        district.name.toLowerCase().includes(searchDistrict.toLowerCase())
      )
      .map((d) => d.id);

    // If all visible are already selected -> deselect them. Otherwise, add all visible.
    const allVisibleSelected = visibleIds.every((id) =>
      selectedDistrictIds.includes(id)
    );

    if (allVisibleSelected) {
      // Remove visible ids from selected
      const remaining = selectedDistrictIds.filter((id) => !visibleIds.includes(id));
      setSelectedDistrictIds(remaining);
      if (remaining.length > 0) {
        const focus = districts.find((d) => d.id === remaining[0]);
        if (focus) fetchLocalCongregationsForDistrict(focus.id);
      } else {
        setLocalCongregations([]);
        setMapFocusDistrict(null);
      }
    } else {
      // Add visible ids (keep existing selections too)
      const union = Array.from(new Set([...selectedDistrictIds, ...visibleIds]));
      setSelectedDistrictIds(union);
      // focus the first of the visible list
      const firstVisible = districts.find((d) => d.id === visibleIds[0]);
      if (firstVisible) {
        setMapFocusDistrict(firstVisible);
        fetchLocalCongregationsForDistrict(firstVisible.id);
      }
    }
  };

  const fetchLocalCongregationsForDistrict = async (districtId) => {
    setLocalCongregations([]);
    setLoadingCongregations(true);
    try {
      const response = await axios.get(
        `${API_URL}/api/local-congregations?district_id=${districtId}`
      );
      setLocalCongregations(response.data);
    } catch (error) {
      console.error("Error fetching local congregations:", error);
      setLocalCongregations([]);
    } finally {
      setLoadingCongregations(false);
    }
  };

  // Click on a district (keeps toggle semantics but triggers focus)
const handleDistrictClick = async (district) => {
  const isSelected = selectedDistrictIds.includes(district.id);
  let newSelectedIds;

  if (isSelected) {
    newSelectedIds = selectedDistrictIds.filter(id => id !== district.id);
  } else {
    newSelectedIds = [...selectedDistrictIds, district.id];
    setMapFocusDistrict(district);
  }

  setSelectedDistrictIds(newSelectedIds);

  if (newSelectedIds.length === 0) {
    setLocalCongregations([]);
    setMapFocusDistrict(null);
    return;
  }

  setLoadingCongregations(true);

  try {
    const response = await axios.get(
      `${API_URL}/api/local-congregations-multi?ids=${newSelectedIds.join(',')}`
    );
    setLocalCongregations(response.data);
  } catch (error) {
    console.error("Error fetching merged congregations:", error);
  } finally {
    setLoadingCongregations(false);
  }
};

  // Fetch congregation schedule from backend scraper on Click
  const handleCongregationClick = async (cong) => {
    setSelectedCongregation(cong);
    setCongregationSchedule("");
    setLoadingSchedule(true);
    onOpen();
    try {
      const response = await axios.get(
        `${SCRAPER_URL}/${cong.name.replace(/\s+/g, "-").replace(/[.,]/g, "")}`
      );
      setCongregationSchedule(response.data.schedule);
    } catch (error) {
      setCongregationSchedule("<p>Failed to load schedule.</p>");
    } finally {
      setLoadingSchedule(false);
    }
  };

  // Handle Enter Key to Search Congregation and Open Modal
  const handleEnterPress = async (e) => {
    if (e.key === "Enter" && searchCongregation.trim() !== "") {
      try {
        let allCongregations = [...localCongregations];

        // Fetch congregations if the list is empty
        if (allCongregations.length === 0) {
          const response = await axios.get(`${API_URL}/api/all-congregations`);
          allCongregations = response.data;
          setLocalCongregations(allCongregations);
        }

        // Search for the congregation
        const foundCongregation = allCongregations.find((cong) =>
          cong.name.toLowerCase().includes(searchCongregation.toLowerCase())
        );

        if (foundCongregation) {
          handleCongregationClick(foundCongregation);
        } else {
          alert("Congregation not found. Please try again.");
        }
      } catch (error) {
        console.error("Error fetching congregations:", error);
        alert("Failed to retrieve congregation data.");
      }
    }
  };

  // Handle Export
  const handleExportClick = async () => {
   if (selectedDistrictIds.length === 0) {
    alert("Select at least one district.");
    return;
  }
  openConfirm(); // open confirmation modal
  };
const confirmExport = async () => {
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
      .replace(/[^\w\-]+/g, "_")        // remove invalid filename chars
      .substring(0, 60);                // limit length

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

    closeConfirm();
  } catch (error) {
    console.error("Export failed:", error);
    alert("Export failed.");
  } finally {
    setIsExporting(false);
  }
};

  // UI render
  return (
    <Box display="flex" width="100vw" height="100vh">
      {/* Left Panel - District List */}
      <Box width="25%" bg="gray.100" p="4" display="flex" flexDirection="column">
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
            <Tooltip label="Select / Deselect visible districts">
              <IconButton
                aria-label="Select All Visible"
                icon={
                  // show checked icon if all visible selected, else unchecked
                  districts
                    .filter((d) =>
                      d.name.toLowerCase().includes(searchDistrict.toLowerCase())
                    )
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
  isDisabled={selectedDistrictIds.length === 0}
>
  Export Selected ({selectedDistrictIds.length}) to XLSX
</Button>


          <Text mt="2" fontSize="sm" color="gray.600">
            Selected: {selectedDistrictIds.length}
          </Text>
        </Box>

        {/* Scrollable Districts List */}
        <Box flex="1" overflowY="auto" mt="2">
          <List spacing={3} p="1">
            {districts
              .filter((district) =>
                district.name.toLowerCase().includes(searchDistrict.toLowerCase())
              )
              .map((district) => {
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
                    <HStack spacing={3} onClick={(e) => e.stopPropagation()} >
                      <Checkbox
                        isChecked={isSelected}
                        onChange={() => toggleDistrictSelection(district.id, district, true)}
                        colorScheme="whiteAlpha"
                        // prevent click through to list item's onClick
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Text fontSize="md">{district.name}</Text>
                    </HStack>

                    {/* small meta: optional */}
                    <Text fontSize="xs" color={isSelected ? "whiteAlpha.800" : "gray.500"}>
                      {district.latitude && district.longitude ? "●" : "◌"}
                    </Text>
                  </ListItem>
                );
              })}
          </List>
        </Box>
      </Box>

      {/* Main Content - Map */}
      <Box flex="1" position="relative">
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

      {/* Right Panel - Find Congregation */}
      <Box
        position="absolute"
        top="10"
        right="10"
        width="300px"
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
            onChange={(e) => setSearchCongregation(e.target.value)}
            onKeyDown={handleEnterPress}
            mt="2"
          />
        </Box>
        <Box maxHeight="60vh" overflowY="auto" p="4">
          {loadingCongregations ? (
            <Box textAlign="center" p="4">
              <Spinner size="md" color="blue.500" />
            </Box>
          ) : (
            <List spacing={2}>
              {localCongregations.map((cong) => (
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
            </List>
          )}
        </Box>
      </Box>

      {/* Modal for Congregation Schedule */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent borderRadius="10px" boxShadow="lg">
          <ModalHeader fontSize="2xl" fontWeight="bold" textAlign="center">
            {selectedCongregation?.name} Worship Schedule
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody p="6">
            {loadingSchedule && !congregationSchedule ? (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                height="300px"
              >
                <Spinner size="xl" color="blue.500" />
              </Box>
            ) : (
              <Box
                bg="gray.50"
                p="5"
                borderRadius="md"
                boxShadow="sm"
                maxHeight="70vh"
                overflowY="auto"
              >
                <Box px="2" className="schedule-layout">
                  {congregationSchedule ? (
                    <Box dangerouslySetInnerHTML={{ __html: congregationSchedule }} />
                  ) : (
                    <Box textAlign="center" p="5">
                      <Text fontSize="md" color="gray.500">
                        No worship schedule available.
                      </Text>
                    </Box>
                  )}
                </Box>

                <Box mt="4" textAlign="center">
                  <Text fontSize="sm" color="gray.400">
                    * Schedules may change. Always confirm with the congregation.
                  </Text>
                </Box>
              </Box>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>


      <Modal isOpen={isConfirmOpen} onClose={closeConfirm} size="md">
  <ModalOverlay />
  <ModalContent>
    <ModalHeader>Confirm Export</ModalHeader>
    <ModalCloseButton />

    <ModalBody>
      <Text fontWeight="bold">Districts Selected:</Text>
      <List spacing={1} mt="2" mb="4">
        {selectedDistrictIds.map(id => {
          const d = districts.find(x => x.id === id);
          return <ListItem key={id}>• {d?.name}</ListItem>;
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
