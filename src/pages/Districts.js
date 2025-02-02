import React, { useState } from "react";
import { Box, Text, VStack, Button, Collapse, useColorModeValue } from "@chakra-ui/react";
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import { districtsData } from "../data/data";

const Districts = () => {
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  const toggleDistrict = (id) => {
    setSelectedDistrict(selectedDistrict === id ? null : id);
  };

  return (
    <VStack spacing={4} align="stretch">
      {districtsData.map((district) => (
        <Box
          key={district.id}
          p={4}
          borderRadius="lg"
          boxShadow="md"
          bg={useColorModeValue("white", "gray.700")}
          _hover={{ boxShadow: "lg" }}
        >
          <Button
            width="100%"
            justifyContent="space-between"
            onClick={() => toggleDistrict(district.id)}
            rightIcon={selectedDistrict === district.id ? <ChevronUpIcon /> : <ChevronDownIcon />}
            variant="ghost"
            fontSize="lg"
            fontWeight="bold"
          >
            {district.name}
          </Button>

          <Collapse in={selectedDistrict === district.id}>
            <VStack mt={3} align="stretch">
              {district.congregations.map((congregation) => (
                <Text key={congregation.id} p={2} bg="gray.100" borderRadius="md">
                  {congregation.name}
                </Text>
              ))}
            </VStack>
          </Collapse>
        </Box>
      ))}
    </VStack>
  );
};

export default Districts;
