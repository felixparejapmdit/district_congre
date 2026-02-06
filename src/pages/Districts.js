import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  useToast,
  Text,
  Badge,
  SimpleGrid,
  Card,
  CardBody,
  Stack,
  Skeleton,
  ButtonGroup,
  Tooltip,
  useColorModeValue,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from "@chakra-ui/react";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaHome,
  FaChevronLeft,
  FaChevronRight,
  FaSyncAlt,
  FaMapMarkerAlt,
  FaSortAlphaDown,
  FaSortAlphaUp,
  FaList,
  FaTh
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Districts = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // State
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingDistrict, setEditingDistrict] = useState(null);
  const [formData, setFormData] = useState({ name: "", latitude: "", longitude: "" });
  const [sortAsc, setSortAsc] = useState(true);

  // View Item State (true = grid, false = list)
  const [isGridView, setIsGridView] = useState(false);

  // Search & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = isGridView ? 20 : 25; // Fit more since we scroll internally

  // UI Hooks
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose
  } = useDisclosure();
  const [deletingId, setDeletingId] = useState(null);

  const cardBg = useColorModeValue("white", "gray.700");
  const API_URL = process.env.REACT_APP_API_URL || "";

  // Helper: Fetch Data
  const fetchDistricts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/districts`);
      setDistricts(response.data);
    } catch (error) {
      toast({
        title: "Error fetching districts",
        description: "Please check your connection.",
        status: "error",
        duration: 4000,
        position: "top-right",
        variant: "left-accent",
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDistricts();
  }, []);

  // Filtering & Sorting
  const processedDistricts = useMemo(() => {
    let data = districts.filter((d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    data.sort((a, b) => {
      return sortAsc
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    });

    return data;
  }, [districts, searchTerm, sortAsc]);

  // Pagination
  const totalPages = Math.ceil(processedDistricts.length / itemsPerPage);
  const currentData = processedDistricts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
  };

  // CRUD Actions
  const handleSave = async () => {
    if (!formData.name) return;
    try {
      if (editingDistrict) {
        await axios.put(`${API_URL}/api/districts/${editingDistrict.id}`, formData);
        toast({
          title: "District Updated",
          description: `${formData.name} has been updated successfully.`,
          status: "success",
          duration: 3000,
          position: "top-right",
          variant: "left-accent",
          isClosable: true,
        });
      } else {
        await axios.post(`${API_URL}/api/districts`, formData);
        toast({
          title: "District Created",
          description: `${formData.name} has been added to the system.`,
          status: "success",
          duration: 3000,
          position: "top-right",
          variant: "left-accent",
          isClosable: true,
        });
      }
      fetchDistricts();
      onClose();
    } catch (error) {
      toast({
        title: "Operation Failed",
        description: "An error occurred while saving. Please try again.",
        status: "error",
        duration: 4000,
        position: "top-right",
        variant: "left-accent",
        isClosable: true,
      });
    }
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await axios.delete(`${API_URL}/api/districts/${deletingId}`);
      toast({
        title: "District Deleted",
        status: "success",
        duration: 3000,
        position: "top-right",
        variant: "left-accent",
        isClosable: true,
      });
      fetchDistricts();
      onDeleteClose();
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "This district might be in use.",
        status: "error",
        duration: 4000,
        position: "top-right",
        variant: "left-accent",
        isClosable: true,
      });
    }
  };

  const handleDelete = (id) => {
    setDeletingId(id);
    onDeleteOpen();
  };

  const openModal = (district = null) => {
    setEditingDistrict(district);
    setFormData(district
      ? { name: district.name, latitude: district.latitude, longitude: district.longitude }
      : { name: "", latitude: "", longitude: "" }
    );
    onOpen();
  };

  return (
    <Box h="100vh" bg="gray.50" display="flex" flexDirection="column" overflow="hidden">
      {/* 🟢 FIXED HEADER */}
      <Box bg="white" shadow="sm" borderBottom="1px solid" borderColor="gray.200" py={2} flexShrink={0} zIndex={10}>
        <Container maxW="full" px={{ base: 2, md: 6 }}>
          <Flex justify="space-between" align="center" gap={4}>
            <Flex align="center" gap={4}>
              <IconButton
                icon={<FaHome />}
                variant="ghost"
                onClick={() => navigate("/")}
                aria-label="Home"
                size="sm"
              />
              <Box>
                <Heading size="md" color="gray.800" display="flex" alignItems="center" gap={2}>
                  Districts
                  <Badge colorScheme="blue" fontSize="0.8em" borderRadius="full">{districts.length}</Badge>
                </Heading>
              </Box>
            </Flex>

            <Flex gap={2} align="center">
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                size="sm"
                maxW="200px"
                variant="filled"
                borderRadius="md"
              />
              <ButtonGroup isAttached variant="outline" size="xs">
                <IconButton
                  aria-label="List View"
                  icon={<FaList />}
                  colorScheme={!isGridView ? "blue" : "gray"}
                  variant={!isGridView ? "solid" : "outline"}
                  onClick={() => setIsGridView(false)}
                />
                <IconButton
                  aria-label="Grid View"
                  icon={<FaTh />}
                  colorScheme={isGridView ? "blue" : "gray"}
                  variant={isGridView ? "solid" : "outline"}
                  onClick={() => setIsGridView(true)}
                />
              </ButtonGroup>
              <Tooltip label="Refresh Data">
                <IconButton size="sm" icon={<FaSyncAlt />} onClick={fetchDistricts} aria-label="Refresh" variant="ghost" />
              </Tooltip>
              <Button size="sm" leftIcon={<FaPlus />} colorScheme="blue" onClick={() => openModal()}>
                New
              </Button>
            </Flex>
          </Flex>
        </Container>
      </Box>

      {/* 🟡 SCROLLABLE CONTENT AREA */}
      <Container maxW="full" px={{ base: 2, md: 6 }} flex="1" display="flex" flexDirection="column" overflow="hidden" py={4}>
        {loading ? (
          <Stack spacing={2}>
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} height="40px" borderRadius="md" />)}
          </Stack>
        ) : (
          <Box flex="1" display="flex" flexDirection="column" overflow="hidden">

            {/* Scrollable Data Container */}
            <Box flex="1" overflowY="auto" pr={2} pb={2} css={{
              '&::-webkit-scrollbar': { width: '6px' },
              '&::-webkit-scrollbar-track': { background: '#f1f1f1' },
              '&::-webkit-scrollbar-thumb': { background: '#c1c1c1', borderRadius: '4px' },
              '&::-webkit-scrollbar-thumb:hover': { background: '#a8a8a8' },
            }}>

              {isGridView ? (
                // GRID VIEW
                <SimpleGrid columns={{ base: 1, sm: 2, md: 4, lg: 5, xl: 6 }} spacing={3}>
                  {currentData.map((d) => (
                    <Card key={d.id} bg={cardBg} shadow="sm" _hover={{ shadow: "md" }} transition="all 0.2s" size="sm" borderWidth="1px" borderColor="gray.100">
                      <CardBody>
                        <Heading size="xs" color="blue.600" mb={1} noOfLines={1} title={d.name}>{d.name}</Heading>
                        <Text fontSize="xs" color="gray.500" display="flex" alignItems="center" gap={1} mb={2}>
                          <FaMapMarkerAlt /> {d.latitude && d.longitude ? 'Set' : 'N/A'}
                        </Text>
                        <Flex justify="flex-end" gap={1}>
                          <IconButton size="xs" icon={<FaEdit />} onClick={() => openModal(d)} aria-label="Edit" variant="ghost" colorScheme="yellow" />
                          <IconButton size="xs" icon={<FaTrash />} colorScheme="red" onClick={() => handleDelete(d.id)} aria-label="Delete" variant="ghost" />
                        </Flex>
                      </CardBody>
                    </Card>
                  ))}
                  {currentData.length === 0 && <Text textAlign="center" gridColumn="1/-1" color="gray.500" mt={10}>No districts found.</Text>}
                </SimpleGrid>
              ) : (
                // LIST VIEW
                <Box bg="white" borderRadius="md" shadow="sm" border="1px solid" borderColor="gray.200">
                  <Table variant="simple" size="sm">
                    <Thead bg="gray.50" position="sticky" top={0} zIndex={1} shadow="sm">
                      <Tr>
                        <Th py={3} cursor="pointer" onClick={() => setSortAsc(!sortAsc)} _hover={{ color: "blue.500" }}>
                          <Flex align="center" gap={1}>
                            Name {sortAsc ? <FaSortAlphaDown /> : <FaSortAlphaUp />}
                          </Flex>
                        </Th>
                        <Th>Coordinates</Th>
                        <Th isNumeric>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {currentData.map((d) => (
                        <Tr key={d.id} _hover={{ bg: "blue.50" }}>
                          <Td py={2} fontWeight="medium" color="gray.700">{d.name}</Td>
                          <Td py={2} fontSize="xs" color="gray.500">
                            {d.latitude && d.longitude ? (
                              <Flex align="center" gap={1}>
                                <FaMapMarkerAlt color="red" /> {d.latitude}, {d.longitude}
                              </Flex>
                            ) : <Text color="gray.300">N/A</Text>}
                          </Td>
                          <Td py={2} isNumeric>
                            <ButtonGroup size="xs" variant="ghost">
                              <IconButton icon={<FaEdit />} colorScheme="blue" onClick={() => openModal(d)} aria-label="Edit" />
                              <IconButton icon={<FaTrash />} colorScheme="red" onClick={() => handleDelete(d.id)} aria-label="Delete" />
                            </ButtonGroup>
                          </Td>
                        </Tr>
                      ))}
                      {currentData.length === 0 && (
                        <Tr><Td colSpan={3} textAlign="center" py={10} color="gray.500">No districts match your search.</Td></Tr>
                      )}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </Box>

            {/* FIXED FOOTER PAGINATION */}
            <Flex justify="space-between" align="center" pt={3} borderTop="1px solid" borderColor="gray.200" bg="gray.50" flexShrink={0}>
              <Text fontSize="xs" color="gray.500">
                Showing {currentData.length} records
              </Text>
              <Flex align="center" gap={2}>
                <Text fontSize="xs" color="gray.500" mr={2}>
                  Page {currentPage} of {totalPages}
                </Text>
                <ButtonGroup size="xs" isAttached variant="outline" bg="white">
                  <IconButton
                    icon={<FaChevronLeft />}
                    onClick={() => handlePageChange(currentPage - 1)}
                    isDisabled={currentPage === 1}
                    aria-label="Previous"
                  />
                  <IconButton
                    icon={<FaChevronRight />}
                    onClick={() => handlePageChange(currentPage + 1)}
                    isDisabled={currentPage === totalPages}
                    aria-label="Next"
                  />
                </ButtonGroup>
              </Flex>
            </Flex>
          </Box>
        )}

        {/* Modal Form */}
        <Modal isOpen={isOpen} onClose={onClose} size="sm" isCentered>
          <ModalOverlay backdropFilter="blur(2px)" />
          <ModalContent borderRadius="lg">
            <ModalHeader fontSize="md">{editingDistrict ? "Edit District" : "Create District"}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Stack spacing={3}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">District Name</FormLabel>
                  <Input
                    size="sm"
                    placeholder="e.g. Metro Manila East"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </FormControl>
                <SimpleGrid columns={2} spacing={3}>
                  <FormControl>
                    <FormLabel fontSize="sm">Latitude</FormLabel>
                    <Input
                      size="sm"
                      type="number"
                      placeholder="0.0000"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm">Longitude</FormLabel>
                    <Input
                      size="sm"
                      type="number"
                      placeholder="0.0000"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    />
                  </FormControl>
                </SimpleGrid>
              </Stack>
            </ModalBody>
            <ModalFooter bg="gray.50" borderBottomRadius="lg" py={2}>
              <Button size="sm" variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
              <Button size="sm" colorScheme="blue" onClick={handleSave}>Save</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
        {/* Delete Confirmation Dialog */}
        <AlertDialog
          isOpen={isDeleteOpen}
          leastDestructiveRef={cancelRef}
          onClose={onDeleteClose}
          isCentered
        >
          <AlertDialogOverlay backdropFilter="blur(2px)">
            <AlertDialogContent borderRadius="lg">
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Delete District
              </AlertDialogHeader>

              <AlertDialogBody>
                Are you sure? This action cannot be undone.
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onDeleteClose} size="sm">
                  Cancel
                </Button>
                <Button colorScheme="red" onClick={confirmDelete} ml={3} size="sm">
                  Delete
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
        {/* Delete Confirmation Dialog */}
        <AlertDialog
          isOpen={isDeleteOpen}
          leastDestructiveRef={cancelRef}
          onClose={onDeleteClose}
          isCentered
        >
          <AlertDialogOverlay backdropFilter="blur(2px)">
            <AlertDialogContent borderRadius="lg">
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Delete District
              </AlertDialogHeader>

              <AlertDialogBody>
                Are you sure? This action cannot be undone.
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onDeleteClose} size="sm">
                  Cancel
                </Button>
                <Button colorScheme="red" onClick={confirmDelete} ml={3} size="sm">
                  Delete
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Container>
    </Box>
  );
};

export default Districts;
