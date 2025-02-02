import React, { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Sphere, Html } from "@react-three/drei";
import { Box, Text, VStack } from "@chakra-ui/react";
import axios from "axios";

const Globe = () => {
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/districts`).then((response) => {
      setDistricts(response.data);
    });
  }, []);

  return (
    <Box width="100vw" height="100vh">
      <Canvas>
        <ambientLight intensity={0.5} />
        <OrbitControls />

        {/* Globe Sphere */}
        <Sphere args={[2, 32, 32]}>
          <meshStandardMaterial attach="material" color="blue" />
        </Sphere>

        {/* District Markers */}
        {districts.map((district) => (
          <Html
            position={[
              district.latitude / 50,
              district.longitude / 50,
              2.1,
            ]}
            key={district.id}
          >
            <button
              onClick={() => setSelectedDistrict(district)}
              style={{
                background: "red",
                color: "white",
                padding: "5px",
                borderRadius: "10px",
                cursor: "pointer",
              }}
            >
              {district.name}
            </button>
          </Html>
        ))}
      </Canvas>

      {/* District Details Panel */}
      {selectedDistrict && (
        <Box position="absolute" top="10" right="10" p="5" bg="white" boxShadow="lg">
          <VStack align="start">
            <Text fontSize="xl" fontWeight="bold">
              {selectedDistrict.name}
            </Text>
            <Text>Local Congregations:</Text>
            <ul>
              {selectedDistrict.local_congregations.map((cong) => (
                <li key={cong.id}>{cong.name}</li>
              ))}
            </ul>
          </VStack>
        </Box>
      )}
    </Box>
  );
};

export default Globe;
