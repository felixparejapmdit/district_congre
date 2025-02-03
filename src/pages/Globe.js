import React, { useEffect, useState } from "react";
import { Box, Input, Text, List, ListItem, Spinner } from "@chakra-ui/react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

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
    if (district && district.latitude && district.longitude) {
      map.flyTo([district.latitude, district.longitude], 10);
    }
  }, [district, map]);
  return null;
};

const Globe = () => {
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [localCongregations, setLocalCongregations] = useState([]);
  const [searchDistrict, setSearchDistrict] = useState(""); // 🔍 Search for districts
  const [searchCongregation, setSearchCongregation] = useState(""); // 🔍 Search for local congregations
  const [loadingCongregations, setLoadingCongregations] = useState(false); // 🔄 Loading indicator

  const API_URL = process.env.REACT_APP_API_URL;

  // Fetch districts from API
  useEffect(() => {
    axios
      .get(`${API_URL}/api/districts`)
      .then((response) => {
        const updatedDistricts = response.data.map((district) => ({
          ...district,
          latitude: district.latitude || 12.8797, // Default latitude (Philippines)
          longitude: district.longitude || 121.774, // Default longitude
        }));

        console.log("Updated Districts Data:", updatedDistricts); // ✅ Debugging
        setDistricts(updatedDistricts);
      })
      .catch((error) => console.error("Error fetching districts:", error));
  }, []);

  // 🟢 Function to handle district selection
  const handleDistrictClick = (district) => {
    if (!district.latitude || !district.longitude) {
      console.error("Invalid coordinates for district:", district);
      alert(`No coordinates found for ${district.name}. Please update API.`);
      return;
    }

    console.log(`Selected district: ${district.name}`);
    setSelectedDistrict(district);
    setSearchCongregation(""); // Reset search input
    setLocalCongregations([]); // Clear previous data
    setLoadingCongregations(true);

    axios
      .get(`${API_URL}/api/local-congregations?district_id=${district.id}`)
      .then((response) => {
        console.log("Fetched local congregations:", response.data);
        setLocalCongregations(response.data);
      })
      .catch((error) => {
        console.error("Error fetching local congregations:", error);
      })
      .finally(() => setLoadingCongregations(false));
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

      {/* 🗺️ Right Panel - Map */}
      <Box flex="1" position="relative">
        <MapContainer
          center={[12.8797, 121.774]} // Default Philippines location
          zoom={5}
          style={{ height: "100vh", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {/* Move map to selected district */}
          {selectedDistrict && <MapFlyTo district={selectedDistrict} />}

          {/* 📍 District Markers on Map */}
          {districts.map((district) => {
            if (!district.latitude || !district.longitude) return null;
            return (
              <Marker
                key={district.id}
                position={[district.latitude, district.longitude]}
                icon={markerIcon}
                eventHandlers={{
                  click: () => handleDistrictClick(district),
                }}
              >
                <Popup>
                  <Text fontWeight="bold">{district.name}</Text>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
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
          zIndex="10"
          overflow="hidden"
          maxHeight="80vh"
        >
          {/* Sticky Header with Search Bar */}
          <Box bg="white" position="sticky" top="0" zIndex="100" p="4">
            <Text fontSize="lg" fontWeight="bold" color="blue.600">
              📌 {selectedDistrict.name}
            </Text>
            <Text fontSize="md" fontWeight="medium" mt="1">
              Local Congregations:
            </Text>
            <Input
              placeholder="Search congregation..."
              value={searchCongregation}
              onChange={(e) => setSearchCongregation(e.target.value)}
              mt="2"
            />
          </Box>

          {/* Scrollable List of Congregations */}
          <Box maxHeight="60vh" overflowY="auto" p="4">
            {loadingCongregations ? (
              <Spinner size="lg" color="blue.500" />
            ) : (
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
                    >
                      📍 {cong.name}
                    </ListItem>
                  ))}
                {localCongregations.length === 0 && !loadingCongregations && (
                  <Text fontSize="sm" color="gray.500">
                    No local congregations found.
                  </Text>
                )}
              </List>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Globe;
