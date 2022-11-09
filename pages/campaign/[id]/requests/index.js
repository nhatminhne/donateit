import React, { useState, useEffect } from "react";
import Head from "next/head";
import NextLink from "next/link";
import NextImage from "next/image";
import { useRouter } from "next/router";
import { getETHPrice, getWEIPriceInUSD } from "../../../../lib/getETHPrice";
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
import loadBlockchainData from "../../../../src/factory";
import filterWithdrawal, { contributorsCount } from "../../../../src/filterWithdrawal";
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
  campaignId,
  disabled,
  ETHPrice,
  campaign,
  charityContract,
}) => {
  const router = useRouter();
  const readyToFinalize = request.approveCount > approversCount / 2;
  const [errorMessageApprove, setErrorMessageApprove] = useState();
  const [loadingApprove, setLoadingApprove] = useState(false);
  const [errorMessageFinalize, setErrorMessageFinalize] = useState();
  const [loadingFinalize, setLoadingFinalize] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isContributor, setIsContributor] = useState(false)
  const wallet = useWallet();

  useEffect(() => {
    checking()
  }, [wallet])

  //check if the viewer is the contributor for this campaign
  const checking = async () => {
    setIsContributor(false)
    const contributionCount = await charityContract.methods.contributionCount().call()
    for(let i = 1; i <= contributionCount; i++) {
      const contributor = await charityContract.methods.contributions(i).call()
      if(contributor.campaignId == campaignId && contributor.owner == wallet.account) {
        //console.log("con: ",contributor)
        setIsContributor(true)
      }
    }

    //check if the withdrawal is approved
    if(wallet.status == "connected") {
      const withdrawalApprover = await charityContract.methods.withdrawalApprovers(wallet.account.toString()).call()
      if(withdrawalApprover == campaignId) {
        setIsApproved(true)
      } else {
        setIsApproved(false)
      }
    }
  }

  const onApprove = async () => {
    setLoadingApprove(true);
    try {
      /*const campaign = Campaign(campaignId);
      const accounts = await web3.eth.getAccounts();
      await campaign.methods.approveRequest(id).send({
        from: accounts[0],
      });
      router.reload();*/
      await charityContract.methods
        .approveWithdrawal(request.id)
        .send({
          from: wallet.account,
        });
        router.reload();
    } catch (err) {
      setErrorMessageApprove(err.message);
    } finally {
      setLoadingApprove(false);
    }
  };

  const onFinalize = async () => {
    setLoadingFinalize(true);
    try {      
      await charityContract.methods
        .getWithdrawal(request.id)
        .send({
          from: wallet.account,
        });
      router.reload();
    } catch (err) {
      setErrorMessageFinalize(err.message);
    } finally {
      setLoadingFinalize(false);
    }
  };

  return (
    <Tr
      bg={
        readyToFinalize && !request.complete
          ? useColorModeValue("blue.100", "blue.700")
          : useColorModeValue("gray.100", "gray.700")
      }
      opacity={request.complete ? "0.4" : "1"}
    >
      <Td>{id} </Td>
      <Td>{request.description}</Td>
      <Td isNumeric>
        {Web3.utils.fromWei(request.amount, "ether")}ETH ($
        {getWEIPriceInUSD(ETHPrice, request.amount)})
      </Td>
      <Td>
        <Link
          color="blue.500"
          href="/"
          isExternal
        >
          {" "}
          {campaign.owner.substr(0, 10) + "..."}
        </Link>
      </Td>
      <Td>
        {request.approveCount}/{approversCount}
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
          {request.isApprove ? (
            <Tooltip
              label="This Request has been approved, it may then have less no of approvers"
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
              isDisabled={disabled || request.approvalCount == approversCount || wallet.status !== "connected" | !isContributor || isApproved}
              isLoading={loadingApprove}
            >
              Approve
            </Button>
          )}
        </HStack>
      </Td>
      <Td>
        <Tooltip
          label={errorMessageFinalize}
          bg={useColorModeValue("white", "gray.700")}
          placement={"top"}
          color={useColorModeValue("gray.800", "white")}
          fontSize={"1em"}
        >
          <WarningIcon
            color={useColorModeValue("red.600", "red.300")}
            display={errorMessageFinalize ? "inline-block" : "none"}
            mr="2"
          />
        </Tooltip>
        {request.isWithdraw ? (
          <Tooltip
              label="This Request has been finalized & withdrawn to the campaign owner in 12 hours, it may then have less no of approvers"
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
          <HStack spacing={2}>
            <Button
              colorScheme="blue"
              variant="outline"
              _hover={{
                bg: "blue.600",
                color: "white",
              }}
              isDisabled={disabled || (!request.complete && !readyToFinalize) || wallet.account !== campaign.owner}
              onClick={onFinalize}
              isLoading={loadingFinalize}
            >
              Finalize
            </Button>

            <Tooltip
              label="This Request is ready to be Finalized because it has been approved by 50% Approvers"
              bg={useColorModeValue("white", "gray.700")}
              placement={"top"}
              color={useColorModeValue("gray.800", "white")}
              fontSize={"1.2em"}
            >
              <InfoIcon
                as="span"
                color={useColorModeValue("blue.800", "white")}
                display={
                  readyToFinalize && !request.complete ? "inline-block" : "none"
                }
              />
            </Tooltip>
          </HStack>
        )}
      </Td>
    </Tr>
  );
};

