import React from "react";
import { Box, Text, Select } from "@chakra-ui/react";

const LocalCongregation = ({ localCongregations, selectedDistrict, handleChange }) => {
  // Filter local congregations based on selected district
  const filteredCongregations = localCongregations.filter(
    (cong) => cong.district_id === selectedDistrict
  );

  return (
    <Box width="100%">
      <Text fontWeight="bold" mb="2" color="#0a5856">
        Select Local Congregation:
      </Text>
      <Select
        placeholder="Choose Local Congregation"
        name="local_congregation"
        onChange={(e) => handleChange(e.target.value)}
      >
        {filteredCongregations.map((cong) => (
          <option key={cong.id} value={cong.id}>
            {cong.name}
          </option>
        ))}
      </Select>
    </Box>
  );
};

export default LocalCongregation;
