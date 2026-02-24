import React, { useState, useEffect } from "react";
import {
    Box,
    Flex,
    Text,
    VStack,
    HStack,
    Icon,
    Button,
    IconButton,
    useToast,
    Progress,
    Badge,
    Divider,
    Switch,
    Select,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableContainer,
    Input as ChakraInput
} from "@chakra-ui/react";
import { FaSync, FaDatabase, FaCheckCircle, FaExclamationTriangle, FaCalendarAlt, FaMapPin, FaListAlt, FaCompass } from "react-icons/fa";
import axios from "axios";

const envApiUrl = process.env.REACT_APP_API_URL || "";
const API_BASE = (envApiUrl === "/" ? "" : (envApiUrl || "http://localhost:3001")) + "/api";

const Settings = () => {
    const toast = useToast();
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState(null);
    const [syncStats, setSyncStats] = useState({ percentage: 0, currentDistrict: "", currentLocale: "" });
    const [syncStuck, setSyncStuck] = useState(false); // true when server returns 409

    // Scheduler state
    // Scheduler state
    const [schedulerStatus, setSchedulerStatus] = useState(null);
    const [schedulerLoading, setSchedulerLoading] = useState(false);
    const [selectedCron, setSelectedCron] = useState("0 0 * * *");

    const CRON_OPTIONS = [
        { label: "Every day at 12:00 AM (Midnight)", value: "0 0 * * *" },
        { label: "Every day at 2:00 AM", value: "0 2 * * *" },
        { label: "Every day at 3:00 AM", value: "0 3 * * *" },
        { label: "Every 6 hours", value: "0 */6 * * *" },
        { label: "Every 12 hours", value: "0 */12 * * *" },
    ];

    // Reference Point state
    const [refPoint, setRefPoint] = useState({ lat: 14.6508, lng: 121.0505, name: "Templo Central" });
    const [auditLogs, setAuditLogs] = useState([]);

    const fetchSchedulerStatus = async () => {
        try {
            const { data } = await axios.get(`${API_BASE}/scheduler/status`);
            setSchedulerStatus(data);
            if (data.cronExpression) setSelectedCron(data.cronExpression);
        } catch { /* silent */ }
    };

    const fetchRefPoint = async () => {
        try {
            const { data } = await axios.get(`${API_BASE}/config/reference-point`);
            setRefPoint(data);
        } catch { /* silent */ }
    };

    const fetchAuditLogs = async () => {
        try {
            const [logsRes] = await Promise.all([
                axios.get(`${API_BASE}/audit/logs`),
                axios.get(`${API_BASE}/audit/history`) // keeping call for side effect or simplify if truly unneeded
            ]);
            setAuditLogs(logsRes.data);
        } catch { /* silent */ }
    };

    useEffect(() => {
        fetchSchedulerStatus();
        fetchRefPoint();
        fetchAuditLogs();
    }, []);

    const updateRefPoint = async () => {
        try {
            await axios.post(`${API_BASE}/config/reference-point`, refPoint);
            toast({ title: "Reference Point Updated", status: "success", duration: 3000 });
        } catch (err) {
            toast({ title: "Error", description: "Failed to update coordinates.", status: "error" });
        }
    };

    const handleSchedulerToggle = async (enable) => {
        setSchedulerLoading(true);
        try {
            if (enable) {
                await axios.post(`${API_BASE}/scheduler/enable`, { cronExpression: selectedCron });
                toast({ title: "Scheduler Enabled", description: "Auto-sync will run as scheduled.", status: "success", duration: 3000 });
            } else {
                await axios.post(`${API_BASE}/scheduler/disable`);
                toast({ title: "Scheduler Disabled", description: "Auto-sync has been turned off.", status: "warning", duration: 3000 });
            }
            await fetchSchedulerStatus();
        } catch (err) {
            toast({ title: "Error", description: err.response?.data?.message || "Failed to update scheduler.", status: "error", duration: 3000 });
        } finally {
            setSchedulerLoading(false);
        }
    };

    const handleResetSync = async () => {
        try {
            const { data } = await axios.post(`${API_BASE}/sync/reset`);
            setSyncStuck(false);
            toast({
                title: "Sync Reset",
                description: data.message,
                status: "success",
                duration: 4000,
                isClosable: true,
                position: "top-right"
            });
        } catch (err) {
            toast({ title: "Reset Failed", description: err.response?.data?.message || "Could not reset sync status.", status: "error", duration: 4000, isClosable: true, position: "top-right" });
        }
    };

    const handleSync = async () => {
        setIsSyncing(true);
        setSyncResult(null);
        setSyncStats({ percentage: 0, currentDistrict: "Initializing..." });

        const customToast = (title, description, status) => {
            const bg = status === "success" ? "emerald.500" : status === "error" ? "red.500" : "blue.500";
            const icon = status === "success" ? FaCheckCircle : status === "error" ? FaExclamationTriangle : FaSync;

            toast({
                position: "top-right",
                duration: 5000,
                render: () => (
                    <Box
                        bg={bg}
                        p={5}
                        color="white"
                        borderRadius="2xl"
                        shadow="2xl"
                        backdropFilter="blur(15px)"
                        border="1px solid rgba(255,255,255,0.2)"
                        maxW="400px"
                        m={4}
                    >
                        <Flex align="start" gap={4}>
                            <Box flexShrink={0} mt={1}>
                                <Icon as={icon} w={5} h={5} />
                            </Box>
                            <VStack align="start" spacing={1} flex="1">
                                <Text fontWeight="black" fontSize="sm" lineHeight="tight">{title}</Text>
                                <Text fontSize="xs" opacity={0.9} fontWeight="medium">{description}</Text>
                            </VStack>
                            <IconButton
                                icon={<Text fontSize="xs">✕</Text>}
                                variant="ghost"
                                size="xs"
                                color="white"
                                _hover={{ bg: "whiteAlpha.200" }}
                                onClick={() => toast.closeAll()}
                                aria-label="Close"
                                flexShrink={0}
                            />
                        </Flex>
                    </Box>
                )
            });
        };

        customToast(
            "Synchronization Started",
            "Updating districts and congregations. This may take several minutes.",
            "info"
        );

        // Polling Progress
        const pollInterval = setInterval(async () => {
            try {
                const { data } = await axios.get(`${API_BASE}/sync/progress`);
                setSyncStats({
                    percentage: data.percentage,
                    currentDistrict: data.currentDistrict,
                    currentLocale: data.currentLocale || ""
                });
                if (data.status === "completed" || data.status === "failed") {
                    clearInterval(pollInterval);
                }
            } catch (error) {
                console.error("Poll error:", error);
            }
        }, 1500);

        try {
            const { data } = await axios.post(`${API_BASE}/sync/directory`);
            setSyncResult(data);
            setSyncStats({ percentage: 100, currentDistrict: "Done!" });
            customToast("Sync Successful", data.message, "success");
        } catch (error) {
            console.error("Sync error:", error);
            const status = error.response?.status;
            if (status === 409) {
                setSyncStuck(true);   // ← show the reset button
                customToast(
                    "Sync Already Running",
                    "A synchronization is already in progress. If it appears stuck, use the \"Force Reset\" button below.",
                    "info"
                );
            } else {
                customToast(
                    "Sync Failed",
                    error.response?.data?.error || error.response?.data?.message || "An unexpected error occurred during synchronization.",
                    "error"
                );
            }
        } finally {
            setIsSyncing(false);
            clearInterval(pollInterval);
        }
    };

    return (
        <Box
            w="100%"
            h="100vh"
            backgroundImage="url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')"
            backgroundSize="cover"
            backgroundPosition="center"
            position="relative"
            overflow="hidden"
        >
            {/* Background Overlay */}
            <Box
                position="absolute"
                top="0"
                left="0"
                w="100%"
                h="100%"
                bgGradient="radial(circle at center, transparent, rgba(0,0,0,0.7))"
                backdropFilter="brightness(0.6)"
            />

            <Flex flex="1" justify="center" align="start" overflowY="auto" pt={10} pb={20}>
                <Box
                    w="100%"
                    maxW="1000px"
                    bg="rgba(255, 255, 255, 0.95)"
                    backdropFilter="blur(20px)"
                    borderRadius="3xl"
                    p={2}
                    shadow="2xl"
                    border="1px solid rgba(255, 255, 255, 0.4)"
                >
                    <Tabs isFitted variant="soft-rounded" colorScheme="blue">
                        <TabList p={4} gap={4}>
                            <Tab borderRadius="2xl" fontWeight="black" fontSize="xs">
                                <HStack><Icon as={FaDatabase} /><Text>DATA REFRESH</Text></HStack>
                            </Tab>
                            <Tab borderRadius="2xl" fontWeight="black" fontSize="xs">
                                <HStack><Icon as={FaCompass} /><Text>MAP CONFIG</Text></HStack>
                            </Tab>
                            <Tab borderRadius="2xl" fontWeight="black" fontSize="xs" onClick={fetchAuditLogs}>
                                <HStack><Icon as={FaListAlt} /><Text>AUDIT LOGS</Text></HStack>
                            </Tab>
                        </TabList>

                        <TabPanels>
                            {/* PANEL 1: DATA REFRESH & SCHEDULER */}
                            <TabPanel p={8}>
                                <VStack spacing={8} align="stretch">
                                    <HStack spacing={4}>
                                        <Box p={3} bg="blue.500" borderRadius="2xl" color="white" shadow="lg">
                                            <FaDatabase size={24} />
                                        </Box>
                                        <VStack align="start" spacing={0}>
                                            <Text fontSize="xl" fontWeight="black" color="gray.800">Directory Generation</Text>
                                            <Text fontSize="sm" color="gray.500" fontWeight="medium">Update Local Database from Official INC Directory</Text>
                                        </VStack>
                                    </HStack>

                                    <Box p={6} bg="blue.50" borderRadius="2xl" border="1px dashed" borderColor="blue.200">
                                        <VStack spacing={4} align="start">
                                            <HStack spacing={3} color="blue.700">
                                                <FaExclamationTriangle />
                                                <Text fontWeight="bold" fontSize="sm">Synchronization Policy</Text>
                                            </HStack>
                                            <Text fontSize="sm" color="blue.600">
                                                This process will scrape the official directory and update your local tables.
                                                <strong> Existing IDs are preserved</strong> to maintain compatibility.
                                            </Text>
                                        </VStack>
                                    </Box>

                                    <Box>
                                        {isSyncing ? (
                                            <VStack spacing={6} py={10}>
                                                <Box w="100%" position="relative">
                                                    <Progress
                                                        size="lg"
                                                        value={syncStats.percentage}
                                                        borderRadius="full"
                                                        colorScheme="blue"
                                                        bg="blue.100"
                                                        hasStripe
                                                        isAnimated
                                                    />
                                                    <Text position="absolute" top="-25px" right="0" fontSize="sm" fontWeight="black" color="blue.600">
                                                        {syncStats.percentage}%
                                                    </Text>
                                                </Box>
                                                <VStack spacing={2}>
                                                    <Text fontWeight="black" color="blue.600" letterSpacing="widest" fontSize="sm" textTransform="uppercase">
                                                        District: {syncStats.currentDistrict}
                                                    </Text>
                                                    {syncStats.currentLocale && (
                                                        <Text fontSize="xs" color="blue.400" fontWeight="bold" textTransform="uppercase">
                                                            ↳ Enriching: {syncStats.currentLocale}
                                                        </Text>
                                                    )}
                                                </VStack>
                                            </VStack>
                                        ) : (
                                            <VStack spacing={3} w="100%">
                                                <Button
                                                    size="lg"
                                                    w="100%"
                                                    colorScheme="blue"
                                                    leftIcon={<FaSync />}
                                                    onClick={handleSync}
                                                    borderRadius="2xl"
                                                    h="70px"
                                                    fontSize="lg"
                                                    fontWeight="black"
                                                    shadow="xl"
                                                >
                                                    GENERATE DATA
                                                </Button>
                                                {syncStuck && (
                                                    <Button
                                                        size="sm"
                                                        w="100%"
                                                        colorScheme="orange"
                                                        variant="outline"
                                                        leftIcon={<FaExclamationTriangle />}
                                                        onClick={handleResetSync}
                                                        borderRadius="xl"
                                                        fontWeight="black"
                                                        borderStyle="dashed"
                                                        fontSize="xs"
                                                    >
                                                        FORCE RESET STUCK SYNC — Click if sync appears permanently stuck
                                                    </Button>
                                                )}
                                            </VStack>
                                        )}
                                    </Box>

                                    {syncResult && (
                                        <Box p={6} bg="green.50" borderRadius="2xl" border="1px solid" borderColor="green.200">
                                            <HStack color="green.600" spacing={2} mb={4}>
                                                <FaCheckCircle />
                                                <Text fontWeight="black">SYNC RESULTS</Text>
                                                <Badge colorScheme="green" ml="auto" borderRadius="full" px={3}>COMPLETE</Badge>
                                            </HStack>
                                            <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
                                                <VStack align="start" spacing={0} p={3} bg="white" borderRadius="xl" border="1px solid" borderColor="green.100">
                                                    <Text fontSize="9px" color="green.600" fontWeight="black" letterSpacing="wider">DISTRICTS PROCESSED</Text>
                                                    <Text fontSize="2xl" fontWeight="black">{syncResult.stats.districtsProcessed}</Text>
                                                    <Text fontSize="9px" color="gray.400">{syncResult.stats.districtsCreated} new</Text>
                                                </VStack>
                                                <VStack align="start" spacing={0} p={3} bg="white" borderRadius="xl" border="1px solid" borderColor="green.100" shadow="sm">
                                                    <Text fontSize="9px" color="green.600" fontWeight="black" letterSpacing="wider">ACTIVE LOCALES FOUND</Text>
                                                    <Text fontSize="2xl" fontWeight="black">{syncResult.stats.localesProcessed.toLocaleString()}</Text>
                                                    <Text fontSize="9px" color="gray.400">{syncResult.stats.localesCreated} newly added</Text>
                                                </VStack>
                                                <VStack align="start" spacing={0} p={3} bg="blue.50" borderRadius="xl" border="1px solid" borderColor="blue.100">
                                                    <Text fontSize="9px" color="blue.600" fontWeight="black" letterSpacing="wider">RE-ACTIVATED LOCALES</Text>
                                                    <Text fontSize="2xl" fontWeight="black" color="blue.600">{syncResult.stats.localesReactivated ?? 0}</Text>
                                                    <Text fontSize="9px" color="blue.400">Returned to site</Text>
                                                </VStack>
                                                <VStack align="start" spacing={0} p={3} bg="orange.50" borderRadius="xl" border="1px solid" borderColor="orange.200">
                                                    <Text fontSize="9px" color="orange.600" fontWeight="black" letterSpacing="wider">STALE LOCALES HIDDEN</Text>
                                                    <Text fontSize="2xl" fontWeight="black" color="orange.600">{syncResult.stats.localesDeactivated ?? 0}</Text>
                                                    <Text fontSize="9px" color="orange.400">Preserved in DB</Text>
                                                </VStack>
                                                <VStack align="start" spacing={0} p={3} bg="yellow.50" borderRadius="xl" border="1px solid" borderColor="yellow.200">
                                                    <Text fontSize="9px" color="yellow.700" fontWeight="black" letterSpacing="wider">OFFICIAL EXTENSIONS</Text>
                                                    <Text fontSize="2xl" fontWeight="black" color="yellow.700">{syncResult.stats.extFound ?? 0}</Text>
                                                    <Text fontSize="9px" color="yellow.600">Included in Total</Text>
                                                </VStack>
                                                <VStack align="start" spacing={0} p={3} bg="purple.50" borderRadius="xl" border="1px solid" borderColor="purple.200">
                                                    <Text fontSize="9px" color="purple.600" fontWeight="black" letterSpacing="wider">OFFICIAL GWS</Text>
                                                    <Text fontSize="2xl" fontWeight="black" color="purple.600">{syncResult.stats.gwsFound ?? 0}</Text>
                                                    <Text fontSize="9px" color="purple.400">Included in Total</Text>
                                                </VStack>
                                            </SimpleGrid>
                                        </Box>
                                    )}


                                    <Divider />

                                    {/* Scheduler Section */}
                                    <Box>
                                        <Flex justify="space-between" align="center" mb={5}>
                                            <HStack spacing={4}>
                                                <Box p={3} bg="purple.500" borderRadius="2xl" color="white" shadow="lg">
                                                    <FaCalendarAlt size={24} />
                                                </Box>
                                                <VStack align="start" spacing={0}>
                                                    <Text fontSize="xl" fontWeight="black" color="gray.800">Auto-Sync Scheduler</Text>
                                                    <Text fontSize="sm" color="gray.500" fontWeight="medium">Scheduled background synchronization</Text>
                                                </VStack>
                                            </HStack>
                                            <Switch
                                                colorScheme="purple"
                                                size="lg"
                                                isChecked={schedulerStatus?.enabled || false}
                                                isDisabled={schedulerLoading}
                                                onChange={(e) => handleSchedulerToggle(e.target.checked)}
                                            />
                                        </Flex>

                                        <VStack spacing={4} align="stretch">
                                            <Select
                                                value={selectedCron}
                                                onChange={(e) => setSelectedCron(e.target.value)}
                                                borderRadius="xl"
                                                fontWeight="bold"
                                                isDisabled={schedulerStatus?.enabled || schedulerLoading}
                                            >
                                                {CRON_OPTIONS.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </Select>

                                            {schedulerStatus && (
                                                <SimpleGrid columns={2} spacing={4}>
                                                    <Box p={4} bg="gray.50" borderRadius="2xl" border="1px solid" borderColor="gray.200">
                                                        <Text fontSize="9px" fontWeight="black" color="gray.500">LAST RUN</Text>
                                                        <Text fontSize="sm" fontWeight="black">{schedulerStatus.lastRun ? new Date(schedulerStatus.lastRun).toLocaleString() : "Never"}</Text>
                                                        <Badge colorScheme={schedulerStatus.lastRunStatus === "success" ? "green" : "red"}>{schedulerStatus.lastRunStatus}</Badge>
                                                    </Box>
                                                    <Box p={4} bg="purple.50" borderRadius="2xl" border="1px solid" borderColor="purple.200">
                                                        <Text fontSize="9px" fontWeight="black" color="purple.500">NEXT RUN</Text>
                                                        <Text fontSize="sm" fontWeight="black">{schedulerStatus.enabled ? new Date(schedulerStatus.nextRun).toLocaleString() : "—"}</Text>
                                                        <Text fontSize="9px" color="purple.400">{schedulerStatus.description}</Text>
                                                    </Box>
                                                </SimpleGrid>
                                            )}
                                        </VStack>
                                    </Box>
                                </VStack>
                            </TabPanel>

                            {/* PANEL 2: MAP CONFIGURATION */}
                            <TabPanel p={8}>
                                <VStack spacing={8} align="stretch">
                                    <HStack spacing={4}>
                                        <Box p={3} bg="red.500" borderRadius="2xl" color="white" shadow="lg">
                                            <FaMapPin size={24} />
                                        </Box>
                                        <VStack align="start" spacing={0}>
                                            <Text fontSize="xl" fontWeight="black" color="gray.800">Distance Reference Point</Text>
                                            <Text fontSize="sm" color="gray.500" fontWeight="medium">Set the point used for distance & travel calculations</Text>
                                        </VStack>
                                    </HStack>

                                    <Box p={6} borderRadius="3xl" bg="gray.50" border="1px solid" borderColor="gray.200">
                                        <VStack spacing={6} align="stretch">
                                            <Box>
                                                <Text fontSize="xs" fontWeight="black" color="gray.400" mb={2}>LOCATION NAME</Text>
                                                <ChakraInput
                                                    value={refPoint.name}
                                                    onChange={(e) => setRefPoint({ ...refPoint, name: e.target.value })}
                                                    bg="white"
                                                    borderRadius="xl"
                                                    fontWeight="bold"
                                                />
                                            </Box>
                                            <SimpleGrid columns={2} spacing={6}>
                                                <Box>
                                                    <Text fontSize="xs" fontWeight="black" color="gray.400" mb={2}>LATITUDE</Text>
                                                    <ChakraInput
                                                        type="number"
                                                        value={refPoint.lat}
                                                        onChange={(e) => setRefPoint({ ...refPoint, lat: parseFloat(e.target.value) })}
                                                        bg="white"
                                                        borderRadius="xl"
                                                        fontWeight="bold"
                                                    />
                                                </Box>
                                                <Box>
                                                    <Text fontSize="xs" fontWeight="black" color="gray.400" mb={2}>LONGITUDE</Text>
                                                    <ChakraInput
                                                        type="number"
                                                        value={refPoint.lng}
                                                        onChange={(e) => setRefPoint({ ...refPoint, lng: parseFloat(e.target.value) })}
                                                        bg="white"
                                                        borderRadius="xl"
                                                        fontWeight="bold"
                                                    />
                                                </Box>
                                            </SimpleGrid>
                                            <Button
                                                colorScheme="red"
                                                h="60px"
                                                borderRadius="2xl"
                                                fontWeight="black"
                                                onClick={updateRefPoint}
                                            >
                                                SAVE REFERENCE POINT
                                            </Button>
                                        </VStack>
                                    </Box>
                                </VStack>
                            </TabPanel>

                            {/* PANEL 3: AUDIT LOGS */}
                            <TabPanel p={8}>
                                <VStack spacing={8} align="stretch">
                                    <HStack spacing={4}>
                                        <Box p={3} bg="gray.800" borderRadius="2xl" color="white" shadow="lg">
                                            <FaListAlt size={24} />
                                        </Box>
                                        <VStack align="start" spacing={0}>
                                            <Text fontSize="xl" fontWeight="black" color="gray.800">Change Audit Logs</Text>
                                            <Text fontSize="sm" color="gray.500" fontWeight="medium">Track data changes detected during synchronization</Text>
                                        </VStack>
                                    </HStack>

                                    <TableContainer borderRadius="2xl" border="1px solid" borderColor="gray.200">
                                        <Table variant="simple" size="sm">
                                            <Thead bg="gray.50">
                                                <Tr>
                                                    <Th>LOCALE</Th>
                                                    <Th>FIELD</Th>
                                                    <Th>OLD VALUE</Th>
                                                    <Th>NEW VALUE</Th>
                                                    <Th>TIMESTAMP</Th>
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                {auditLogs.length > 0 ? auditLogs.map(log => (
                                                    <Tr key={log.id}>
                                                        <Td fontWeight="bold">{log.locale_name}</Td>
                                                        <Td><Badge colorScheme="blue">{log.field_name}</Badge></Td>
                                                        <Td fontSize="10px" maxW="150px" isTruncated color="gray.500">{log.old_value}</Td>
                                                        <Td fontSize="10px" maxW="150px" isTruncated color="blue.600" fontWeight="bold">{log.new_value}</Td>
                                                        <Td fontSize="10px">{new Date(log.timestamp).toLocaleString()}</Td>
                                                    </Tr>
                                                )) : (
                                                    <Tr><Td colSpan={5} textAlign="center" py={10}>No changes logged yet.</Td></Tr>
                                                )}
                                            </Tbody>
                                        </Table>
                                    </TableContainer>
                                </VStack>
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                </Box>
            </Flex>
        </Box>
    );
};

export default Settings;

// Helper to use SimpleGrid which was missing from basic Chakra imports in the snippet
const SimpleGrid = ({ children, columns, spacing }) => (
    <Box display="grid" gridTemplateColumns={`repeat(${columns}, 1fr)`} gap={spacing}>
        {children}
    </Box>
);
