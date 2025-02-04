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
} from "@chakra-ui/react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "../styles.css";

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
      map.flyTo([district.latitude, district.longitude], 10);
    }
  }, [district, map]);
  return null;
};

const Globe = () => {
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [localCongregations, setLocalCongregations] = useState([]);
  const [searchDistrict, setSearchDistrict] = useState("");
  const [searchCongregation, setSearchCongregation] = useState("");
  const [loadingCongregations, setLoadingCongregations] = useState(false);
  const [selectedCongregation, setSelectedCongregation] = useState(null);
  const [congregationSchedule, setCongregationSchedule] = useState(""); // Store schedule data

  const [loadingSchedule, setLoadingSchedule] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure(); // Modal state

  const API_URL = process.env.REACT_APP_API_URL;
  const SCRAPER_URL = "http://localhost:5001/api/scrape"; // Backend scraper API

  useEffect(() => {
    axios
      .get(`${API_URL}/api/districts`)
      .then((response) => {
        const updatedDistricts = response.data.map((district) => ({
          ...district,
          latitude: district.latitude || 12.8797,
          longitude: district.longitude || 121.774,
        }));

        setDistricts(updatedDistricts);
      })
      .catch((error) => console.error("Error fetching districts:", error));
  }, []);

  // 🟢 Function to handle district selection
  const handleDistrictClick = (district) => {
    if (!district?.latitude || !district?.longitude) {
      alert(`No coordinates found for ${district?.name || "this district"}.`);
      return;
    }

    setSelectedDistrict(district);
    setSearchCongregation("");
    setLocalCongregations([]);
    setLoadingCongregations(true);

    axios
      .get(`${API_URL}/api/local-congregations?district_id=${district.id}`)
      .then((response) => {
        setLocalCongregations(response.data);
      })
      .catch((error) => {
        console.error("Error fetching local congregations:", error);
      })
      .finally(() => setLoadingCongregations(false));
  };

  // 🟢 Fetch congregation schedule from backend scraper
  const handleCongregationHover = async (cong) => {
    setSelectedCongregation(cong);
    setCongregationSchedule(""); // Clear previous data
    onOpen();

    try {
      const response = await axios.get(
        `${SCRAPER_URL}/${cong.name.replace(/\s+/g, "-")}`
      );
      setCongregationSchedule(response.data.schedule);
    } catch (error) {
      setCongregationSchedule("<p>Failed to load schedule.</p>");
    }
  };

  return (
    <Box display="flex" width="100vw" height="100vh">
      {/* 📌 Left Panel - District List */}
      <Box
        width="25%"
        bg="gray.100"
        p="4"
        display="flex"
        flexDirection="column"
      >
        {/* Sticky Header with Search Bar */}
        <Box bg="gray.100" position="sticky" top="0" zIndex="100" p="4">
          <Text fontSize="2xl" fontWeight="bold">
            📌 Districts
          </Text>
          <Input
            placeholder="Search district..."
            value={searchDistrict}
            onChange={(e) => setSearchDistrict(e.target.value)}
            mt="2"
            mb="2"
          />
        </Box>

        {/* Scrollable Districts List */}
        <Box flex="1" overflowY="auto">
          <List spacing={3}>
            {districts
              .filter((district) =>
                district.name
                  .toLowerCase()
                  .includes(searchDistrict.toLowerCase())
              )
              .map((district) => (
                <ListItem
                  key={district.id}
                  p="3"
                  bg={
                    selectedDistrict?.id === district.id ? "blue.500" : "white"
                  }
                  color={
                    selectedDistrict?.id === district.id ? "white" : "black"
                  }
                  borderRadius="5px"
                  cursor="pointer"
                  _hover={{ bg: "blue.300", color: "white" }}
                  onClick={() => handleDistrictClick(district)}
                >
                  {district.name}
                </ListItem>
              ))}
          </List>
        </Box>
      </Box>
      {/* 🏠 Right Panel - Local Congregations */}
      {selectedDistrict && (
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
              📌 {selectedDistrict.name}
            </Text>
            <Input
              placeholder="Search congregation..."
              value={searchCongregation}
              onChange={(e) => setSearchCongregation(e.target.value)}
              mt="2"
            />
          </Box>

          <Box maxHeight="60vh" overflowY="auto" p="4">
            <List spacing={2}>
              {localCongregations
                .filter((cong) =>
                  cong.name
                    .toLowerCase()
                    .includes(searchCongregation.toLowerCase())
                )
                .map((cong) => (
                  <ListItem
                    key={cong.id}
                    fontSize="sm"
                    p="2"
                    bg="gray.100"
                    borderRadius="5px"
                    onMouseEnter={() => handleCongregationHover(cong)}
                    cursor="pointer"
                  >
                    📍 {cong.name}
                  </ListItem>
                ))}
            </List>
          </Box>
        </Box>
      )}

      {/* 📌 Modal for Congregation Schedule */}
      {/* 📌 Modal for Congregation Schedule */}
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
                {/* Header */}
                <Box bg="blue.50" p="4" borderRadius="md" mb="4">
                  <Text fontSize="lg" fontWeight="bold" color="blue.600">
                    Worship Service Schedule
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Be sure to confirm worship service schedules before
                    attending. Worship service times may be temporarily or
                    recently changed.
                  </Text>
                </Box>

                {/* Render Schedule - Apply custom CSS for layout */}
                <Box px="2" className="schedule-layout">
                  {congregationSchedule ? (
                    <Box
                      dangerouslySetInnerHTML={{ __html: congregationSchedule }}
                    />
                  ) : (
                    <Box textAlign="center" p="5">
                      <Text fontSize="md" color="gray.500">
                        No worship schedule available.
                      </Text>
                    </Box>
                  )}
                </Box>

                {/* Disclaimer */}
                <Box mt="4" textAlign="center">
                  <Text fontSize="sm" color="gray.400">
                    * Schedules may change. Always confirm with the
                    congregation.
                  </Text>
                </Box>
              </Box>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Globe;
