import React, { useState, useEffect } from "react";
import Head from "next/head";
import NextLink from "next/link";
import NextImage from "next/image";
import { useRouter } from "next/router";
import { getETHPrice, getWEIPriceInUSD } from "../../lib/getETHPrice";
import {
  Heading,
  useBreakpointValue,
  useColorModeValue,
  Text,
  Button,
  Flex,
  Container,
  SimpleGrid,
  Box,
  Spacer,
  Table,
  Thead,
  Tbody,
  Tooltip,
  Tr,
  Th,
  Td,
  TableCaption,
  Skeleton,
  Alert,
  AlertIcon,
  AlertDescription,
  HStack,
  Stack,
  Link,
} from "@chakra-ui/react";
import {
  ArrowBackIcon,
  InfoIcon,
  CheckCircleIcon,
  WarningIcon,
} from "@chakra-ui/icons";
//import web3 from "../../../../smart-contract/web3";
//import Campaign from "../../../../smart-contract/campaign";
//import factory from "../../../../smart-contract/factory";
import Web3 from "web3";
import loadBlockchainData from "../../src/factory";
import filterWithdrawal, { contributorsCount } from "../../src/filterWithdrawal";
import { useWallet } from "use-wallet";

/*export async function getServerSideProps({ params }) {
  const campaignId = params.id;
  const campaign = Campaign(campaignId);
  const requestCount = await campaign.methods.getRequestsCount().call();
  const approversCount = await campaign.methods.approversCount().call();
  const summary = await campaign.methods.getSummary().call();
  const ETHPrice = await getETHPrice();

  return {
    props: {
      campaignId,
      requestCount,
      approversCount,
      balance: summary[1],
      name: summary[5],
      ETHPrice,
    },
  };
}*/

const RequestRow = ({
  id,
  request,
  approversCount,
  ETHPrice,
  charityContract,
}) => {
  const router = useRouter();
  const readyToFinalize = request.approveCount > approversCount / 2;
  const [errorMessageApprove, setErrorMessageApprove] = useState();
  const [loadingApprove, setLoadingApprove] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const wallet = useWallet();

  useEffect(async() => {
    const campaign = await charityContract.methods.campaigns(request.campaignId).call()
    setCampaignName(campaign.name)
  }, [])

  const onApprove = async () => {
    setLoadingApprove(true);
    try {
      await charityContract.methods
        .confirmWithdrawal(request.id)
        .send({
          from: wallet.account,
          value: request.amount
        });
        router.reload();
    } catch (err) {
      setErrorMessageApprove(err.message);
    } finally {
      setLoadingApprove(false);
    }
  };

  return (
      <Tr
        bg={
          readyToFinalize && !request.complete
            ? useColorModeValue("teal.100", "teal.700")
            : useColorModeValue("gray.100", "gray.700")
        }
        opacity={request.complete ? "0.4" : "1"}
      >
        <Td>{id} </Td>
        <Td>{campaignName} </Td>
        <Td>{request.description}</Td>
        <Td isNumeric>
          {Web3.utils.fromWei(request.amount, "ether")}ETH ($
          {getWEIPriceInUSD(ETHPrice, request.amount)})
        </Td>
        <Td>
          <HStack spacing={2}>
            <Tooltip
              label={errorMessageApprove}
              bg={useColorModeValue("white", "gray.700")}
              placement={"top"}
              color={useColorModeValue("gray.800", "white")}
              fontSize={"1em"}
            >
              <WarningIcon
                color={useColorModeValue("red.600", "red.300")}
                display={errorMessageApprove ? "inline-block" : "none"}
              />
            </Tooltip>
            {request.isWithdraw == request.isCheck ? (
              <Tooltip
                label="Can't confirm now"
                bg={useColorModeValue("white", "gray.700")}
                placement={"top"}
                color={useColorModeValue("gray.800", "white")}
                fontSize={"1em"}
              >
                <CheckCircleIcon
                  color={useColorModeValue("blue.600", "blue.300")}
                />
              </Tooltip>
            ) : (
              <Button
                colorScheme="yellow"
                variant="outline"
                _hover={{
                  bg: "yellow.600",
                  color: "white",
                }}
                onClick={onApprove}
                isDisabled={wallet.status !== "connected"}
                isLoading={loadingApprove}
              >
                Confirm
              </Button>
            )}
          </HStack>
        </Td>
        <Td>
          {request.isWithdraw ? (
            <Tooltip
              bg={useColorModeValue("white", "gray.700")}
              placement={"top"}
              color={useColorModeValue("gray.800", "white")}
              fontSize={"1em"}
            >
              <CheckCircleIcon
                color={useColorModeValue("blue.600", "blue.300")}
              />
            </Tooltip>
          ) : (
            <Tooltip
              bg={useColorModeValue("white", "gray.700")}
              placement={"top"}
              color={useColorModeValue("gray.800", "white")}
              fontSize={"1em"}
            >
              <CheckCircleIcon
                color={useColorModeValue("red.600", "red.300")}
              />
            </Tooltip>
          )}
        </Td>
      </Tr>
  );
};