export default function Requests() {
  const router = useRouter();
  const wallet = useWallet();
  const campaignId = router.query.id;
  const [requestsList, setRequestsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [name, setName] = useState('')
  const [approversCount, setApproversCount] = useState(0)
  const [ETHPrice, updateEthPrice] = useState(0);
  const [FundNotAvailable, setFundNotAvailable] = useState(false);
  const [campaign, setCampaign] = useState([]);
  const [charityContract, setCharityContract] = useState([]);
  const [isOwner, setIsOwner] = useState(true);

  useEffect(() => {
    //getRequests();
    campaignId && getContract(getCampaign)
    if (balance == 0) {
      setFundNotAvailable(true);
    }
  }, [campaignId]);

  /*useEffect(() => {
    setIsOwner(false)
    if(wallet.status == "connected") {
      try {
        if(wallet.account == campaign.owner) {
          setIsOwner(true)
        }
      }catch(err) {}
    }
  }, [wallet.account])*/

  async function getContract(callback) {
    const contractCharity = await loadBlockchainData()
    setCharityContract(contractCharity)
    callback(contractCharity)
    //console.log("contractCharity", contractCharity)
  }

  async function getCampaign(contractCharity) {
    const ETHPrice = await getETHPrice();
    updateEthPrice(ETHPrice);

    //try{
      const tmpCampaign = await contractCharity.methods.campaigns(campaignId).call();
      
      setBalance(tmpCampaign.balance)
      setName(tmpCampaign.name)
      if (tmpCampaign.balance > 0) {
        setFundNotAvailable(false);
        setIsLoading(false);
      }
      //console.log(tmpCampaign)
      setCampaign(tmpCampaign)
      const tmpApproversCount = tmpCampaign.donateCount
      setApproversCount(tmpApproversCount)
    //}catch{
      //setCampaign({})
    //}
   
    const tmpWithdrawals = await filterWithdrawal(campaignId)
    setRequestsList(tmpWithdrawals || [])
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
                <NextLink href={`/campaign/${campaignId}`}>
                  Back to Campaign
                </NextLink>
              </Text>
            </Box>
            <Spacer />
            <Box py="4">
              Campaign Balance :{" "}
              <Text as="span" fontWeight={"bold"} fontSize="lg">
                {balance > 0
                  ? Web3.utils.fromWei(balance, "ether")
                  : "0, Become a Donor 😄"}
              </Text>
              <Text
                as="span"
                display={balance > 0 ? "inline" : "none"}
                pr={2}
                fontWeight={"bold"}
                fontSize="lg"
              >
                {" "}
                ETH
              </Text>
              <Text
                as="span"
                display={balance > 0 ? "inline" : "none"}
                fontWeight={"normal"}
                color={useColorModeValue("gray.500", "gray.200")}
              >
                (${getWEIPriceInUSD(ETHPrice, balance)})
              </Text>
            </Box>
          </Flex>
          {FundNotAvailable ? (
            <Alert status="error" my={4}>
              <AlertIcon />
              <AlertDescription>
                The Current Balance of the Campaign is 0, Please Contribute to
                approve and finalize Requests.
              </AlertDescription>
            </Alert>
          ) : null}
        </Container>
        {requestsList.length > 0 ? (
          <Container px={{ base: "4", md: "12" }} maxW={"7xl"} align={"left"}>
            <Flex flexDirection={{ base: "column", lg: "row" }} py={4}>
              <Box py="2" pr="2">
                <Heading
                  textAlign={useBreakpointValue({ base: "left" })}
                  fontFamily={"heading"}
                  color={useColorModeValue("gray.800", "white")}
                  as="h3"
                  isTruncated
                  maxW={"3xl"}
                >
                  Withdrawal Requests for {name} Campaign
                </Heading>
              </Box>
              <Spacer />
              {wallet.account == campaign.owner ? (
                <Box py="2">
                <NextLink href={`/campaign/${campaignId}/requests/new`}>
                  <Button
                    display={{ sm: "inline-flex" }}
                    justify={"flex-end"}
                    fontSize={"md"}
                    fontWeight={600}
                    color={"white"}
                    bg={"blue.400"}
                    href={"#"}
                    _hover={{
                      bg: "blue.300",
                    }}
                  >
                    Add Withdrawal Request
                  </Button>
                </NextLink>
              </Box>
              ) : null}
            </Flex>{" "}
            <Box overflowX="auto">
              <Table>
                <Thead>
                  <Tr>
                    <Th>ID</Th>
                    <Th w="30%">Description</Th>
                    <Th isNumeric>Amount</Th>
                    <Th maxW="12%" isTruncated>
                      Recipient Wallet Address
                    </Th>
                    <Th>Approval Count </Th>
                    <Th>Approve </Th>
                    <Th>Finalize </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {requestsList.map((request, index) => {
                    return (
                      <RequestRow
                        key={request.id}
                        id={request.id}
                        request={request}
                        approversCount={approversCount}
                        campaignId={request.campaignId}
                        disabled={FundNotAvailable}
                        ETHPrice={ETHPrice}
                        campaign={campaign}
                        charityContract={charityContract}
                      />
                    );
                  })}
                </Tbody>
                <TableCaption textAlign="left" ml="-2">
                  Found {requestsList.length} Requests
                </TableCaption>
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
                requestsList.length === 0 && !isLoading ? "block" : "none"
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
                <Heading
                  textAlign={"center"}
                  color={useColorModeValue("gray.800", "white")}
                  as="h4"
                  size="md"
                >
                  No Requests yet for {name} Campaign
                </Heading>
                {isOwner ? (
                  <>
                    <Text
                      textAlign={useBreakpointValue({ base: "center" })}
                      color={useColorModeValue("gray.600", "gray.300")}
                      fontSize="sm"
                    >
                      Create a Withdrawal Request to Withdraw funds from the
                    Campaign😄
                    </Text>
                    <Button
                      fontSize={"md"}
                      fontWeight={600}
                      color={"white"}
                      bg={"blue.400"}
                      _hover={{
                        bg: "blue.300",
                    }}
                    >
                    <NextLink href={`/campaign/${campaignId}/requests/new`}>
                      Create Withdrawal Request
                    </NextLink>
                    </Button>
                  </>
                ) : null}
                <Button
                  fontSize={"md"}
                  fontWeight={600}
                  color={"white"}
                  bg={"gray.400"}
                  _hover={{
                    bg: "gray.300",
                  }}
                >
                  <NextLink href={`/campaign/${campaignId}`}>
                    Go to Campaign
                  </NextLink>
                </Button>
              </SimpleGrid>
            </Container>
          </div>
        )}
      </main>
    </div>
  );
}