export default function Requests() {
  const router = useRouter();
  const wallet = useWallet();
  const campaignId = router.query.id;
  const [isLoading, setIsLoading] = useState(true);
  let requestCount = 0
  const [ETHPrice, updateEthPrice] = useState(0);
  const [withdrawals, setWithdrawals] = useState([]);
  const [charityContract, setCharityContract] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    //getRequests();
    getContract(getCampaign)
  }, []);

  useEffect(() => {
    setIsAdmin(false)
    if(wallet.status == "connected") {
      if(wallet.account == "0x2BC282e18104E50C0D3d7d432F027da30d38184C")
        setIsAdmin(true)
    }
    //console.log(isAdmin)
  }, [wallet])

  async function getContract(callback) {
    const contractCharity = await loadBlockchainData()
    setCharityContract(contractCharity)
    callback(contractCharity)
    //console.log("contractCharity", contractCharity)
  }

  async function getCampaign(contractCharity) {
    const ETHPrice = await getETHPrice();
    updateEthPrice(ETHPrice);

    const withdrawalCount = await contractCharity.methods.withdrawalCount().call()
    for (var i = 1; i <= withdrawalCount; i++) {
      const withdrawal = await contractCharity.methods.withdrawals(i).call()
      setWithdrawals(prev => [...prev, withdrawal])
    }
    setIsLoading(false);
    //console.log("with: ", withdrawalCount)
  }

  return (
    <div>
      <Head>
        <title>Campaign Withdrawal Requests</title>
        <meta name="description" content="Create a Withdrawal Request" />
        <link rel="icon" href="/logo.svg" />
      </Head>

      <main>
        <Container px={{ base: "4", md: "12" }} maxW={"7xl"} align={"left"}>
          <Flex flexDirection={{ base: "column", md: "row" }} py={4}>
            <Box py="4">
            <Text fontSize={"lg"} color={"blue.400"}>
              <ArrowBackIcon mr={2} />
              <NextLink href="/"> Back to Home</NextLink>
            </Text>
            </Box>
            <Spacer />
          </Flex>
        </Container>
        {isAdmin ? (
          withdrawals.length > 0 ? (
            <Container px={{ base: "4", md: "12" }} maxW={"7xl"} align={"left"}>
              <Flex flexDirection={{ base: "column", lg: "row" }} py={4}>
                <Spacer />
              </Flex>{" "}
              <Box overflowX="auto">
                <Table>
                  <Thead>
                    <Tr>
                      <Th>ID</Th>
                      <Th>Campaign Name</Th>
                      <Th w="30%">Description</Th>
                      <Th isNumeric>Amount</Th>
                      <Th>Confirm </Th>
                      <Th>Withdrawal </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {withdrawals.map((request, index) => {
                      return (
                        <RequestRow
                          key={request.id}
                          id={request.id}
                          request={request}
                          ETHPrice={ETHPrice}
                          charityContract={charityContract}
                        />
                      );
                    })}
                  </Tbody>
                  </Table>
              </Box>
            </Container>
          ) : (
            <div>
              <Container
                px={{ base: "4", md: "12" }}
                maxW={"7xl"}
                align={"left"}
                display={isLoading ? "block" : "none"}
              >
                <SimpleGrid rows={{ base: 3 }} spacing={2}>
                  <Skeleton height="2rem" />
                  <Skeleton height="5rem" />
                  <Skeleton height="5rem" />
                  <Skeleton height="5rem" />
                </SimpleGrid>
              </Container>
              <Container
                maxW={"lg"}
                align={"center"}
                display={
                  !isLoading ? "block" : "none"
                }
              >
                <SimpleGrid row spacing={2} align="center">
                  <Stack align="center">
                    <NextImage
                      src="/static/no-requests.png"
                      alt="no-request"
                      width="150"
                      height="150"
                    />
                  </Stack>
                </SimpleGrid>
              </Container>
            </div>
          )
        ) : null}
      </main>
    </div>
  );
}
